import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { customAlphabet } from 'nanoid';
import { connectToDatabase } from '@/lib/db';
import { Room } from '@/lib/models/room';

// Generate 6 character alphanumeric code
const nanoid = customAlphabet('1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ', 6);

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { videoId } = await req.json().catch(() => ({ videoId: '' }));
    
    await connectToDatabase();
    
    const roomCode = nanoid();
    const newRoom = await Room.create({
      roomCode,
      hostClerkId: userId,
      videoId: videoId || 'KHLNSxe5Y8A'
    });

    return NextResponse.json({ roomCode: newRoom.roomCode }, { status: 201 });
  } catch (error) {
    console.error('Error creating room:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
