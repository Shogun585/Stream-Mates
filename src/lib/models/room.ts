import mongoose from 'mongoose';

// ponytail: basic mongoose schema for a room
const RoomSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, unique: true, index: true },
  hostClerkId: { type: String, required: true },
  videoId: { type: String, default: '' },
  playState: { type: String, enum: ['playing', 'paused'], default: 'paused' },
  currentTime: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now, expires: 86400 } // TTL index: auto-delete after 24h
});

export const Room = mongoose.models.Room || mongoose.model('Room', RoomSchema);
