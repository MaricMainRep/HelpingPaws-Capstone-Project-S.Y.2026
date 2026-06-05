import { Loader2Icon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingProps {
  className?: string;
  text?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

const sizeClasses = {
  sm: 'size-5',
  md: 'size-8',
  lg: 'size-10',
  xl: 'size-12',
};

function Loading({ className, text, size = 'md' }: LoadingProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3', className)}>
      <Loader2Icon
        role="status"
        aria-label="Loading"
        className={cn('animate-spin text-primary', sizeClasses[size])}
      />
      {text && (
        <p className="text-sm text-muted-foreground animate-pulse">{text}</p>
      )}
    </div>
  );
}

function LoadingPage({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loading text={text} size="lg" />
    </div>
  );
}

function LoadingOverlay({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50',
        className
      )}
    >
      <Loading size="lg" />
    </div>
  );
}

function LoadingCard({ className }: { className?: string }) {
  return (
    <div className={cn('flex items-center justify-center p-8', className)}>
      <Loading size="md" />
    </div>
  );
}

export { Loading, LoadingPage, LoadingOverlay, LoadingCard };
