import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function PageHeader({ title, description, action, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-4 sm:mb-6 flex flex-col xs:flex-row xs:items-center xs:justify-between gap-2 sm:gap-4', className)}>
      <div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{title}</h1>
        {description && (
          <p className="text-muted-foreground mt-0.5 sm:mt-1 text-sm">{description}</p>
        )}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

interface PageSectionProps {
  title?: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function PageSection({ title, description, children, className }: PageSectionProps) {
  return (
    <div className={cn('mb-6', className)}>
      {(title || description) && (
        <div className="mb-4">
          {title && <h2 className="text-lg font-semibold text-foreground">{title}</h2>}
          {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
        </div>
      )}
      {children}
    </div>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {icon && <div className="mb-4 text-muted-foreground">{icon}</div>}
      <h3 className="text-lg font-medium text-foreground mb-1">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}
