'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { PageHeader } from '@/components/admin/PageHeader';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, Info, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface Notification {
  id: number;
  user_id: number;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

const TYPE_ICONS: Record<string, any> = {
  INFO: Info,
  SUCCESS: CheckCircle,
  WARNING: AlertTriangle,
  ERROR: XCircle,
};

const TYPE_COLORS: Record<string, string> = {
  INFO: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SUCCESS: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  WARNING: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  ERROR: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    fetch(`${API_URL}/api/notifications/`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => setNotifications(data.notifications || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <Sidebar>
      <PageHeader 
        title="Notifications" 
        description={unreadCount > 0 ? `You have ${unreadCount} unread notifications` : 'All caught up!'} 
      />

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : notifications.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Bell className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">No notifications yet</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => {
            const Icon = TYPE_ICONS[notification.type] || Info;
            return (
              <Card
                key={notification.id}
                className={`p-4 transition-colors ${
                  !notification.is_read ? 'border-l-4 border-l-primary' : ''
                }`}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${TYPE_COLORS[notification.type]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{notification.type}</p>
                      {!notification.is_read && (
                        <Badge variant="secondary" className="text-xs">New</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(notification.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </Sidebar>
  );
}
