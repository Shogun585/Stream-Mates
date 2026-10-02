import Redis from 'ioredis';

export interface Participant {
  socketId: string;
  clerkId: string;
  username: string;
  avatar: string;
  role: 'host' | 'moderator' | 'participant';
}

export interface WatchRoomState {
  roomCode: string;
  participants: Record<string, Participant>;
  videoId: string;
  playState: 'playing' | 'paused';
  currentTime: number;
  updatedAt: number;
}

export class WatchRoom {
  roomCode: string;
  participants: Map<string, Participant>; // keyed by clerkId
  videoId: string;
  playState: 'playing' | 'paused';
  currentTime: number;
  updatedAt: number;

  constructor(roomCode: string, state?: WatchRoomState) {
    if (state) {
      this.roomCode = state.roomCode;
      this.participants = new Map(Object.entries(state.participants || {}));
      this.videoId = state.videoId;
      this.playState = state.playState;
      this.currentTime = state.currentTime;
      this.updatedAt = state.updatedAt;
    } else {
      this.roomCode = roomCode;
      this.participants = new Map();
      this.videoId = '';
      this.playState = 'paused';
      this.currentTime = 0;
      this.updatedAt = Date.now();
    }
  }

  toJSON(): WatchRoomState {
    return {
      roomCode: this.roomCode,
      participants: Object.fromEntries(this.participants),
      videoId: this.videoId,
      playState: this.playState,
      currentTime: this.currentTime,
      updatedAt: this.updatedAt
    };
  }

  addParticipant(participant: Participant) {
    this.participants.set(participant.clerkId, participant);
  }

  removeParticipant(clerkId: string) {
    this.participants.delete(clerkId);
  }

  assignRole(clerkId: string, role: 'host' | 'moderator' | 'participant') {
    const participant = this.participants.get(clerkId);
    if (participant) {
      participant.role = role;
    }
  }

  transferHost(oldHostId: string, newHostId: string) {
    const oldHost = this.participants.get(oldHostId);
    const newHost = this.participants.get(newHostId);
    if (oldHost && newHost && oldHost.role === 'host') {
      oldHost.role = 'participant';
      newHost.role = 'host';
    }
  }

  getState() {
    let currentRealTime = this.currentTime;
    if (this.playState === 'playing') {
      currentRealTime += (Date.now() - this.updatedAt) / 1000;
    }
    return {
      playState: this.playState,
      currentTime: currentRealTime,
      videoId: this.videoId,
      participants: Array.from(this.participants.values())
    };
  }
}

export class RoomManager {
  private redis: Redis | null;
  private localRooms: Map<string, WatchRoom>;
  private socketToRoom: Map<string, { roomCode: string, clerkId: string }>;

  constructor() {
    this.localRooms = new Map();
    this.socketToRoom = new Map();
    if (process.env.REDIS_URL) {
      this.redis = new Redis(process.env.REDIS_URL);
      this.redis.on('error', (err) => console.error('RoomManager Redis Error:', err));
    } else {
      this.redis = null;
    }
  }

  async createRoom(roomCode: string): Promise<WatchRoom> {
    const existing = await this.getRoom(roomCode);
    if (existing) return existing;
    
    const newRoom = new WatchRoom(roomCode);
    await this.saveRoom(newRoom);
    return newRoom;
  }

  async getRoom(roomCode: string): Promise<WatchRoom | undefined> {
    if (this.redis) {
      const data = await this.redis.get(`room:${roomCode}`);
      if (!data) return undefined;
      return new WatchRoom(roomCode, JSON.parse(data));
    } else {
      return this.localRooms.get(roomCode);
    }
  }

  async saveRoom(room: WatchRoom): Promise<void> {
    if (this.redis) {
      await this.redis.set(`room:${room.roomCode}`, JSON.stringify(room.toJSON()), 'EX', 86400); // 24hr TTL
    } else {
      this.localRooms.set(room.roomCode, room);
    }
  }

  async deleteRoom(roomCode: string): Promise<void> {
    if (this.redis) {
      await this.redis.del(`room:${roomCode}`);
    } else {
      this.localRooms.delete(roomCode);
    }
  }

  mapSocket(socketId: string, roomCode: string, clerkId: string) {
    this.socketToRoom.set(socketId, { roomCode, clerkId });
  }

  unmapSocket(socketId: string) {
    const mapping = this.socketToRoom.get(socketId);
    this.socketToRoom.delete(socketId);
    return mapping;
  }

  async getRoomBySocketId(socketId: string): Promise<{ room?: WatchRoom, clerkId?: string }> {
    const mapping = this.socketToRoom.get(socketId);
    if (mapping) {
      const room = await this.getRoom(mapping.roomCode);
      return { room, clerkId: mapping.clerkId };
    }
    return { room: undefined, clerkId: undefined };
  }
}
