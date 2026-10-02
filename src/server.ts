import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { RoomManager } from './server/room-manager';
import { setupSocketHandlers } from './server/socket-handlers';

const PORT = process.env.PORT || 3000;
const dev = process.env.NODE_ENV !== 'production';

// If WS_ONLY is set, we bypass Next.js entirely (perfect for Render deployment)
const isWsOnly = process.env.WS_ONLY === 'true';

async function startServer() {
  let handle: any;

  if (!isWsOnly) {
    console.log('> Starting Next.js compilation...');
    const app = next({ dev });
    handle = app.getRequestHandler();
    await app.prepare();
    console.log('> Next.js compiled.');
  }

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    
    // Health check endpoint for "Keep-Alive" cron jobs
    if (parsedUrl.pathname === '/ping') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('pong');
      return;
    }

    // In WS_ONLY mode, we only serve a basic response for root HTTP requests
    if (isWsOnly) {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('Stream Mates WebSocket Server is Running (WS_ONLY mode)');
      return;
    }

    handle(req, res, parsedUrl);
  });

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  if (process.env.REDIS_URL) {
    const { createAdapter } = require('@socket.io/redis-adapter');
    const Redis = require('ioredis');
    const pubClient = new Redis(process.env.REDIS_URL);
    const subClient = pubClient.duplicate();
    
    pubClient.on('error', (err: any) => console.error('Redis Pub Client Error:', err));
    subClient.on('error', (err: any) => console.error('Redis Sub Client Error:', err));
    
    io.adapter(createAdapter(pubClient, subClient));
    console.log('> Redis Adapter connected for WebSockets');
  }

  const roomManager = new RoomManager();
  setupSocketHandlers(io, roomManager);

  server.listen(PORT, () => {
    console.log(`> Server ready on port ${PORT}`);
    if (isWsOnly) console.log('> Running in WebSocket-Only Mode (Next.js is disabled)');
  });
}

startServer().catch(console.error);
