import React from 'react';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center rounded-xl border border-dashed border-[var(--border)] bg-[var(--background)] animate-in fade-in duration-500">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--muted)]">
        <Icon className="h-6 w-6 text-[var(--muted-foreground)]" />
      </div>
      <h3 className="mb-1 text-sm font-semibold text-[var(--foreground)]">{title}</h3>
      <p className="mb-4 text-sm text-[var(--muted-foreground)] max-w-sm">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
