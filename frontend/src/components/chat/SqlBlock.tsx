'use client';

import React, { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

// We use a custom minimalist theme instead of a bulky pre-built one
const customTheme: { [key: string]: React.CSSProperties } = {
  'code[class*="language-"]': {
    color: 'var(--foreground)',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '13px',
    lineHeight: '1.5',
    direction: 'ltr',
    textAlign: 'left',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    tabSize: 4,
    hyphens: 'none',
  },
  'pre[class*="language-"]': {
    color: 'var(--foreground)',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
    fontSize: '13px',
    lineHeight: '1.5',
    direction: 'ltr',
    textAlign: 'left',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    tabSize: 4,
    hyphens: 'none',
    margin: 0,
    padding: '16px',
    overflow: 'auto',
    background: 'transparent',
  },
  'keyword': { color: '#ec4899', fontWeight: 'bold' },
  'operator': { color: '#a1a1aa' },
  'punctuation': { color: '#a1a1aa' },
  'string': { color: '#10b981' },
  'number': { color: '#f59e0b' },
  'function': { color: '#3b82f6' },
  'comment': { color: '#71717a', fontStyle: 'italic' },
};

interface SqlBlockProps {
  sql: string;
  modelUsed?: string;
}

export function SqlBlock({ sql, modelUsed }: SqlBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(sql);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group bg-[var(--card)]">
      <div className="absolute right-2 top-2 z-10 flex gap-2">
        <button
          onClick={handleCopy}
          className="p-1.5 rounded-md bg-[var(--muted)] hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
          title="Copy SQL"
        >
          {copied ? <Check size={14} className="text-emerald-500" /> : <Copy size={14} />}
        </button>
      </div>

      <SyntaxHighlighter
        language="sql"
        style={customTheme}
        customStyle={{ margin: 0, background: 'transparent' }}
      >
        {sql}
      </SyntaxHighlighter>
      {modelUsed && (
        <div className="absolute bottom-2 right-3 text-[9px] font-mono font-medium text-[var(--muted-foreground)] opacity-50 select-none">
          {modelUsed}
        </div>
      )}
    </div>
  );
}
