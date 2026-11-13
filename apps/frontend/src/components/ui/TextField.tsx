'use client';

import { useId, type InputHTMLAttributes } from 'react';
import { cn } from '@/utils/cn';

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  error?: string;
  hint?: string;
}

/**
 * Labelled input with accessible error and hint text: the error is announced
 * and linked through aria-describedby, and aria-invalid is set when present.
 */
export function TextField({ label, error, hint, className, ...input }: TextFieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={[errorId, hintId].filter(Boolean).join(' ') || undefined}
        className={cn(
          'h-11 rounded-xl border bg-surface px-3 text-base outline-none transition-colors placeholder:text-fg-subtle',
          'focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30',
          error ? 'border-danger' : 'border-line-strong',
        )}
        {...input}
      />
      {hint && !error && (
        <p id={hintId} className="text-xs text-fg-subtle">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
