'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { generateId } from '@/lib/utils';
import { useSession } from './SessionContext';

export interface ChatSession {
  id: string;
  title: string;
  connectionIdentifier: string; // dbType-databaseName
  createdAt: string;
}

interface ChatHistoryContextType {
  chats: ChatSession[];
  activeChatId: string | null;
  startNewChat: () => void;
  selectChat: (id: string) => void;
  deleteChat: (id: string) => void;
  clearAllChats: () => void;
  updateChatTitle: (id: string, title: string) => void;
}

const ChatHistoryContext = createContext<ChatHistoryContextType | undefined>(undefined);

export function ChatHistoryProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load chats from local storage
  useEffect(() => {
    try {
      const stored = localStorage.getItem('ai_sql_agent_chats');
      if (stored) {
        setChats(JSON.parse(stored));
      }
    } catch (e) {
      console.error('Failed to parse chats from localStorage', e);
    }
    setIsInitialized(true);
  }, []);

  // Save chats to local storage
  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('ai_sql_agent_chats', JSON.stringify(chats));
    }
  }, [chats, isInitialized]);

  // When database session changes, or on mount, ensure there's an active chat if chats exist for this DB
  useEffect(() => {
    if (!isInitialized || !session) return;
    
    const currentConnection = `${session.dbType}-${session.databaseName}`;
    
    // Check if current active chat belongs to this connection
    const activeChat = chats.find(c => c.id === activeChatId);
    if (activeChat && activeChat.connectionIdentifier === currentConnection) {
      return; // All good
    }

    // Otherwise, find the most recent chat for this connection
    const sessionChats = chats.filter(c => c.connectionIdentifier === currentConnection);
    if (sessionChats.length > 0) {
      // Sort by newest first
      sessionChats.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setActiveChatId(sessionChats[0].id);
    } else {
      // Create a new one
      startNewChat();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, isInitialized]);

  const startNewChat = () => {
    if (!session) return;
    const currentConnection = `${session.dbType}-${session.databaseName}`;
    
    const newChat: ChatSession = {
      id: generateId(),
      title: 'New Chat',
      connectionIdentifier: currentConnection,
      createdAt: new Date().toISOString()
    };
    setChats(prev => [newChat, ...prev]);
    setActiveChatId(newChat.id);
  };

  const selectChat = (id: string) => {
    setActiveChatId(id);
  };

  const deleteChat = (id: string) => {
    setChats(prev => prev.filter(c => c.id !== id));
    localStorage.removeItem(`ai_sql_agent_messages_${id}`);
    
    if (activeChatId === id) {
      if (!session) {
         setActiveChatId(null);
         return;
      }
      // If we deleted the active chat, pick another one or create new
      const currentConnection = `${session.dbType}-${session.databaseName}`;
      const remaining = chats.filter(c => c.id !== id && c.connectionIdentifier === currentConnection);
      if (remaining.length > 0) {
        setActiveChatId(remaining[0].id);
      } else {
        startNewChat();
      }
    }
  };

  const clearAllChats = () => {
    // Remove all message storage keys
    chats.forEach(c => {
      localStorage.removeItem(`ai_sql_agent_messages_${c.id}`);
    });
    setChats([]);
    localStorage.removeItem('ai_sql_agent_chats');
    setActiveChatId(null);
    if (session) {
      startNewChat();
    }
  };

  const updateChatTitle = (id: string, title: string) => {
    setChats(prev => prev.map(c => c.id === id ? { ...c, title } : c));
  };

  return (
    <ChatHistoryContext.Provider
      value={{ chats, activeChatId, startNewChat, selectChat, deleteChat, clearAllChats, updateChatTitle }}
    >
      {children}
    </ChatHistoryContext.Provider>
  );
}

export function useChatHistory() {
  const context = useContext(ChatHistoryContext);
  if (context === undefined) {
    throw new Error('useChatHistory must be used within a ChatHistoryProvider');
  }
  return context;
}
