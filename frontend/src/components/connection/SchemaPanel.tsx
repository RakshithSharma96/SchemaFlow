'use client';

import React, { useEffect, useState } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Table2,
  Key,
  Link,
  Loader2,
  Database,
} from 'lucide-react';
import { getSchema } from '@/lib/api';
import type { SchemaInfo, TableInfo } from '@/lib/types';

interface SchemaPanelProps {
  sessionId: string;
}

export function SchemaPanel({ sessionId }: SchemaPanelProps) {
  const [schema, setSchema] = useState<SchemaInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!sessionId) return;
    setLoading(true);
    getSchema(sessionId)
      .then((res) => {
        if (res.success && res.data) setSchema(res.data);
        else setError(res.error ?? 'Failed to load schema');
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [sessionId]);

  const toggle = (tableName: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(tableName)) next.delete(tableName);
      else next.add(tableName);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-4 text-sm" style={{ color: 'var(--color-text-3)' }}>
        <Loader2 size={14} className="animate-spin" />
        Loading schema…
      </div>
    );
  }

  if (error) {
    return (
      <p className="p-4 text-xs text-red-400">{error}</p>
    );
  }

  if (!schema) return null;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div
        className="px-4 py-3 flex items-center gap-2 flex-shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <Database size={14} style={{ color: 'var(--color-primary)' }} />
        <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-2)' }}>
          {schema.database_name}
        </span>
        <span
          className="text-xs px-1.5 py-0.5 rounded ml-auto"
          style={{ background: 'rgba(124,58,237,0.12)', color: 'var(--color-primary)' }}
        >
          {schema.table_count}
        </span>
      </div>

      {/* Tables */}
      <div className="flex-1 overflow-y-auto py-2">
        {schema.tables.map((table) => (
          <TableItem
            key={table.name}
            table={table}
            isExpanded={expanded.has(table.name)}
            onToggle={() => toggle(table.name)}
          />
        ))}
      </div>
    </div>
  );
}

function TableItem({
  table,
  isExpanded,
  onToggle,
}: {
  table: TableInfo;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors duration-150 cursor-pointer"
        style={{ color: 'var(--color-text-1)' }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.04)'; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
      >
        {isExpanded
          ? <ChevronDown size={13} style={{ color: 'var(--color-text-3)', flexShrink: 0 }} />
          : <ChevronRight size={13} style={{ color: 'var(--color-text-3)', flexShrink: 0 }} />
        }
        <Table2 size={13} style={{ color: 'var(--color-secondary)', flexShrink: 0 }} />
        <span className="font-medium truncate text-xs">{table.name}</span>
        {table.row_count !== null && (
          <span className="ml-auto text-xs" style={{ color: 'var(--color-text-3)', flexShrink: 0 }}>
            {table.row_count.toLocaleString()}
          </span>
        )}
      </button>

      {isExpanded && (
        <div className="pb-1">
          {table.columns.map((col) => (
            <div
              key={col.name}
              className="flex items-center gap-2 pl-10 pr-4 py-1.5 text-xs"
              style={{ color: 'var(--color-text-2)' }}
            >
              {col.primary_key ? (
                <Key size={10} className="flex-shrink-0" style={{ color: '#f59e0b' }} />
              ) : col.foreign_key ? (
                <Link size={10} className="flex-shrink-0" style={{ color: '#60a5fa' }} />
              ) : (
                <span className="w-2.5 flex-shrink-0" />
              )}
              <span className="truncate font-medium" style={{ color: 'var(--color-text-1)' }}>
                {col.name}
              </span>
              <span className="ml-auto mono text-xs" style={{ color: 'var(--color-text-3)', flexShrink: 0 }}>
                {col.data_type.split('(')[0].toLowerCase()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
