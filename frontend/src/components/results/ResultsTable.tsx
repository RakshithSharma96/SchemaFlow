'use client';

import React, { useState } from 'react';
import type { QueryResult } from '@/lib/types';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ResultsTableProps {
  result: QueryResult;
}

export function ResultsTable({ result }: ResultsTableProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  if (!result.rows || result.rows.length === 0) {
    return (
      <div className="p-8 text-center text-sm text-[var(--muted-foreground)]">
        Query returned 0 rows.
      </div>
    );
  }

  const limit = 15;
  const hasMore = result.rows.length > limit;
  const displayRows = isExpanded ? result.rows : result.rows.slice(0, limit);

  return (
    <div className="w-full flex flex-col">
      <div className="w-full overflow-x-auto">
        <table className="w-full text-sm text-left border-collapse tabular-nums">
          <thead className="text-xs uppercase bg-[var(--muted)] text-[var(--muted-foreground)]">
            <tr>
              {result.columns.map((col, i) => (
                <th 
                  key={i} 
                  className="px-4 py-2 font-medium whitespace-nowrap border-b border-[var(--border)]"
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {displayRows.map((row, rowIndex) => (
              <tr 
                key={rowIndex} 
                className="hover:bg-[var(--muted)]/50 transition-colors"
              >
                {row.map((cell, cellIndex) => (
                  <td 
                    key={cellIndex} 
                    className="px-4 py-2 whitespace-nowrap text-[var(--foreground)] truncate max-w-[200px]"
                    title={cell !== null ? String(cell) : 'NULL'}
                  >
                    {cell !== null ? String(cell) : (
                      <span className="text-[var(--muted-foreground)] italic">NULL</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {hasMore && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full py-2.5 text-xs font-medium text-[var(--muted-foreground)] hover:text-[var(--foreground)] bg-[var(--muted)]/30 hover:bg-[var(--muted)]/50 transition-colors flex items-center justify-center gap-1 border-t border-[var(--border)]"
        >
          {isExpanded ? (
            <>
              <ChevronUp size={14} />
              Show less
            </>
          ) : (
            <>
              <ChevronDown size={14} />
              View all {result.rows.length} rows
            </>
          )}
        </button>
      )}
    </div>
  );
}
