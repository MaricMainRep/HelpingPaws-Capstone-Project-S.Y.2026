'use client';

import { useState, useMemo } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DataTable } from '@/components/admin/DataTable';
import { PageHeader } from '@/components/admin/PageHeader';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Card } from '@/components/ui/card';
import { Calendar, Clock, User, Archive, RotateCcw } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { EmptyState } from '@/components/common/EmptyState';
import { useAppointments } from '@/hooks/useAPI';
import { getPetColorStyles } from '@/hooks/useRoleIndicator';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import type { Appointment } from '@/lib/supabase';

export default function AdminAppointmentsPage() {
  const { appointments, isLoading, mutate } = useAppointments();
  const [appointmentToArchive, setAppointmentToArchive] = useState<Appointment | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

  const filteredAppointments = useMemo(() => {
    return appointments;
  }, [appointments]);

  const formatTime = (time: string) => {
    if (!time) return '';
    const [hours] = time.split(':');
    const h = parseInt(hours);
    if (h === 0) return '12:00 AM';
    if (h < 12) return `${h}:00 AM`;
    if (h === 12) return '12:00 PM';
    return `${h - 12}:00 PM`;
  };

  const formatTimeRange = (start: string, end: string) => {
    return `${formatTime(start)} - ${formatTime(end)}`;
  };

  const handleArchive = async () => {
    if (!appointmentToArchive) return;
    setIsArchiving(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    try {
      const res = await fetch(`${API_URL}/api/appointments/`, {
        method: 'PATCH',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: appointmentToArchive.id, is_active: false }),
      });
      if (res.ok) {
        mutate();
        setAppointmentToArchive(null);
        toast.success('Appointment archived');
      }
    } catch (error) {
      console.error('Failed to archive appointment:', error);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestore = async (appointment: Appointment) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    try {
      const res = await fetch(`${API_URL}/api/appointments/`, {
        method: 'PATCH',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: appointment.id, is_active: true }),
      });
      if (res.ok) {
        mutate();
        toast.success('Appointment restored');
      }
    } catch (error) {
      console.error('Failed to restore appointment:', error);
    }
  };

  const columns = [
    { key: 'id' as const, label: 'ID' },
    { key: 'pet_id' as const, label: 'Pet', render: (_: number, item: Appointment) => {
      const petStyles = getPetColorStyles(item.pet_id);
      return (
        <span className={`px-2 py-1 rounded-md ${petStyles.bg} ${petStyles.text} font-medium`}>
          {(item as any).pets?.name || `Pet #${item.pet_id}`}
        </span>
      );
    } },
    { key: 'staff_id' as const, label: 'Veterinarian', render: (_: number, item: Appointment) => (item as any).staff?.users?.name || `Staff #${item.staff_id}` || '-' },
    { key: 'appointment_date' as const, label: 'Date', render: (_: string, item: Appointment) => new Date(item.appointment_date).toLocaleDateString() },
    { key: 'start_time' as const, label: 'Time', render: (_: string, item: Appointment) => formatTimeRange(item.start_time, item.end_time) },
    { key: 'status' as const, label: 'Status', render: (v: string) => <StatusBadge status={v} /> },
    { key: 'notes' as const, label: 'Notes', render: (v?: string) => v || '-' },
  ];

  const searchKeys = ['id', 'pet_id', 'appointment_date', 'start_time', 'end_time', 'status', 'notes', 'pets.name', 'pets.species', 'staff.users.name'];

  const pendingCount = filteredAppointments.filter((a: Appointment) => a.status === 'PENDING').length;
  const todayCount = filteredAppointments.filter((a: Appointment) => {
    const today = new Date().toISOString().split('T')[0];
    return a.appointment_date.startsWith(today);
  }).length;

  return (
    <Sidebar>
      <PageHeader 
        title="All Appointments" 
        description="View and manage all clinic appointments" 
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10"><Calendar className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{appointments.length}</p>
              <p className="text-sm text-muted-foreground">Total Appointments</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30"><Clock className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><User className="h-5 w-5 text-green-600" /></div>
            <div>
              <p className="text-2xl font-bold">{todayCount}</p>
              <p className="text-sm text-muted-foreground">Today</p>
            </div>
          </div>
        </Card>
      </div>

      {isLoading ? (
        <DataTable<Appointment> data={[]} columns={columns} loading={true} searchKeys={searchKeys} />
      ) : appointments.length === 0 ? (
        <EmptyState
          icon={Calendar}
          title="No appointments scheduled"
          description="There are no appointments at the moment."
        />
      ) : (
        <DataTable<Appointment> data={filteredAppointments} columns={columns} loading={isLoading} searchKeys={searchKeys} filters={[{
          key: 'is_active',
          label: 'Status',
          options: [{value: 'true', label: 'Active'}, {value: 'false', label: 'Inactive'}]
        }]} actions={(appt) => (
          <div className="flex gap-2">
            {appt.is_active ? (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setAppointmentToArchive(appt)}
                className="text-destructive"
              >
                <Archive className="h-4 w-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleRestore(appt)}
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        )} />
      )}

      <ConfirmDialog
        open={!!appointmentToArchive}
        title="Archive Appointment"
        description={`Archive appointment for ${appointmentToArchive?.pets?.name || `Pet #${appointmentToArchive?.pet_id}`}?`}
        actionLabel="Archive"
        onConfirm={handleArchive}
        onCancel={() => setAppointmentToArchive(null)}
        isLoading={isArchiving}
      />
    </Sidebar>
  );
}