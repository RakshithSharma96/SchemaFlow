import { useState, useCallback } from 'react';
import { suggestQuestions, recommendChart, getAccessToken } from '../lib/api';
import type { ChartConfig } from '../lib/types';

export function useIntelligence() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisText, setAnalysisText] = useState('');
  
  const [isExplainingSql, setIsExplainingSql] = useState(false);
  const [sqlExplanation, setSqlExplanation] = useState('');

  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [chartConfig, setChartConfig] = useState<ChartConfig | null>(null);

  const streamText = async (
    endpoint: string,
    body: any,
    onChunk: (text: string) => void,
    onComplete: () => void,
    onError: (err: any) => void
  ) => {
    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
      const token = getAccessToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;
      
      const response = await fetch(`${baseUrl}/api/v1/intelligence/${endpoint}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error('Stream request failed');
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
      onComplete();
    } catch (err) {
      onError(err);
    }
  };

  const analyzeResults = useCallback(async (question: string, sql: string, columns: string[], rows: any[][]) => {
    setIsAnalyzing(true);
    setAnalysisText('');
    await streamText(
      'analyze',
      { question, sql, columns, rows },
      (chunk) => setAnalysisText((prev) => prev + chunk),
      () => setIsAnalyzing(false),
      (err) => { console.error('Analyze error:', err); setIsAnalyzing(false); }
    );
  }, []);

  const explainSql = useCallback(async (sql: string) => {
    setIsExplainingSql(true);
    setSqlExplanation('');
    await streamText(
      'explain-sql',
      { sql },
      (chunk) => setSqlExplanation((prev) => prev + chunk),
      () => setIsExplainingSql(false),
      (err) => { console.error('Explain SQL error:', err); setIsExplainingSql(false); }
    );
  }, []);

  const fetchSuggestionsAndChart = useCallback(async (question: string, sql: string, columns: string[], rows: any[][]) => {
    try {
      const [sugRes, chartRes] = await Promise.all([
        suggestQuestions(question, sql, columns, rows),
        recommendChart(question, sql, columns, rows)
      ]);
      if (sugRes.success && sugRes.data) setSuggestions(sugRes.data.suggestions);
      if (chartRes.success && chartRes.data) setChartConfig(chartRes.data);
    } catch (err) {
      console.error('Failed to fetch intelligence metadata', err);
    }
  }, []);

  return {
    isAnalyzing,
    analysisText,
    analyzeResults,
    isExplainingSql,
    sqlExplanation,
    explainSql,
    suggestions,
    chartConfig,
    fetchSuggestionsAndChart,
  };
}
