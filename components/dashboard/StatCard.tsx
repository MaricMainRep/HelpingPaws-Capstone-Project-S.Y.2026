import { Card } from '@/components/ui/card';
import { LucideIcon } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

interface StatCardProps {
  label: string;
  value: string | number;
  icon?: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  color?: 'indigo' | 'green' | 'blue' | 'red';
  loading?: boolean;
}

export function StatCard({
  label,
  value,
  icon: Icon,
  trend,
  color = 'indigo',
  loading = false,
}: StatCardProps) {
  const colorClasses = {
    indigo: 'bg-primary/10 text-primary',
    green: 'bg-green-500/10 text-green-600',
    blue: 'bg-cyan-500/10 text-cyan-600',
    red: 'bg-orange-500/10 text-orange-600',
  };

  if (loading) {
    return (
      <Card className="p-6 border border-border">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <Skeleton className="h-4 w-24 mb-2" />
            <Skeleton className="h-10 w-16" />
          </div>
          <Skeleton className="h-12 w-12 rounded-xl" />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 border border-border hover:border-primary/50 transition-all hover:shadow-lg">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground font-medium mb-2">{label}</p>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-foreground">{value}</span>
            {trend && (
              <span
                className={`text-xs font-semibold ${
                  trend.isPositive
                    ? 'text-green-600'
                    : 'text-orange-600'
                }`}
              >
                {trend.isPositive ? '↑' : '↓'}{trend.value}%
              </span>
            )}
          </div>
        </div>
        {Icon && (
          <div className={`p-3 rounded-xl ${colorClasses[color]} flex-shrink-0`}>
            <Icon className="h-6 w-6" />
          </div>
        )}
      </div>
    </Card>
  );
}
