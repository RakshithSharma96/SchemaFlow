'use client';

import React from 'react';
import { Database, CheckCircle2 } from 'lucide-react';
import { ConnectionForm } from '@/components/connection/ConnectionForm';
import { useSession } from '@/context/SessionContext';
import { Sidebar } from '@/components/layout/Sidebar';

export default function ConnectPage() {
  const { connectWithSQLite, connectWithPostgreSQL, connectWithMySQL, isConnecting, error } =
    useSession();

  return (
    <div className="flex h-dvh bg-[var(--background)]">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-6 py-12 flex flex-col md:flex-row gap-12">
          
          {/* Left info panel */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-md bg-[var(--foreground)] flex items-center justify-center">
                <Database size={16} className="text-[var(--background)]" />
              </div>
              <span className="font-semibold tracking-tight text-[var(--foreground)]">
                Database Connection
              </span>
            </div>

            <h1 className="text-3xl font-bold tracking-tight text-[var(--foreground)] mb-4">
              Connect your data source
            </h1>
            <p className="text-[var(--muted-foreground)] text-base mb-10 leading-relaxed">
              Connect securely to your database to start querying. Our platform supports Postgres, MySQL, and SQLite.
            </p>

            <div className="space-y-4">
              {[
                'Schema extracted automatically',
                'SQL validated before execution',
                'Read-only queries enforced',
                'Powered by LLM pipeline architecture',
              ].map((f, i) => (
                <div key={i} className="flex items-start gap-3 text-sm text-[var(--foreground)]">
                  <CheckCircle2 size={16} className="text-[var(--primary)] mt-0.5 shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>
            
            <div className="mt-auto pt-12 text-xs text-[var(--muted-foreground)]">
              Credentials are never stored permanently unless explicitly saved to your workspace.
            </div>
          </div>

          {/* Right form panel */}
          <div className="flex-1 w-full max-w-md">
            <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6 shadow-sm">
              <div className="mb-6">
                <h2 className="text-lg font-semibold tracking-tight text-[var(--foreground)] mb-1">
                  Select database type
                </h2>
                <p className="text-sm text-[var(--muted-foreground)]">
                  Choose your dialect to configure the connection.
                </p>
              </div>

              <ConnectionForm
                onConnectSQLite={connectWithSQLite}
                onConnectPostgreSQL={connectWithPostgreSQL}
                onConnectMySQL={connectWithMySQL}
                isConnecting={isConnecting}
                error={error}
              />
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
