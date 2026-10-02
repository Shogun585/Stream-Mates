import { createServer } from 'http';
import { parse } from 'url';
import next from 'next';
import { Server } from 'socket.io';
import { RoomManager } from './server/room-manager';
import { setupSocketHandlers } from './server/socket-handlers';

// custom server needed for Socket.IO; for Vercel deploy, will need to split WS server separately or use Vercel's edge runtime workaround
const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    
    // Health check endpoint for "Keep-Alive" cron jobs
    if (parsedUrl.pathname === '/ping') {
      res.writeHead(200, { 'Content-Type': 'text/plain' });
      res.end('pong');
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

  server.listen(process.env.PORT || 3000, () => {
    console.log(`> Ready on http://localhost:${process.env.PORT}`);
  });
});
