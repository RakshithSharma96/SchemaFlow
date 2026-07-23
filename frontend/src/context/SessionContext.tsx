'use client';

/**
 * Global session context — shares connection state across all pages
 * without prop-drilling.
 */

import React, { createContext, useContext, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  connectSQLite,
  connectPostgreSQL,
  connectMySQL,
  disconnect as apiDisconnect,
} from '@/lib/api';
import type { AppSession } from '@/lib/types';

interface SessionContextValue {
  session: AppSession | null;
  isConnecting: boolean;
  error: string | null;
  connectWithSQLite: (file: File) => Promise<void>;
  connectWithPostgreSQL: (params: {
    host: string; port: number; database: string; username: string; password: string;
  }) => Promise<void>;
  connectWithMySQL: (params: {
    host: string; port: number; database: string; username: string; password: string;
  }) => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
}

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [session, setSession] = useState<AppSession | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  // Read session from sessionStorage after initial mount (fixes hydration error)
  React.useEffect(() => {
    try {
      const stored = sessionStorage.getItem('ai_sql_agent_session');
      if (stored) {
        setSession(JSON.parse(stored));
      }
    } catch (e) {
      console.warn("Failed to parse session from storage");
    } finally {
      setIsInitialized(true);
    }
  }, []);

  // Persist session changes to sessionStorage (only after initialization)
  React.useEffect(() => {
    if (!isInitialized) return;
    
    if (session) {
      sessionStorage.setItem('ai_sql_agent_session', JSON.stringify(session));
    } else {
      sessionStorage.removeItem('ai_sql_agent_session');
    }
  }, [session, isInitialized]);

  const handleSuccess = useCallback((data: {
    session_id: string; db_type: string; database_name: string;
  }) => {
    setSession({
      sessionId: data.session_id,
      dbType: data.db_type,
      databaseName: data.database_name,
      connectedAt: new Date(),
    });
    setIsConnecting(false);
    setError(null);
    router.push('/chat');
  }, [router]);

  const connectWithSQLite = useCallback(async (file: File) => {
    setIsConnecting(true); setError(null);
    try {
      const res = await connectSQLite(file);
      if (!res.success || !res.data) throw new Error(res.error ?? 'Connection failed');
      handleSuccess(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setIsConnecting(false);
    }
  }, [handleSuccess]);

  const connectWithPostgreSQL = useCallback(async (params: {
    host: string; port: number; database: string; username: string; password: string;
  }) => {
    setIsConnecting(true); setError(null);
    try {
      const res = await connectPostgreSQL(params);
      if (!res.success || !res.data) throw new Error(res.error ?? 'Connection failed');
      handleSuccess(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setIsConnecting(false);
    }
  }, [handleSuccess]);

  const connectWithMySQL = useCallback(async (params: {
    host: string; port: number; database: string; username: string; password: string;
  }) => {
    setIsConnecting(true); setError(null);
    try {
      const res = await connectMySQL(params);
      if (!res.success || !res.data) throw new Error(res.error ?? 'Connection failed');
      handleSuccess(res.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setIsConnecting(false);
    }
  }, [handleSuccess]);

  const disconnect = useCallback(async () => {
    if (!session) return;
    try { await apiDisconnect(session.sessionId); } catch { /* ignore */ }
    setSession(null);
    setError(null);
    router.push('/connect');
  }, [session, router]);

  const clearError = useCallback(() => setError(null), []);

  return (
    <SessionContext.Provider value={{
      session, isConnecting, error,
      connectWithSQLite, connectWithPostgreSQL, connectWithMySQL,
      disconnect, clearError,
    }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used inside <SessionProvider>');
  return ctx;
}
