'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Database, LayoutPanelLeft } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { SchemaPanel } from '@/components/connection/SchemaPanel';
import { ChatWindow } from '@/components/chat/ChatWindow';
import { ChatInput } from '@/components/chat/ChatInput';
import { useChat } from '@/hooks/useChat';
import { useSession } from '@/context/SessionContext';
import { Button } from '@/components/ui/Button';

export default function ChatPage() {
  const router = useRouter();
  const { session } = useSession();
  const { messages, isLoading, sendMessage, explainSql } = useChat();
  
  // Right Inspector State
  const [inspectorOpen, setInspectorOpen] = useState(true);
  const [inspectorTab, setInspectorTab] = useState<'schema' | 'metrics'>('schema');
  
  // Track selected message for deep inspection
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const handleSend = React.useCallback((question: string) => {
    if (session?.sessionId) {
      sendMessage(question, session.sessionId);
    }
  }, [sendMessage, session?.sessionId]);

  if (!session) {
    return (
      <div className="min-h-dvh flex items-center justify-center flex-col gap-5 bg-[var(--background)]">
        <div className="w-16 h-16 rounded-xl flex items-center justify-center bg-[var(--accent)] border border-[var(--border)]">
          <Database size={24} className="text-[var(--muted-foreground)]" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-semibold text-[var(--foreground)] mb-1">No Active Connection</h2>
          <p className="text-sm text-[var(--muted-foreground)]">Connect to a database to access the workspace.</p>
        </div>
        <Button onClick={() => router.push('/connect')}>
          Connect Database
        </Button>
      </div>
    );
  }

  const activeMessage = messages.find(m => m.id === selectedMessageId) || messages[messages.length - 1];

  return (
    <div className="flex h-dvh overflow-hidden bg-[var(--background)]">
      {/* 1. Left Sidebar */}
      <Sidebar />

      {/* 2. Center Chat Thread */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[var(--border)]">
        
        {/* Top Header */}
        <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--border)] flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[var(--foreground)]">Conversation</span>
          </div>
          <button 
            onClick={() => setInspectorOpen(!inspectorOpen)}
            className={`p-1.5 rounded-md transition-colors ${inspectorOpen ? 'bg-[var(--accent)] text-[var(--foreground)]' : 'text-[var(--muted-foreground)] hover:bg-[var(--accent)]'}`}
            title="Toggle Inspector"
          >
            <LayoutPanelLeft size={16} />
          </button>
        </div>

        {/* Chat Messages */}
        <ChatWindow
          messages={messages || []}
          onExampleClick={handleSend}
          onSuggestionClick={handleSend}
          onExplainSql={explainSql}
          // Will add selection capability to ChatWindow later
        />

        {/* Input Bar */}
        <div className="p-4 bg-[var(--background)] border-t border-[var(--border)]">
          <ChatInput
            onSend={handleSend}
            isLoading={isLoading}
          />
        </div>
      </div>

      {/* 3. Right Inspector Panel */}
      {inspectorOpen && (
        <div className="w-[400px] flex-shrink-0 flex flex-col bg-[var(--card)]">
          {/* Inspector Tabs */}
          <div className="h-14 flex items-center px-2 border-b border-[var(--border)] flex-shrink-0">
            <div className="flex gap-1 p-1 bg-[var(--accent)] rounded-lg">
              <button 
                onClick={() => setInspectorTab('schema')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${inspectorTab === 'schema' ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
              >
                Schema
              </button>
              <button 
                onClick={() => setInspectorTab('metrics')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${inspectorTab === 'metrics' ? 'bg-[var(--background)] text-[var(--foreground)] shadow-sm' : 'text-[var(--muted-foreground)] hover:text-[var(--foreground)]'}`}
              >
                Metrics
              </button>
            </div>
          </div>

          {/* Inspector Content */}
          <div className="flex-1 overflow-y-auto">
            {inspectorTab === 'schema' && (
              <SchemaPanel sessionId={session.sessionId} />
            )}
            
            {inspectorTab === 'metrics' && (
              <div className="p-4">
                {activeMessage?.queryResponse ? (
                  <div className="space-y-4">
                    <div className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Execution Pipeline</div>
                    <div className="space-y-2 border-l-2 border-[var(--border)] ml-2 pl-4">
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-[var(--muted-foreground)]" />
                        <div className="text-sm font-medium">Query Planner</div>
                        <div className="text-xs text-[var(--muted-foreground)]">34ms</div>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-[var(--muted-foreground)]" />
                        <div className="text-sm font-medium">SQL Generation</div>
                        <div className="text-xs text-[var(--muted-foreground)]">850ms</div>
                      </div>
                      <div className="relative">
                        <div className="absolute -left-[21px] top-1 w-2 h-2 rounded-full bg-[var(--primary)] shadow-[0_0_8px_var(--primary)]" />
                        <div className="text-sm font-medium">Database Execution</div>
                        <div className="text-xs text-[var(--muted-foreground)]">{activeMessage.queryResponse.execution_time_ms}ms</div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-[var(--muted-foreground)] text-center mt-10">
                    No active query metrics to display.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
