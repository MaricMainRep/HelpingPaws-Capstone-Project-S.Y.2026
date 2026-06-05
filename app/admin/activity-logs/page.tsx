'use client';

import { Sidebar } from '@/components/dashboard/Sidebar';
import { PageHeader } from '@/components/admin/PageHeader';
import { Card } from '@/components/ui/card';
import { DataTable } from '@/components/admin/DataTable';
import { Clipboard } from 'lucide-react';
import { useActivityLogs } from '@/hooks/useAPI';


interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  entity_type: string;
  entity_id: number;
  created_at: string;
  users?: { name: string; email: string };
}

export default function ActivityLogsPage() {
  const { logs, isLoading: loading } = useActivityLogs();

  const formatAction = (action: string) => {
    return action
      .replace(/_/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const columns = [
    {
      key: 'created_at' as const,
      label: 'Time',
      render: (value: string) => {
        const date = new Date(value);
        return date.toLocaleString();
      },
    },
    {
      key: 'users' as const,
      label: 'User',
      render: (_: any, item: ActivityLog) => item.users?.name || `User #${item.user_id}`,
    },
    {
      key: 'action' as const,
      label: 'Action',
      render: (value: string) => (
        <span className="capitalize">{formatAction(value)}</span>
      ),
    },
    {
      key: 'entity_type' as const,
      label: 'Entity',
      render: (value: string) => value || '-',
    },
    {
      key: 'entity_id' as const,
      label: 'Entity ID',
      render: (value: number) => value || '-',
    },
  ];

  const searchKeys = ['action', 'entity_type', 'users.name', 'users.email'];

  return (
    <Sidebar>
      <PageHeader 
        title="Activity Logs" 
        description="Track all system activities and actions" 
      />

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : logs.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Clipboard className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">No activity logs yet</p>
        </Card>
      ) : (
        <DataTable<ActivityLog>
          data={logs}
          columns={columns}
          loading={loading}
          searchKeys={searchKeys}
        />
      )}
    </Sidebar>
  );
}
