'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { RoomState, ChatMessage } from '../types/socket';
import { useUser } from '@clerk/nextjs';

interface UseSocketOptions {
  roomCode: string;
}

export function useSocket({ roomCode }: UseSocketOptions) {
  const { user } = useUser();
  const socketRef = useRef<Socket | null>(null);
  
  const [roomState, setRoomState] = useState<RoomState | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [pendingRequest, setPendingRequest] = useState<{ clerkId: string, username: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    // Connect to same origin (custom server serves both Next.js and Socket.IO)
    const socket = io({
      // no custom path — default /socket.io works with our custom server
    });
    
    socketRef.current = socket;

    const joinData = {
      roomCode,
      clerkId: user.id,
      username: user.username || user.firstName || 'Anonymous',
      avatar: user.imageUrl || '',
    };

    if (socket.connected) {
      socket.emit('join_room', joinData);
    }

    socket.on('connect', () => {
      socket.emit('join_room', joinData);
    });

    socket.on('sync_state', (state: RoomState) => {
      setRoomState({ ...state, localUpdatedAt: Date.now() });
    });

    socket.on('user_joined', ({ participants }: { participants: RoomState['participants'] }) => {
      setRoomState(prev => prev ? { ...prev, participants } : prev);
    });

    socket.on('user_left', ({ participants }: { participants: RoomState['participants'] }) => {
      setRoomState(prev => prev ? { ...prev, participants } : prev);
    });

    socket.on('role_assigned', ({ participants }: { participants: RoomState['participants'] }) => {
      setRoomState(prev => prev ? { ...prev, participants } : prev);
    });

    socket.on('participant_removed', ({ targetClerkId, participants }: { targetClerkId: string; participants?: RoomState['participants'] }) => {
      // If we were removed, redirect to home
      if (targetClerkId === user.id) {
        window.location.href = '/';
        return;
      }
      if (participants) {
        setRoomState(prev => prev ? { ...prev, participants } : prev);
      }
    });

    socket.on('new_message', (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    });

    socket.on('control_requested', ({ requester }: { requester: any }) => {
      setPendingRequest({ clerkId: requester.clerkId, username: requester.username });
    });

    socket.on('control_approved', ({ targetClerkId }: { targetClerkId: string }) => {
      if (targetClerkId === user.id) {
        setError('Your control request was approved!');
        setTimeout(() => setError(null), 3000);
      }
    });


    socket.on('error', (err: string) => {
      setError(typeof err === 'string' ? err : 'An error occurred');
      setTimeout(() => setError(null), 3000);
    });

    return () => {
      socket.emit('leave_room');
      socket.disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomCode, user?.id]);

  const emit = useCallback((event: string, data?: any) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return { 
    socket: socketRef.current, 
    roomState, 
    messages, 
    error, 
    emit, 
    setMessages,
    pendingRequest,
    setPendingRequest
  };
}
