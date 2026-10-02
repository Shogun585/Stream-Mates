import { Server, Socket } from 'socket.io';
import { RoomManager, Participant } from './room-manager';
import { Room } from '../lib/models/room';
import { Message } from '../lib/models/message';
import { connectToDatabase } from '../lib/db';

export function setupSocketHandlers(io: Server, roomManager: RoomManager) {
  io.on('connection', (socket: Socket) => {

    // Helper for role validation
    const checkRole = async (roomCode: string, clerkId: string, allowedRoles: string[]) => {
      const room = await roomManager.getRoom(roomCode);
      if (!room) return false;
      const participant = room.participants.get(clerkId);
      if (!participant) return false;
      return allowedRoles.includes(participant.role);
    };

    socket.on('join_room', async ({ roomCode, clerkId, username, avatar }) => {
      let room = await roomManager.getRoom(roomCode);
      let role: 'host' | 'moderator' | 'participant' = 'participant';

      if (!room) {
        room = await roomManager.createRoom(roomCode);
        try {
          await connectToDatabase();
          const dbRoom = await Room.findOne({ roomCode });
          if (dbRoom && dbRoom.hostClerkId === clerkId) {
            role = 'host';
          }
        } catch (e) {
          console.error('DB lookup failed during join:', e);
        }
      } else {
        const hasHost = Array.from(room.participants.values()).some(p => p.role === 'host');
        if (!hasHost) {
          try {
            await connectToDatabase();
            const dbRoom = await Room.findOne({ roomCode });
            if (dbRoom && dbRoom.hostClerkId === clerkId) {
              role = 'host';
            }
          } catch (e) {}
        }
      }

      const newParticipant: Participant = { socketId: socket.id, clerkId, username, avatar, role };
      room.addParticipant(newParticipant);
      roomManager.mapSocket(socket.id, roomCode, clerkId);
      await roomManager.saveRoom(room);
      
      socket.join(roomCode);
      
      socket.emit('sync_state', room.getState());
      io.to(roomCode).emit('user_joined', { user: newParticipant, participants: Array.from(room.participants.values()) });
    });

    socket.on('leave_room', async () => {
      await handleDisconnect(socket);
    });

    socket.on('disconnect', async () => {
      await handleDisconnect(socket);
    });

    async function handleDisconnect(sock: Socket) {
      const { room, clerkId } = await roomManager.getRoomBySocketId(sock.id);
      if (room && clerkId) {
        const participant = room.participants.get(clerkId);
        room.removeParticipant(clerkId);
        roomManager.unmapSocket(sock.id);

        if (participant?.role === 'host' && room.participants.size > 0) {
          room.playState = 'paused';
          room.updatedAt = Date.now();
          io.to(room.roomCode).emit('sync_state', room.getState());

          const remaining = Array.from(room.participants.values());
          const newHost = remaining.find(p => p.role === 'moderator') || remaining[0];
          newHost.role = 'host';
          io.to(room.roomCode).emit('role_assigned', { participants: Array.from(room.participants.values()) });
        }

        if (room.participants.size === 0) {
          await roomManager.deleteRoom(room.roomCode);
        } else {
          await roomManager.saveRoom(room);
          io.to(room.roomCode).emit('user_left', { clerkId, participants: Array.from(room.participants.values()) });
        }
      }
    }

    socket.on('play', async (data?: { time?: number }) => {
      const { room, clerkId } = await roomManager.getRoomBySocketId(socket.id);
      if (room && clerkId && await checkRole(room.roomCode, clerkId, ['host', 'moderator'])) {
        room.playState = 'playing';
        if (data?.time != null) room.currentTime = data.time;
        room.updatedAt = Date.now();
        await roomManager.saveRoom(room);
        io.to(room.roomCode).emit('sync_state', room.getState());
      } else {
        socket.emit('error', 'Unauthorized');
      }
    });

    socket.on('pause', async (data?: { time?: number }) => {
      const { room, clerkId } = await roomManager.getRoomBySocketId(socket.id);
      if (room && clerkId && await checkRole(room.roomCode, clerkId, ['host', 'moderator'])) {
        room.playState = 'paused';
        if (data?.time != null) room.currentTime = data.time;
        room.updatedAt = Date.now();
        await roomManager.saveRoom(room);
        io.to(room.roomCode).emit('sync_state', room.getState());
      } else {
        socket.emit('error', 'Unauthorized');
      }
    });

    socket.on('seek', async (time: number) => {
      const { room, clerkId } = await roomManager.getRoomBySocketId(socket.id);
      if (room && clerkId && await checkRole(room.roomCode, clerkId, ['host', 'moderator'])) {
        room.currentTime = time;
        room.updatedAt = Date.now();
        await roomManager.saveRoom(room);
        io.to(room.roomCode).emit('sync_state', room.getState());
      } else {
        socket.emit('error', 'Unauthorized');
      }
    });

    socket.on('change_video', async (videoId: string) => {
      const { room, clerkId } = await roomManager.getRoomBySocketId(socket.id);
      if (room && clerkId && await checkRole(room.roomCode, clerkId, ['host', 'moderator'])) {
        room.videoId = videoId;
        room.currentTime = 0;
        room.playState = 'paused';
        room.updatedAt = Date.now();
        await roomManager.saveRoom(room);
        io.to(room.roomCode).emit('sync_state', room.getState());
      } else {
        socket.emit('error', 'Unauthorized');
      }
    });

    socket.on('assign_role', async ({ targetClerkId, role }) => {
      const { room, clerkId } = await roomManager.getRoomBySocketId(socket.id);
      if (room && clerkId && await checkRole(room.roomCode, clerkId, ['host'])) {
        room.assignRole(targetClerkId, role);
        await roomManager.saveRoom(room);
        io.to(room.roomCode).emit('role_assigned', { participants: Array.from(room.participants.values()) });
      } else {
        socket.emit('error', 'Unauthorized');
      }
    });

    socket.on('remove_participant', async (targetClerkId: string) => {
      const { room, clerkId } = await roomManager.getRoomBySocketId(socket.id);
      if (room && clerkId && await checkRole(room.roomCode, clerkId, ['host'])) {
        const target = room.participants.get(targetClerkId);
        if (target) {
          room.removeParticipant(targetClerkId);
          await roomManager.saveRoom(room);
          io.to(room.roomCode).emit('participant_removed', { targetClerkId, participants: Array.from(room.participants.values()) });
          io.to(target.socketId).emit('participant_removed', { targetClerkId }); 
        }
      } else {
        socket.emit('error', 'Unauthorized');
      }
    });

    socket.on('transfer_host', async (targetClerkId: string) => {
      const { room, clerkId } = await roomManager.getRoomBySocketId(socket.id);
      if (room && clerkId && await checkRole(room.roomCode, clerkId, ['host'])) {
        room.transferHost(clerkId, targetClerkId);
        await roomManager.saveRoom(room);
        io.to(room.roomCode).emit('role_assigned', { participants: Array.from(room.participants.values()) });
      } else {
        socket.emit('error', 'Unauthorized');
      }
    });

    socket.on('send_message', async ({ content, username }) => {
      const { room, clerkId } = await roomManager.getRoomBySocketId(socket.id);
      if (room && clerkId) {
        const msg = { roomCode: room.roomCode, clerkId, username, content, createdAt: new Date() };
        io.to(room.roomCode).emit('new_message', msg);
        
        await connectToDatabase();
        await Message.create(msg);
      }
    });

    socket.on('request_control', async () => {
      const { room, clerkId } = await roomManager.getRoomBySocketId(socket.id);
      if (room && clerkId) {
        const requester = room.participants.get(clerkId);
        if (requester) {
          io.to(room.roomCode).emit('control_requested', { requester });
        }
      }
    });

    socket.on('approve_request', async (targetClerkId: string) => {
      const { room, clerkId } = await roomManager.getRoomBySocketId(socket.id);
      if (room && clerkId && await checkRole(room.roomCode, clerkId, ['host'])) {
        room.transferHost(clerkId, targetClerkId);
        await roomManager.saveRoom(room);
        io.to(room.roomCode).emit('role_assigned', { participants: Array.from(room.participants.values()) });
        io.to(room.roomCode).emit('control_approved', { targetClerkId });
      }
    });

  });
}
