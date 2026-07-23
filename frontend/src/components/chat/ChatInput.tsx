'use client';

import React, { useState, useRef, KeyboardEvent } from 'react';
import { SendHorizontal, Loader2 } from 'lucide-react';

interface ChatInputProps {
  onSend: (question: string) => void;
  isLoading: boolean;
  disabled?: boolean;
}

export function ChatInput({ onSend, isLoading, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    const q = value.trim();
    if (!q || isLoading || disabled) return;
    onSend(q);
    setValue('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInput = () => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = 'auto';
      ta.style.height = `${Math.min(ta.scrollHeight, 160)}px`;
    }
  };

  const canSend = value.trim() && !isLoading && !disabled;

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-2">
      <div 
        className="relative flex items-end gap-2 bg-[var(--background)] border border-[var(--input)] rounded-lg p-2 shadow-sm focus-within:ring-1 focus-within:ring-[var(--ring)] focus-within:border-[var(--ring)] transition-shadow"
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => { setValue(e.target.value); handleInput(); }}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? 'Connect to a database to start...' : 'Ask a question about your data...'}
          disabled={disabled || isLoading}
          rows={1}
          className="flex-1 bg-transparent resize-none outline-none text-sm px-2 py-1.5 placeholder:text-[var(--muted-foreground)] disabled:opacity-50"
          style={{ minHeight: '32px', maxHeight: '160px' }}
        />

        <button
          onClick={handleSend}
          disabled={!canSend}
          className={`flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center transition-colors ${canSend ? 'bg-[var(--primary)] text-[var(--primary-foreground)] shadow-sm' : 'bg-[var(--secondary)] text-[var(--muted-foreground)] opacity-50 cursor-not-allowed'}`}
        >
          {isLoading ? (
            <Loader2 size={14} className="animate-spin" />
          ) : (
            <SendHorizontal size={14} />
          )}
        </button>
      </div>
      <div className="text-[10px] text-[var(--muted-foreground)] text-center font-medium">
        Shift + Enter for new line • SQL is validated before execution
      </div>
    </div>
  );
}
