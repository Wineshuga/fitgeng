import { cn } from '@/utils/cn';

const sizes = { sm: 'size-4 border-2', md: 'size-6 border-2', lg: 'size-10 border-[3px]' };

export function Spinner({ size = 'md', className }: { size?: keyof typeof sizes; className?: string }) {
  return (
    <span
      role="progressbar"
      aria-label="Loading"
      className={cn('inline-block animate-spin rounded-full border-current border-r-transparent', sizes[size], className)}
    />
  );
}
