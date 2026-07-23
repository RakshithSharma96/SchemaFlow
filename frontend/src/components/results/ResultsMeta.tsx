'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Rows, Download } from 'lucide-react';
import { formatNumber, formatExecutionTime, downloadCSV } from '@/lib/utils';
import type { FullQueryResponse } from '@/lib/types';
import { Badge } from '@/components/ui/Badge';

interface ResultsMetaProps {
  result: FullQueryResponse;
}

export function ResultsMeta({ result }: ResultsMetaProps) {
  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-wrap items-center gap-2 mt-3"
    >
      <Badge variant="default" className="px-3">
        <Rows size={12} />
        {formatNumber(result.row_count)} row{result.row_count !== 1 ? 's' : ''}
      </Badge>
      <Badge variant="secondary" className="px-3">
        <Clock size={12} />
        {formatExecutionTime(result.execution_time_ms)}
      </Badge>
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => downloadCSV(result)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-[11px] font-bold tracking-wide uppercase rounded-full ml-auto cursor-pointer transition-colors"
        style={{
          color: 'var(--color-text-2)',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--color-border)',
        }}
        aria-label="Download results as CSV"
      >
        <Download size={12} />
        Export CSV
      </motion.button>
    </motion.div>
  );
}
