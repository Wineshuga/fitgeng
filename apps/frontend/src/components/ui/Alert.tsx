import type { ReactNode } from 'react';
import { cn } from '@/utils/cn';

const tones = {
  error: 'border-danger-line bg-danger-soft text-danger',
  success: 'border-success-line bg-success-soft text-success-strong',
  info: 'border-info-line bg-info-soft text-info-strong',
} as const;

/** Inline status message. Errors use role="alert" so screen readers announce them. */
export function Alert({ tone, children, className }: { tone: keyof typeof tones; children: ReactNode; className?: string }) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={cn('rounded-xl border px-4 py-3 text-sm', tones[tone], className)}>
      {children}
    </div>
  );
}
