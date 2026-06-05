import { Badge } from '@/components/ui/badge';

const STATUS_CONFIG: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  PENDING: { variant: 'secondary', label: 'Pending' },
  CONFIRMED: { variant: 'default', label: 'Confirmed' },
  COMPLETED: { variant: 'default', label: 'Completed' },
  CANCELLED: { variant: 'destructive', label: 'Cancelled' },
  REJECTED: { variant: 'destructive', label: 'Rejected' },
  ACTIVE: { variant: 'default', label: 'Active' },
  INACTIVE: { variant: 'secondary', label: 'Inactive' },
};

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const config = STATUS_CONFIG[status] || { variant: 'outline', label: status };
  return (
    <Badge variant={config.variant}>
      {config.label}
    </Badge>
  );
}
