'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { generateAndExecute, recommendChart, getAccessToken } from '@/lib/api';
import { generateId } from '@/lib/utils';
import type { ChatMessage, AIAnalysisResponse } from '@/lib/types';
import { useChatHistory } from '@/context/ChatHistoryContext';

interface UseChatReturn {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (question: string, sessionId: string) => Promise<void>;
  explainSql: (sql: string, messageId: string) => Promise<void>;
  clearMessages: () => void;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { activeChatId, updateChatTitle } = useChatHistory();

  const activeChatIdRef = useRef<string | null>(activeChatId);

  // Restore chat history from localStorage when activeChatId changes
  useEffect(() => {
    activeChatIdRef.current = activeChatId;
    if (!activeChatId) {
      setMessages([]);
      return;
    }
    try {
      const stored = localStorage.getItem(`ai_sql_agent_messages_${activeChatId}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        const hydrated = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }));
        setMessages(hydrated);
      } else {
        setMessages([]); // New chat
      }
    } catch (e) {
      console.error('Failed to restore chat history', e);
      setMessages([]);
    }
  }, [activeChatId]);

  // Save chat history to localStorage whenever messages change (debounced to prevent lag during streaming)
  useEffect(() => {
    // Only save if the messages actually belong to the current activeChatId
    if (activeChatId && activeChatIdRef.current === activeChatId) {
      const timeoutId = setTimeout(() => {
        localStorage.setItem(`ai_sql_agent_messages_${activeChatId}`, JSON.stringify(messages));
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [messages, activeChatId]);

  // Helper to parse incomplete JSON stream
  const parsePartialJson = (text: string): Partial<AIAnalysisResponse> => {
    try {
      return JSON.parse(text);
    } catch (e) {
      const partial: Partial<AIAnalysisResponse> = {};
      
      // Extract executive_summary
      const execMatch = text.match(/"executive_summary"\s*:\s*"([^]*?)(?:",|"$)/);
      if (execMatch) partial.executive_summary = execMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
      else {
        const execUnclosed = text.match(/"executive_summary"\s*:\s*"([^]*)/);
        if (execUnclosed) partial.executive_summary = execUnclosed[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
      }

      // Extract key_insights
      const insightsMatch = text.match(/"key_insights"\s*:\s*\[([^\]]*)/);
      if (insightsMatch) {
         const items = insightsMatch[1].match(/"([^"]*)"|"(.*)/g);
         if (items) {
           partial.key_insights = items.map(i => {
             if (i.endsWith('"') && i.length > 1) return i.slice(1, -1).replace(/\\"/g, '"');
             return i.slice(1).replace(/\\"/g, '"');
           });
         }
      }

      // Extract patterns
      const patternsMatch = text.match(/"patterns"\s*:\s*\[([^\]]*)/);
      if (patternsMatch) {
         const items = patternsMatch[1].match(/"([^"]*)"|"(.*)/g);
         if (items) {
           partial.patterns = items.map(i => {
             if (i.endsWith('"') && i.length > 1) return i.slice(1, -1).replace(/\\"/g, '"');
             return i.slice(1).replace(/\\"/g, '"');
           });
         }
      }

      // Extract limitations
      const limitMatch = text.match(/"limitations"\s*:\s*"([^]*?)(?:",|"$)/);
      if (limitMatch) {
        partial.limitations = limitMatch[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
      } else {
        const limitUnclosed = text.match(/"limitations"\s*:\s*"([^]*)/);
        if (limitUnclosed) partial.limitations = limitUnclosed[1].replace(/\\"/g, '"').replace(/\\n/g, '\n');
      }
      
      return partial;
    }
  };

  const streamText = async (
    endpoint: string,
    body: any,
    onChunk: (chunk: string) => void,
    onComplete: (headers: Headers) => void,
    onError: (err: any) => void
  ) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = getAccessToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch(`${baseUrl}/api/v1/intelligence/${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Stream request failed');
      
      const responseHeaders = response.headers;
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (reader) {
        let done = false;
        while (!done) {
          const { value, done: doneReading } = await reader.read();
          done = doneReading;
          if (value) {
            const chunk = decoder.decode(value, { stream: true });
            onChunk(chunk);
          }
        }
      }
      onComplete(responseHeaders);
    } catch (err) {
      onError(err);
    }
  };

  const explainSql = useCallback(async (sql: string, messageId: string) => {
    setMessages(prev => prev.map(m => 
      m.id === messageId ? { ...m, isExplainingSql: true, sqlExplanation: '' } : m
    ));

    await streamText(
      'explain-sql',
      { sql },
      (chunk) => {
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...m, sqlExplanation: (m.sqlExplanation || '') + chunk } : m
        ));
      },
      () => {
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...m, isExplainingSql: false } : m
        ));
      },
      (err) => {
        console.error(err);
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...m, isExplainingSql: false } : m
        ));
      }
    );
  }, []);

  const sendMessage = useCallback(async (question: string, sessionId: string) => {
    if (!question.trim() || isLoading || !activeChatId) return;

    const userMsg: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: question,
      timestamp: new Date(),
    };

    const loadingMsg: ChatMessage = {
      id: generateId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isLoading: true,
    };

    // If this is the first message, update the chat title
    if (messages.length === 0) {
      updateChatTitle(activeChatId, question.length > 30 ? question.slice(0, 30) + '...' : question);
    }

    setMessages((prev) => [...prev, userMsg, loadingMsg]);
    setIsLoading(true);

    try {
      const res = await generateAndExecute(sessionId, question);

      if (!res.success || !res.data) {
        throw new Error(res.error ?? 'Query failed');
      }
      
      const queryResult = res.data;

      const assistantMsg: ChatMessage = {
        id: loadingMsg.id,
        role: 'assistant',
        content: `Query returned ${queryResult.row_count} row${queryResult.row_count !== 1 ? 's' : ''}.`,
        timestamp: new Date(),
        queryResponse: queryResult,
        isLoading: false,
        isAnalyzing: true,
        rawAnalysisText: '',
        analysis: {}
      };

      setMessages((prev) => prev.map((m) => (m.id === loadingMsg.id ? assistantMsg : m)));

      // 1. Recommend chart deterministically
      recommendChart(question, queryResult.sql, queryResult.columns, queryResult.rows)
        .then((chartRes) => {
          if (chartRes.success && chartRes.data) {
            setMessages((prev) => prev.map((m) => 
              m.id === loadingMsg.id ? { ...m, chartConfig: chartRes.data } : m
            ));
          }
        }).catch(console.error);

      // 2. Stream JSON Analysis and get confidence score header
      await streamText(
        'analyze',
        { question, sql: queryResult.sql, columns: queryResult.columns, rows: queryResult.rows },
        (chunk) => {
          setMessages(prev => prev.map(m => {
            if (m.id === loadingMsg.id) {
              const newRaw = (m.rawAnalysisText || '') + chunk;
              const partialAnalysis = parsePartialJson(newRaw);
              return { ...m, rawAnalysisText: newRaw, analysis: partialAnalysis as AIAnalysisResponse };
            }
            return m;
          }));
        },
        (headers) => {
          const confidence = headers.get('X-Confidence-Score') || 'Medium';
          setMessages(prev => prev.map(m => {
            if (m.id === loadingMsg.id) {
              // Try final parse to get complete arrays (suggestions, patterns)
              let finalAnalysis = m.analysis;
              try {
                finalAnalysis = JSON.parse(m.rawAnalysisText || '{}');
              } catch (e) {
                // If it fails, keep the partial
              }
              return { 
                ...m, 
                isAnalyzing: false, 
                confidenceScore: confidence as any,
                analysis: finalAnalysis,
                suggestions: finalAnalysis?.suggested_questions || []
              };
            }
            return m;
          }));
        },
        (err) => {
          console.error(err);
          setMessages(prev => prev.map(m => 
            m.id === loadingMsg.id ? { ...m, isAnalyzing: false } : m
          ));
        }
      );

    } catch (err) {
      const errorMsg: ChatMessage = {
        id: loadingMsg.id,
        role: 'error',
        content: err instanceof Error ? err.message : 'An unexpected error occurred',
        timestamp: new Date(),
        isLoading: false,
      };
      setMessages((prev) => prev.map((m) => (m.id === loadingMsg.id ? errorMsg : m)));
    } finally {
      setIsLoading(false);
    }
  }, [isLoading]);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  return { messages, isLoading, sendMessage, explainSql, clearMessages };
}
