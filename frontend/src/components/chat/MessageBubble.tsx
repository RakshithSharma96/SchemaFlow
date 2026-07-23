'use client';

import React, { memo } from 'react';
import { User, Bot, AlertCircle, Sparkles, MessageSquare, Code2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { ChatMessage } from '@/lib/types';
import { SqlBlock } from './SqlBlock';
import { ResultsTable } from '@/components/results/ResultsTable';
import { ResultsMeta } from '@/components/results/ResultsMeta';
import { ChartPanel } from './ChartPanel';

interface MessageBubbleProps {
  message: ChatMessage;
  onSuggestionClick?: (question: string) => void;
  onExplainSql?: (sql: string, messageId: string) => void;
}

const markdownComponents = {
  table: ({node, ...props}: any) => <div className="overflow-x-auto my-4 rounded-md border border-[var(--border)] bg-[var(--card)]"><table className="w-full border-collapse text-sm tabular-nums" {...props} /></div>,
  th: ({node, ...props}: any) => <th className="px-4 py-2 border-b border-[var(--border)] bg-[var(--muted)] font-medium text-left text-[var(--muted-foreground)] text-xs" {...props} />,
  td: ({node, ...props}: any) => <td className="px-4 py-2 border-b border-[var(--border)] align-top text-[var(--foreground)]" {...props} />,
  tr: ({node, ...props}: any) => <tr className="transition-colors hover:bg-[var(--muted)]/50" {...props} />,
  a: ({node, ...props}: any) => <a className="text-[var(--primary)] underline underline-offset-4 hover:text-[var(--primary)]/80" {...props} />,
  pre: ({node, ...props}: any) => <pre className="block p-4 my-4 rounded-md bg-[var(--muted)]/30 border border-[var(--border)] text-[var(--foreground)] font-mono text-sm overflow-x-auto" {...props} />,
  code: ({node, className, ...props}: any) => {
    const isBlock = /language-(\w+)/.exec(className || '') || (node?.parent?.tagName === 'pre');
    if (isBlock) {
      return <code className={className} {...props} />;
    }
    return <code className="px-1.5 py-0.5 mx-0.5 rounded-md bg-[var(--muted)]/80 border border-[var(--border)] text-[var(--foreground)] font-mono text-[0.85em]" {...props} />;
  }
};

export const MessageBubble = memo(function MessageBubble({ message, onSuggestionClick, onExplainSql }: MessageBubbleProps) {
  const isUser = message.role === 'user';
  const isError = message.role === 'error';
  const isLoading = message.isLoading;

  return (
    <div className={`flex gap-4 w-full group py-4 ${isUser ? '' : 'border-b border-[var(--border)]/40 last:border-0'}`}>
      {/* Avatar */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center border border-[var(--border)]"
        style={{
          background: isUser ? 'var(--foreground)' : 'var(--background)',
          color: isUser ? 'var(--background)' : isError ? '#f59e0b' : 'var(--foreground)'
        }}
      >
        {isUser ? <User size={16} /> : isError ? <AlertCircle size={16} /> : <Bot size={16} />}
      </div>

      {/* Bubble Content */}
      <div className="flex-1 min-w-0 flex flex-col pt-1">
        <div className="flex items-center gap-2 mb-1">
          <span className="font-semibold text-sm text-[var(--foreground)]">
            {isUser ? 'You' : 'SchemaFlow'}
          </span>
          <span className="text-xs text-[var(--muted-foreground)]">
            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>

        {isLoading ? (
          <LoadingDots />
        ) : (
          <div className="text-[14px] leading-relaxed text-[var(--foreground)]">
            {isUser ? (
              <p>{message.content}</p>
            ) : (
              <div className="prose prose-base max-w-none prose-neutral dark:prose-invert">
                <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{message.content}</ReactMarkdown>
                
                {message.isAnalyzing && !message.analysis?.executive_summary && (
                  <div className="mt-4 text-[13px] font-medium text-[var(--muted-foreground)] flex items-center gap-2">
                    <Loader2 size={12} className="animate-spin" />
                    Analyzing dataset...
                  </div>
                )}

                {message.analysis && (Object.keys(message.analysis).length > 0 || message.isAnalyzing) && (
                  <div className="mt-4 rounded-md border border-[var(--border)] bg-[var(--card)] p-4 text-[15px]">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2 font-semibold text-[var(--foreground)]">
                        <Sparkles size={14} /> AI Analysis
                      </div>
                      {message.confidenceScore && (
                        <div className="text-[11px] uppercase font-bold text-[var(--muted-foreground)]">
                          {message.confidenceScore} Confidence
                        </div>
                      )}
                    </div>

                    {message.analysis.executive_summary && (
                      <p className="text-[var(--foreground)] mb-4">
                        {message.analysis.executive_summary}
                      </p>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                      {message.analysis.key_insights && message.analysis.key_insights.length > 0 && (
                        <div>
                          <div className="text-[13px] font-medium text-[var(--muted-foreground)] mb-2 uppercase tracking-wide">Key Insights</div>
                          <ul className="space-y-1.5 pl-5 list-disc text-[var(--foreground)]">
                            {message.analysis.key_insights.map((insight, i) => (
                              <li key={i} className="leading-relaxed">{insight}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Intelligence Components for Assistant */}
        {!isLoading && message.queryResponse && (
          <div className="w-full mt-4 flex flex-col gap-4">
            
            {/* Report Card style container for SQL + Data */}
            <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
              {/* Header */}
              <div className="bg-[var(--muted)] px-4 py-2 border-b border-[var(--border)] flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--muted-foreground)]">
                    <Code2 size={14} /> Query Results
                  </div>
                  {onExplainSql && (
                    <div className="w-px h-4 bg-[var(--border)]" />
                  )}
                  {onExplainSql && (
                    <button
                      onClick={() => onExplainSql(message.queryResponse!.sql, message.id)}
                      className="flex items-center gap-1.5 text-[13px] font-medium text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
                    >
                      <Sparkles size={12} />
                      Explain SQL
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <ResultsMeta result={message.queryResponse} />
                </div>
              </div>

              {/* SQL Block */}
              <div className="border-b border-[var(--border)]">
                <SqlBlock sql={message.queryResponse.sql} modelUsed={message.queryResponse.model_used} />
              </div>

              {/* Data Visualization */}
              <div className="p-4 bg-[var(--background)]">
                {message.chartConfig && message.chartConfig.chart_type !== 'table' && (
                  <div className="mb-4 border border-[var(--border)] rounded-md">
                    <ChartPanel config={message.chartConfig} result={message.queryResponse} />
                  </div>
                )}
                <div className="border border-[var(--border)] rounded-md">
                  <ResultsTable result={message.queryResponse} />
                </div>
              </div>
            </div>

            {/* SQL Explanation */}
            {(message.isExplainingSql || message.sqlExplanation) && (
              <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] overflow-hidden">
                <div className="bg-[var(--muted)] px-4 py-2 border-b border-[var(--border)] flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[13px] font-medium text-[var(--muted-foreground)]">
                    <Sparkles size={14} /> SQL Explanation
                  </div>
                </div>
                <div className="p-5 bg-[var(--background)] prose prose-base max-w-none prose-neutral dark:prose-invert">
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {message.sqlExplanation || 'Analyzing query structure...'}
                  </ReactMarkdown>
                  {message.isExplainingSql && (
                    <div className="mt-2 text-[13px] font-medium text-[var(--muted-foreground)] flex items-center gap-2">
                      <Loader2 size={12} className="animate-spin" />
                      Generating explanation...
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Suggested Questions */}
            {message.suggestions && message.suggestions.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {message.suggestions.map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => onSuggestionClick?.(sug)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md border border-[var(--border)] bg-[var(--background)] hover:bg-[var(--accent)] hover:text-[var(--accent-foreground)] transition-colors text-[var(--muted-foreground)]"
                  >
                    <MessageSquare size={12} />
                    {sug}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});

function LoadingDots() {
  return (
    <div className="flex items-center gap-1 h-5">
      <span className="w-1.5 h-1.5 bg-[var(--foreground)] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
      <span className="w-1.5 h-1.5 bg-[var(--foreground)] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
      <span className="w-1.5 h-1.5 bg-[var(--foreground)] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
    </div>
  );
}

function Loader2(props: any) {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>;
}
