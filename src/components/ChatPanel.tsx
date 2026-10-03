'use client';
import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types/socket';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
}



const EMOJIS = ['😂', '❤️', '🔥', '👀', '✨', '💯', '🤔', '🙌', '💀', '🎉'];

export default function ChatPanel({ messages, onSendMessage }: ChatPanelProps) {
  const [input, setInput] = useState('');
  const [showEmoji, setShowEmoji] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSendMessage(input.trim());
      setInput('');
      setShowEmoji(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      <div className="p-4 border-b border-[var(--border)] bg-transparent font-black text-lg text-[var(--text-primary)]">
        Live Chat
      </div>
      
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {messages.map((msg, i) => (
          <div key={msg.id || i} className="flex flex-col">
            <div className="flex items-baseline gap-2 mb-1.5 ml-1">
              <span className="font-bold text-[var(--text-primary)]">{msg.username}</span>
              <span className="text-xs text-[var(--text-muted)] font-bold">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            <p className="text-sm md:text-base font-medium break-words bg-[var(--bg-color)] text-[var(--text-primary)] p-3 rounded-2xl rounded-tl-sm w-max max-w-[90%] border border-[var(--border)] shadow-sm">
              {msg.content}
            </p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t border-[var(--border)] bg-transparent relative">
        {showEmoji && (
          <div className="absolute bottom-full mb-2 left-4 bg-[var(--bg-color)] border border-[var(--border)] rounded-2xl p-3 grid grid-cols-5 gap-3 shadow-lg z-50">
            {EMOJIS.map(emoji => (
              <button
                key={emoji}
                type="button"
                className="hover:scale-125 transform transition-transform text-2xl"
                onClick={() => {
                  setInput(prev => prev + emoji);
                  setShowEmoji(false);
                }}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
        <form onSubmit={handleSubmit} className="relative flex items-center">
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className="absolute left-3 text-2xl hover:scale-110 active:scale-95 transition-transform z-10"
            title="Emojis"
          >
            😀
          </button>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Say something..."
            className="w-full bg-[var(--bg-color)] border border-[var(--border)] rounded-full pl-12 pr-14 py-3 text-base font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] shadow-inner placeholder:text-[var(--text-muted)] placeholder:font-medium"
          />
          <button
            type="submit"
            disabled={!input.trim()}
            className="absolute right-2 p-2.5 bg-[var(--accent)] text-white rounded-full hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 disabled:transform-none shadow-sm flex items-center justify-center z-10"
            title="Send Message"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z"/><path d="M22 2 11 13"/></svg>
          </button>
        </form>
      </div>
    </div>
  );
}
