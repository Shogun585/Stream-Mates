import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Message } from '@/lib/models/message';

export async function GET(req: Request, { params }: { params: { roomCode: string } }) {
  try {
    const { roomCode } = params;
    
    await connectToDatabase();
    const messages = await Message.find({ roomCode })
      .sort({ createdAt: -1 })
      .limit(50);
      
    // Return in chronological order
    return NextResponse.json({ messages: messages.reverse() }, { status: 200 });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
