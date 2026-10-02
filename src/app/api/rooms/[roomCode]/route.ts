import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/db';
import { Room } from '@/lib/models/room';

export async function GET(req: Request, { params }: { params: { roomCode: string } }) {
  try {
    const { roomCode } = params;
    
    await connectToDatabase();
    const room = await Room.findOne({ roomCode });
    
    if (!room) {
      return NextResponse.json({ error: 'Room not found' }, { status: 404 });
    }

    return NextResponse.json({ room }, { status: 200 });
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
