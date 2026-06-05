'use client';

import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { LucideIcon } from 'lucide-react';
import Link from 'next/link';

interface PreviewCardProps {
  title: string;
  icon: LucideIcon;
  href: string;
  loading?: boolean;
  emptyMessage?: string;
  children: React.ReactNode;
}

export function PreviewCard({
  title,
  icon: Icon,
  href,
  loading = false,
  emptyMessage = 'No data yet',
  children,
}: PreviewCardProps) {
  return (
    <Card className="border border-border flex flex-col">
      <div className="px-5 pt-5 pb-3 flex items-center justify-between border-b border-border/50">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-br from-[#3a7d6c]/10 to-[#57aa95]/10 rounded-lg">
            <Icon className="h-4 w-4 text-[#3a7d6c]" />
          </div>
          <h3 className="font-semibold text-foreground text-sm">{title}</h3>
        </div>
      </div>

      <div className="flex-1 px-5 py-3">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-1">
            {children}
          </div>
        )}
      </div>

      <div className="px-5 pb-4 pt-2 border-t border-border/50">
        <Link
          href={href}
          className="text-xs font-medium text-[#3a7d6c] hover:text-[#57aa95] transition-colors inline-flex items-center gap-1"
        >
          Show more
          <span className="text-xs">→</span>
        </Link>
      </div>
    </Card>
  );
}

export function PreviewCardItem({
  label,
  subtitle,
  href,
}: {
  label: string;
  subtitle?: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center justify-between py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors cursor-default">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-foreground truncate">{label}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
        )}
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
