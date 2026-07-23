// Utility helpers for the AI SQL Agent frontend

import type { FullQueryResponse } from './types';

/**
 * Generate a random UUID-like ID for chat messages.
 * Uses crypto.randomUUID() when available (modern browsers).
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Convert a FullQueryResponse to a CSV string and trigger a browser download.
 */
export function downloadCSV(result: FullQueryResponse, filename = 'query_results.csv'): void {
  const headers = result.columns.join(',');
  const rows = result.rows
    .map((row) =>
      row
        .map((cell) => {
          if (cell === null || cell === undefined) return '';
          const val = String(cell);
          // Wrap in quotes if value contains commas, quotes, or newlines
          return val.includes(',') || val.includes('"') || val.includes('\n')
            ? `"${val.replace(/"/g, '""')}"`
            : val;
        })
        .join(',')
    )
    .join('\n');

  const csv = `${headers}\n${rows}`;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Copy text to the clipboard. Returns true on success.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Format a number with thousands separators.
 */
export function formatNumber(n: number): string {
  return new Intl.NumberFormat().format(n);
}

/**
 * Format execution time — show ms if < 1000ms, else seconds.
 */
export function formatExecutionTime(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Truncate a string to a max length with ellipsis.
 */
export function truncate(str: string, maxLength = 60): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}…`;
}

/**
 * Map db_type string to a display label with icon identifier.
 */
export function dbTypeLabel(dbType: string): string {
  const map: Record<string, string> = {
    sqlite: 'SQLite',
    postgresql: 'PostgreSQL',
    mysql: 'MySQL',
  };
  return map[dbType.toLowerCase()] ?? dbType;
}
