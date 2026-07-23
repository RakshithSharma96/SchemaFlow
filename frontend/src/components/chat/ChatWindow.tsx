'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, MessageSquare } from 'lucide-react';
import type { ChatMessage } from '@/lib/types';
import { MessageBubble } from './MessageBubble';
import { EmptyState } from '@/components/ui/EmptyState';

const EXAMPLE_QUESTIONS = [
  'Show the top 10 customers by total revenue',
  'How many orders were placed this month?',
  'Which products have the lowest stock?',
  'List all tables and their row counts',
];

interface ChatWindowProps {
  messages: ChatMessage[];
  onExampleClick?: (q: string) => void;
  onSuggestionClick?: (q: string) => void;
  onExplainSql?: (sql: string, messageId: string) => void;
}

export function ChatWindow({ messages, onExampleClick, onSuggestionClick, onExplainSql }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    // Fractional pixel safe check for "at bottom"
    const isAtBottom = scrollHeight - scrollTop - clientHeight <= 4;
    
    // If the user reaches the absolute bottom, snap back into auto-scroll mode
    if (isAtBottom) {
      setAutoScroll(true);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    // If the user actively scrolls UP with mouse wheel, break out of auto-scroll
    if (e.deltaY < 0) {
      setAutoScroll(false);
    }
  };

  const handleTouchMove = () => {
    // Any manual touch pan breaks out of auto-scroll. 
    // They can re-engage it by scrolling to the bottom.
    setAutoScroll(false);
  };

  useEffect(() => {
    if (autoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'auto' });
    }
  }, [messages, autoScroll]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 relative">
        <EmptyState
          icon={MessageSquare}
          title="Ask anything about your data"
          description="Type a question in natural language and the AI will generate and run the SQL query for you securely."
        />
        
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mt-4 z-10"
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.1
              }
            }
          }}
        >
          {EXAMPLE_QUESTIONS.map((q) => (
            <motion.button
              key={q}
              onClick={() => onExampleClick?.(q)}
              variants={{
                hidden: { opacity: 0, y: 15 },
                visible: { opacity: 1, y: 0, transition: { ease: [0.16, 1, 0.3, 1], duration: 0.5 } }
              }}
              whileHover={{ y: -2, scale: 1.01 }}
              whileTap={{ scale: 0.97 }}
              className="text-left px-5 py-4 rounded-2xl text-sm transition-all duration-300 cursor-pointer relative overflow-hidden group"
              style={{
                background: 'var(--color-surface-2)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-2)',
                boxShadow: 'var(--shadow-card)',
              }}
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                style={{
                  background: 'linear-gradient(135deg, var(--color-primary-subtle), transparent)',
                }}
              />
              <span className="relative z-10 group-hover:text-[var(--color-text-1)] transition-colors duration-300">
                {q}
              </span>
            </motion.button>
          ))}
        </motion.div>
      </div>
    );
  }

  return (
    <div 
      ref={scrollContainerRef}
      onScroll={handleScroll}
      onWheel={handleWheel}
      onTouchMove={handleTouchMove}
      className="flex-1 overflow-y-auto px-4 py-8 space-y-8"
    >
      <AnimatePresence initial={false}>
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <MessageBubble 
              message={msg} 
              onSuggestionClick={onSuggestionClick}
              onExplainSql={onExplainSql}
            />
          </motion.div>
        ))}
      </AnimatePresence>
      <div ref={bottomRef} className="h-4" />
    </div>
  );
}
