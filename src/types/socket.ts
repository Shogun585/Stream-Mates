export type Role = 'host' | 'moderator' | 'participant';

export interface User {
  socketId: string;
  clerkId: string;
  username: string;
  avatar: string;
  avatarUrl?: string; // alias used in some components
  role: Role;
  isOnline?: boolean;
}

export interface RoomState {
  playState: 'playing' | 'paused';
  currentTime: number;
  videoId: string;
  participants: User[];
  localUpdatedAt?: number;
}

export interface ChatMessage {
  roomCode: string;
  clerkId: string;
  username: string;
  content: string;
  createdAt: string | Date;
  id?: string;
}
