'use client';

import { User } from '../types/socket';
import { useUser } from '@clerk/nextjs';

interface ParticipantListProps {
  participants: User[];
  onAssignRole: (clerkId: string, role: string) => void;
  onRemove: (clerkId: string) => void;
  onTransferHost?: (clerkId: string) => void;
  onApproveRequest?: (clerkId: string) => void;
  onCollapse?: () => void;
}

export default function ParticipantList({ participants, onAssignRole, onRemove, onTransferHost, onApproveRequest, onCollapse }: ParticipantListProps) {
  const { user } = useUser();
  const currentUser = participants.find(p => p.clerkId === user?.id);
  const canManage = currentUser?.role === 'host';

  const getRoleBadge = (role: string) => {
    if (role === 'host') return <span className="px-2 py-0.5 bg-[var(--droplet-2)] text-[var(--bg-color)] rounded-full text-xs font-bold border border-[var(--text-primary)]">HOST</span>;
    if (role === 'moderator') return <span className="px-2 py-0.5 bg-[var(--droplet-4)] text-[var(--bg-color)] rounded-full text-xs font-bold border border-[var(--text-primary)]">MOD</span>;
    return null;
  };

  return (
    <div className="flex flex-col h-full bg-transparent overflow-hidden">
      <div className="p-4 border-b border-[var(--border)] bg-transparent font-black text-lg text-[var(--text-primary)] flex justify-between items-center">
        <span>Room Mates</span>
        <div className="flex items-center gap-3">
          <span className="bg-[var(--accent)] text-white px-3 py-1 rounded-full text-sm shadow-sm">{participants.length}</span>
          {onCollapse && (
            <button 
              onClick={onCollapse}
              className="p-1.5 bg-transparent border-2 border-[var(--border)] rounded-lg text-[var(--text-primary)] hover:border-[var(--text-primary)] hover:bg-[var(--glass-border)] transition-colors group"
              title="Collapse Sidebar"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-0.5 transition-transform"><path d="m9 18 6-6-6-6"/></svg>
            </button>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {participants.map((p) => (
          <div key={p.clerkId} className="flex items-center justify-between p-3 rounded-2xl border border-transparent hover:border-[var(--border)] bg-transparent hover:bg-[var(--glass-border)] transition-colors group">
            <div className="flex items-center gap-4">
              <div className="relative">
                {p.avatar ? (
                  <img src={p.avatar} alt={p.username} className="w-10 h-10 rounded-full border-2 border-[var(--text-primary)] shadow-[2px_2px_0px_var(--shadow-color)]" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-color)] border-2 border-[var(--text-primary)] shadow-[2px_2px_0px_var(--shadow-color)] flex items-center justify-center font-bold text-lg text-[var(--text-primary)]">
                    {p.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[var(--text-primary)] bg-[var(--droplet-3)] z-10"></span>
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-[var(--text-primary)] truncate max-w-[120px]">{p.username} {p.clerkId === user?.id && '(You)'}</span>
                <div className="flex gap-1 mt-0.5">
                  {getRoleBadge(p.role)}
                </div>
              </div>
            </div>

            {canManage && p.clerkId !== user?.id && (
              <div className="hidden group-hover:flex flex-wrap items-center gap-2 justify-end w-[80px]">
                {p.role !== 'moderator' && (
                  <button onClick={() => onAssignRole(p.clerkId, 'moderator')} className="text-xs px-2 py-1 font-bold bg-[var(--bg-color)] border border-[var(--text-primary)] rounded-lg hover:bg-[var(--droplet-4)] hover:text-white transition-colors" title="Make Mod">Mod</button>
                )}
                {p.role === 'moderator' && (
                  <button onClick={() => onAssignRole(p.clerkId, 'participant')} className="text-xs px-2 py-1 font-bold bg-[var(--bg-color)] border border-[var(--text-primary)] rounded-lg hover:bg-gray-400 hover:text-white transition-colors" title="Demote">Demote</button>
                )}
                {onTransferHost && (
                  <button onClick={() => onTransferHost(p.clerkId)} className="text-xs px-2 py-1 font-bold bg-[var(--bg-color)] border border-[var(--text-primary)] rounded-lg hover:bg-[var(--droplet-2)] hover:text-white transition-colors" title="Transfer Host">Host</button>
                )}
                <button onClick={() => onRemove(p.clerkId)} className="text-xs px-2 py-1 font-bold bg-[var(--accent)] text-white border border-[var(--text-primary)] rounded-lg hover:bg-[var(--accent-soft)] transition-colors" title="Kick">Kick</button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
