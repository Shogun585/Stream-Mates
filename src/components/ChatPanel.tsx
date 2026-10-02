'use client';
import { useState, useRef, useEffect } from 'react';
import { ChatMessage } from '../types/socket';

interface ChatPanelProps {
  messages: ChatMessage[];
  onSendMessage: (content: string) => void;
}

const EMOJIS = ['😂', '❤️', '🔥', '✨', '👀', '🎉', '💀', '💯', '🤔', '🙌'];

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
          <div className="absolute bottom-20 right-4 bg-[var(--bg-color)] border border-[var(--border)] rounded-2xl p-3 grid grid-cols-5 gap-3 shadow-lg z-50">
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
        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Say something..."
            className="flex-1 bg-[var(--bg-color)] border border-[var(--border)] rounded-full px-5 py-3 text-base font-bold text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)] shadow-inner placeholder:text-[var(--text-muted)] placeholder:font-medium"
          />
          <button
            type="button"
            onClick={() => setShowEmoji(!showEmoji)}
            className="w-12 h-12 rounded-full flex items-center justify-center bg-[var(--droplet-2)] text-[var(--bg-color)] hover:-translate-y-1 active:translate-y-1 transition-transform border border-[var(--border)] shadow-sm text-2xl"
          >
            😀
          </button>
        </form>
      </div>
    </div>
  );
}
