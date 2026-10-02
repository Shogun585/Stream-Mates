import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  roomCode: { type: String, required: true, index: true },
  username: { type: String, required: true },
  clerkId: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Message = mongoose.models.Message || mongoose.model('Message', MessageSchema);
