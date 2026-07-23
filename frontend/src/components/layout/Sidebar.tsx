'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Database, MessageSquare, Settings, LogOut, Zap, Plus, Trash2, LayoutDashboard } from 'lucide-react';
import { useSession } from '@/context/SessionContext';
import { useChatHistory } from '@/context/ChatHistoryContext';
import { Badge } from '@/components/ui/Badge';
import { dbTypeLabel } from '@/lib/utils';
import { Button } from '@/components/ui/Button';

const NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { label: 'Workspace', href: '/chat', icon: MessageSquare },
  { label: 'Connections', href: '/connect', icon: Database },
  { label: 'Settings', href: '/settings', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const { session, disconnect } = useSession();
  const { 
    chats, 
    activeChatId, 
    startNewChat, 
    selectChat, 
    deleteChat,
    clearAllChats
  } = useChatHistory();

  const isChatRoute = pathname === '/chat';
  const currentConnection = session ? `${session.dbType}-${session.databaseName}` : null;
  const currentSessionChats = currentConnection 
    ? chats.filter(c => c.connectionIdentifier === currentConnection)
    : [];

  return (
    <div className="flex flex-col w-64 flex-shrink-0 h-full bg-[var(--card)] border-r border-[var(--border)] z-20">
      
      <div className="h-14 flex items-center px-4 border-b border-[var(--border)]">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="w-6 h-6 rounded-md bg-[var(--foreground)] flex items-center justify-center">
            <Database size={14} className="text-[var(--background)]" />
          </div>
          <span className="font-semibold text-sm tracking-tight text-[var(--foreground)]">
            SchemaFlow
          </span>
        </Link>
      </div>

      <div className="px-3 py-4 flex flex-col gap-1 flex-shrink-0">
        <div className="mb-2 px-2 text-xs font-medium text-[var(--muted-foreground)]">Menu</div>
        {NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link key={item.href} href={item.href}>
              <div 
                className={`flex items-center gap-2 px-2 py-1.5 rounded-md text-sm transition-colors ${isActive ? 'bg-[var(--accent)] text-[var(--accent-foreground)] font-medium' : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]'}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </div>
            </Link>
          );
        })}
      </div>

      <div className="h-px bg-[var(--border)] mx-4 my-2" />

      {isChatRoute && session ? (
        <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2">
          <div className="flex items-center justify-between px-2 mb-1">
            <span className="text-xs font-medium text-[var(--muted-foreground)]">Conversations</span>
            <div className="flex items-center gap-1">
              <button 
                onClick={() => clearAllChats()}
                title="Clear all chats"
                className="text-[var(--muted-foreground)] hover:text-[var(--destructive)] transition-colors p-1"
              >
                <Trash2 size={13} />
              </button>
              <button 
                onClick={() => startNewChat()}
                title="New chat"
                className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors p-1"
              >
                <Plus size={14} />
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-0.5">
            {currentSessionChats.map((chat) => (
              <div
                key={chat.id}
                className={`group flex items-center justify-between px-2 py-1.5 rounded-md text-sm cursor-pointer transition-colors ${chat.id === activeChatId ? 'bg-[var(--accent)] text-[var(--foreground)] font-medium' : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)]'}`}
                onClick={() => selectChat(chat.id)}
              >
                <span className="truncate pr-2 max-w-[150px]">
                  {chat.title}
                </span>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                  title="Delete chat"
                >
                  <Trash2 size={14} className="text-[var(--muted-foreground)] hover:text-[var(--destructive)]" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex-1" />
      )}

      <div className="p-4 mt-auto border-t border-[var(--border)]">
        {session ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium text-[var(--foreground)] truncate max-w-[120px]">
                  {session.databaseName}
                </span>
              </div>
              <Badge variant="outline" className="text-[10px] h-5 font-mono px-1.5">
                {dbTypeLabel(session.dbType)}
              </Badge>
            </div>
            <Button variant="outline" size="sm" className="w-full text-xs h-7" onClick={disconnect}>
              <LogOut size={12} className="mr-2" /> Disconnect
            </Button>
          </div>
        ) : (
          <div className="text-xs text-[var(--muted-foreground)] text-center">
            No active connection
          </div>
        )}
      </div>
    </div>
  );
}
