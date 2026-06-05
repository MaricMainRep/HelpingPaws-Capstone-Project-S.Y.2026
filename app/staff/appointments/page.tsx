'use client';

import { useState, useEffect, useMemo } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useAppointments } from '@/hooks/useAPI';
import { StatusBadge } from '@/components/ui/status-badge';
import { getPetColorStyles } from '@/hooks/useRoleIndicator';
import { toast } from '@/lib/toast';
import type { Appointment } from '@/lib/supabase';

export default function StaffAppointmentsPage() {
  const { appointments, isLoading, mutate } = useAppointments();
  const [appointmentToAction, setAppointmentToAction] = useState<{
    appointment: Appointment;
    action: 'confirm' | 'reject' | 'complete';
  } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const filteredAppointments = useMemo(() => {
    return appointments;
  }, [appointments]);

  const handleAction = async () => {
    if (!appointmentToAction) return;
    setIsProcessing(true);
    try {
      const status =
        appointmentToAction.action === 'confirm'
          ? 'CONFIRMED'
          : appointmentToAction.action === 'reject'
            ? 'REJECTED'
            : 'COMPLETED';

      const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

      await fetch(`${API_URL}/api/appointments/`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: appointmentToAction.appointment.id, status }),
        credentials: 'include',
      });
      mutate();
      setAppointmentToAction(null);
      toast.success('Appointment updated', {
        description: `Appointment has been ${status.toLowerCase()}.`,
      });
    } catch (error) {
      toast.error('Failed to update appointment', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsProcessing(false);
    }
  };

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

  const columns = [
    { key: 'id' as const, label: 'ID' },
    {
      key: 'pet_id' as const,
      label: 'Pet',
      render: (value: number, item: any) => {
        const petStyles = getPetColorStyles(value);
        return (
          <span className={`px-2 py-1 rounded-md ${petStyles.bg} ${petStyles.text} font-medium`}>
            {item.pets?.name || `Pet #${value}`}
          </span>
        );
      },
    },
    {
      key: 'owner_id' as const,
      label: 'Owner',
      render: (value: number, item: any) => {
        const owner = item.pet_owners || item.pets?.pet_owners;
        return owner?.users?.name || `Owner #${value}`;
      },
    },
    { key: 'appointment_date' as const, label: 'Date', render: (_: string, item: Appointment) => new Date(item.appointment_date).toLocaleDateString() },
    { key: 'start_time' as const, label: 'Time', render: (_: string, item: Appointment) => formatTimeRange(item.start_time, item.end_time) },
    {
      key: 'status' as const,
      label: 'Status',
      render: (value: string) => <StatusBadge status={value} />,
    },
    { key: 'notes' as const, label: 'Notes', render: (value: string | null) => value || '-' },
  ];

  const searchKeys = ['id', 'pet_id', 'appointment_date', 'start_time', 'end_time', 'status', 'notes', 'pets.name', 'pets.species'];

  

  return (
    <Sidebar>
      <PageHeader 
        title="Appointments" 
        description="View and manage upcoming and past appointments" 
      />

      <DataTable<Appointment>
        data={filteredAppointments}
        columns={columns}
        loading={isLoading}
        searchKeys={searchKeys}
        actions={(appointment) => (
          <div className="flex gap-2 justify-center">
            {appointment.status === 'PENDING' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setAppointmentToAction({ appointment, action: 'confirm' })}
                >
                  Confirm
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="text-destructive"
                  onClick={() => setAppointmentToAction({ appointment, action: 'reject' })}
                >
                  Reject
                </Button>
              </>
            )}
            {appointment.status === 'CONFIRMED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAppointmentToAction({ appointment, action: 'complete' })}
              >
                Complete
              </Button>
            )}
          </div>
        )}
      />

      {appointmentToAction && (
        <ConfirmDialog
          open={!!appointmentToAction}
          title={
            appointmentToAction.action === 'confirm'
              ? 'Confirm Appointment'
              : appointmentToAction.action === 'reject'
                ? 'Reject Appointment'
                : 'Mark as Completed'
          }
          description={
            appointmentToAction.action === 'confirm'
              ? 'Are you sure you want to confirm this appointment?'
              : appointmentToAction.action === 'reject'
                ? 'Are you sure you want to reject this appointment? The pet owner will be notified.'
                : 'Mark this appointment as completed?'
          }
          actionLabel={
            appointmentToAction.action === 'confirm'
              ? 'Confirm'
              : appointmentToAction.action === 'reject'
                ? 'Reject'
                : 'Complete'
          }
          onConfirm={handleAction}
          onCancel={() => setAppointmentToAction(null)}
          isLoading={isProcessing}
          variant={appointmentToAction.action === 'reject' ? 'destructive' : 'default'}
        />
      )}
    </Sidebar>
  );
}
