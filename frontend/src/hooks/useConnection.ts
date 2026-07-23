'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  connectSQLite,
  connectPostgreSQL,
  connectMySQL,
  disconnect as apiDisconnect,
} from '@/lib/api';
import type { AppSession, DatabaseType } from '@/lib/types';

interface ConnectionState {
  session: AppSession | null;
  isConnecting: boolean;
  error: string | null;
}

interface UseConnectionReturn extends ConnectionState {
  connectWithSQLite: (file: File) => Promise<void>;
  connectWithPostgreSQL: (params: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  }) => Promise<void>;
  connectWithMySQL: (params: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
  }) => Promise<void>;
  disconnect: () => Promise<void>;
  clearError: () => void;
}

export function useConnection(): UseConnectionReturn {
  const router = useRouter();
  const [state, setState] = useState<ConnectionState>({
    session: null,
    isConnecting: false,
    error: null,
  });

  const setError = (error: string) =>
    setState((s) => ({ ...s, error, isConnecting: false }));

  const connectWithSQLite = useCallback(async (file: File) => {
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      const res = await connectSQLite(file);
      if (!res.success || !res.data) throw new Error(res.error ?? 'Connection failed');
      setState({
        isConnecting: false,
        error: null,
        session: {
          sessionId: res.data.session_id,
          dbType: res.data.db_type,
          databaseName: res.data.database_name,
          connectedAt: new Date(),
        },
      });
      router.push('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  }, [router]);

  const connectWithPostgreSQL = useCallback(async (params: {
    host: string; port: number; database: string; username: string; password: string;
  }) => {
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      const res = await connectPostgreSQL(params);
      if (!res.success || !res.data) throw new Error(res.error ?? 'Connection failed');
      setState({
        isConnecting: false,
        error: null,
        session: {
          sessionId: res.data.session_id,
          dbType: res.data.db_type,
          databaseName: res.data.database_name,
          connectedAt: new Date(),
        },
      });
      router.push('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  }, [router]);

  const connectWithMySQL = useCallback(async (params: {
    host: string; port: number; database: string; username: string; password: string;
  }) => {
    setState((s) => ({ ...s, isConnecting: true, error: null }));
    try {
      const res = await connectMySQL(params);
      if (!res.success || !res.data) throw new Error(res.error ?? 'Connection failed');
      setState({
        isConnecting: false,
        error: null,
        session: {
          sessionId: res.data.session_id,
          dbType: res.data.db_type,
          databaseName: res.data.database_name,
          connectedAt: new Date(),
        },
      });
      router.push('/chat');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
    }
  }, [router]);

  const disconnect = useCallback(async () => {
    if (!state.session) return;
    try {
      await apiDisconnect(state.session.sessionId);
    } catch {
      // Silently ignore — we always clear local session
    } finally {
      setState({ session: null, isConnecting: false, error: null });
      router.push('/connect');
    }
  }, [state.session, router]);

  const clearError = useCallback(() => {
    setState((s) => ({ ...s, error: null }));
  }, []);

  return {
    ...state,
    connectWithSQLite,
    connectWithPostgreSQL,
    connectWithMySQL,
    disconnect,
    clearError,
  };
}
