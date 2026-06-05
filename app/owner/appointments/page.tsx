'use client';

import { useState, useMemo, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppointments, usePets, useStaff, createAppointment } from '@/hooks/useAPI';
import { StatusBadge } from '@/components/ui/status-badge';
import { getPetColorStyles } from '@/hooks/useRoleIndicator';
import { toast } from '@/lib/toast';
import { Plus, Loader2 } from 'lucide-react';
import type { Appointment, Pet } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const appointmentSchema = z.object({
  pet_id: z.string().min(1, 'Please select a pet'),
  staff_id: z.string().min(1, 'Please select a veterinarian'),
  appointment_date: z.string().min(1, 'Please select a date'),
  start_time: z.string().min(1, 'Please select a time slot'),
  notes: z.string().optional(),
  end_time: z.string().optional(),
});

type AppointmentForm = z.infer<typeof appointmentSchema>;

interface StaffWithAvailability {
  id: number;
  specialty?: string;
  users?: { name: string };
  staff_availability?: { day_of_week: number; start_time: string; end_time: string; is_available: boolean }[];
}

interface TimeSlot {
  start: string;
  end: string;
  label: string;
}

const TIME_SLOTS: TimeSlot[] = [
  { start: '08:00', end: '08:30', label: '8:00 AM' },
  { start: '08:30', end: '09:00', label: '8:30 AM' },
  { start: '09:00', end: '09:30', label: '9:00 AM' },
  { start: '09:30', end: '10:00', label: '9:30 AM' },
  { start: '10:00', end: '10:30', label: '10:00 AM' },
  { start: '10:30', end: '11:00', label: '10:30 AM' },
  { start: '11:00', end: '11:30', label: '11:00 AM' },
  { start: '11:30', end: '12:00', label: '11:30 AM' },
  { start: '13:00', end: '13:30', label: '1:00 PM' },
  { start: '13:30', end: '14:00', label: '1:30 PM' },
  { start: '14:00', end: '14:30', label: '2:00 PM' },
  { start: '14:30', end: '15:00', label: '2:30 PM' },
  { start: '15:00', end: '15:30', label: '3:00 PM' },
  { start: '15:30', end: '16:00', label: '3:30 PM' },
  { start: '16:00', end: '16:30', label: '4:00 PM' },
  { start: '16:30', end: '17:00', label: '4:30 PM' },
];

interface BookedSlot {
  appointment_date: string;
  start_time: string;
  end_time: string;
}

export default function MyAppointmentsPage() {
  const { appointments, isLoading, mutate } = useAppointments();
  const { pets } = usePets();
  const { staff } = useStaff();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedStaffId, setSelectedStaffId] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null);
  const [bookedSlots, setBookedSlots] = useState<BookedSlot[]>([]);
  const [timeError, setTimeError] = useState<string>('');

  const filteredAppointments = useMemo(() => {
    return appointments;
  }, [appointments]);

  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<AppointmentForm>({
    resolver: zodResolver(appointmentSchema),
  });

  const appointmentsKey = JSON.stringify(appointments.map((a: Appointment) => ({ id: a.id, date: a.appointment_date, start: a.start_time, end: a.end_time })));
  
  useEffect(() => {
    const booked = appointments.map((apt: Appointment) => ({
      appointment_date: apt.appointment_date,
      start_time: apt.start_time || '',
      end_time: apt.end_time || '',
    }));
    setBookedSlots(booked);
  }, [appointmentsKey]);

  const getAvailableSlots = useMemo((): TimeSlot[] => {
    if (!selectedDate || !selectedStaffId) return [];
    
    const selectedStaff = staff.find((s: StaffWithAvailability) => s.id === parseInt(selectedStaffId));
    if (!selectedStaff?.staff_availability) return [];

    const date = new Date(selectedDate);
    const dayOfWeek = date.getDay();
    
    const normalizeTime = (t: string) => t.substring(0, 5);
    
    const availableStaffSlots = selectedStaff.staff_availability
      .filter((a: { day_of_week: number; is_available: boolean }) => a.day_of_week === dayOfWeek && a.is_available)
      .map((a: { start_time: string; end_time: string }) => ({
        start: normalizeTime(a.start_time),
        end: normalizeTime(a.end_time),
      }));

    const bookedForDate = bookedSlots.filter(b => b.appointment_date === selectedDate);
    const bookedStartTimes = new Set(
      bookedForDate.map(b => normalizeTime(b.start_time))
    );

    return TIME_SLOTS.filter(slot => {
      const isAvailable = availableStaffSlots.some(
        (as: { start: string; end: string }) => as.start === slot.start && as.end === slot.end
      );
      const isBooked = bookedStartTimes.has(slot.start);
      return isAvailable && !isBooked;
    });
  }, [selectedDate, selectedStaffId, staff, bookedSlots]);

  const validateSlot = () => {
    if (!selectedSlot || !selectedDate) return true;
    
    const bookedForDate = bookedSlots.filter(b => b.appointment_date === selectedDate);
    
    const hasConflict = bookedForDate.some(b => {
      const bStart = parseInt(b.start_time.substring(0, 5).replace(':', ''));
      const bEnd = parseInt(b.end_time.substring(0, 5).replace(':', ''));
      const slotStart = parseInt(selectedSlot.start.replace(':', ''));
      const slotEnd = parseInt(selectedSlot.end.replace(':', ''));
      return (slotStart < bEnd && slotEnd > bStart);
    });

    if (hasConflict) {
      setTimeError('This time slot is no longer available');
      return false;
    }

    setTimeError('');
    return true;
  };

  const handleStaffChange = (value: string) => {
    setSelectedStaffId(value);
    setSelectedDate('');
    setSelectedSlot(null);
    setTimeError('');
    setSelectedSlot(null);
  };

  const isWeekend = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const day = date.getDay();
    return day === 0 || day === 6;
  };

  const handleDateChange = (value: string) => {
    if (isWeekend(value)) {
      setTimeError('Appointments are not available on weekends');
      return;
    }
    setSelectedDate(value);
    setSelectedSlot(null);
    setTimeError('');
    setValue('appointment_date', value);
    setValue('start_time', '');
    setValue('end_time', '');
  };

  const handleSlotChange = (slot: TimeSlot) => {
    setSelectedSlot(slot);
    setValue('start_time', slot.start);
    setValue('end_time', slot.end);
    setTimeError('');
  };

  const onSubmit = async (data: AppointmentForm) => {
    if (!validateSlot()) return;
    
    setSubmitting(true);
    try {
      await createAppointment({
        ...data,
        pet_id: parseInt(data.pet_id),
        staff_id: parseInt(data.staff_id),
        start_time: selectedSlot!.start,
        end_time: selectedSlot!.end,
      });
      mutate();
      reset();
      setOpen(false);
      setSelectedStaffId('');
      setSelectedDate('');
      setSelectedSlot(null);
      toast.success('Appointment booked', {
        description: 'Your appointment has been booked successfully.',
      });
    } catch (error) {
      toast.error('Booking failed', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setSubmitting(false);
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

  const formatDateTime = (date: string, startTime: string, endTime: string) => {
    const d = new Date(date);
    return `${d.toLocaleDateString()} - ${formatTime(startTime)} to ${formatTime(endTime)}`;
  };

  const columns = [
    {
      key: 'id' as const,
      label: 'ID',
    },
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
      key: 'staff_id' as const,
      label: 'Veterinarian',
      render: (value: number, item: any) => item.staff?.users?.name || `Staff #${value}`,
    },
    { key: 'appointment_date' as const, label: 'Date', render: (_: string, item: Appointment) => new Date(item.appointment_date).toLocaleDateString() },
    { key: 'start_time' as const, label: 'Time', render: (_: string, item: Appointment) => `${formatTime(item.start_time)} - ${formatTime(item.end_time)}` },
    {
      key: 'status' as const,
      label: 'Status',
      render: (value: string) => <StatusBadge status={value} />,
    },
  ];

  const searchKeys = ['id', 'pet_id', 'appointment_date', 'status', 'notes', 'pets.name', 'pets.species'];

  

  const canCancel = (appointment: Appointment) => {
    return appointment.status === 'PENDING' || appointment.status === 'CONFIRMED';
  };

  const handleCancelAppointment = async (appointment: Appointment) => {
    try {
      const res = await fetch(`${API_URL}/api/appointments?id=${appointment.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'CANCELLED' }),
      });
      if (res.ok) {
        mutate();
        toast.success('Appointment cancelled');
      }
    } catch (error) {
      console.error('Failed to cancel appointment:', error);
    }
  };

  return (
    <Sidebar>
      <PageHeader 
        title="My Appointments" 
        description="Book and manage your pet's veterinary appointments"
        action={
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setSelectedStaffId('');
            setSelectedDate('');
            setSelectedSlot(null);
            setTimeError('');
            reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Book Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Book Appointment</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
              <FieldGroup>
                <FieldLabel>Select Pet</FieldLabel>
                <Select onValueChange={(value) => setValue('pet_id', value)}>
                  <SelectTrigger className={errors.pet_id ? 'border-destructive focus-visible:ring-destructive/20' : 'border-border'}>
                    <SelectValue placeholder="Choose a pet" />
                  </SelectTrigger>
                  <SelectContent>
                    {pets.map((pet: Pet) => (
                      <SelectItem key={pet.id} value={pet.id.toString()}>
                        {pet.name} ({pet.species})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.pet_id && (
                  <p className="text-sm text-destructive">{errors.pet_id.message}</p>
                )}
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>Select Veterinarian</FieldLabel>
                <Select value={selectedStaffId} onValueChange={handleStaffChange}>
                  <SelectTrigger className={errors.staff_id ? 'border-destructive focus-visible:ring-destructive/20' : 'border-border'}>
                    <SelectValue placeholder="Choose a veterinarian" />
                  </SelectTrigger>
                  <SelectContent>
                    {(staff as StaffWithAvailability[]).map((member: StaffWithAvailability) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.users?.name || `Staff #${member.id}`} {member.specialty ? `(${member.specialty})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.staff_id && (
                  <p className="text-sm text-destructive">{errors.staff_id.message}</p>
                )}
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>Appointment Date</FieldLabel>
                <Input
                  type="date"
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => handleDateChange(e.target.value)}
                  aria-invalid={!!errors.appointment_date}
                  className={errors.appointment_date ? 'border-destructive focus-visible:ring-destructive/20' : 'border-border'}
                />
                {errors.appointment_date && (
                  <p className="text-sm text-destructive">{errors.appointment_date.message}</p>
                )}
              </FieldGroup>

              {selectedStaffId && selectedDate && (
                <>
                  <FieldGroup>
                    <FieldLabel>Available Time Slots</FieldLabel>
                    {getAvailableSlots.length > 0 ? (
                      <div className="grid grid-cols-2 gap-2">
                        {TIME_SLOTS.map((slot) => {
                          const isAvailable = getAvailableSlots.some(s => s.start === slot.start);
                          const isSelected = selectedSlot?.start === slot.start;
                          
                          return (
                            <button
                              key={slot.start}
                              type="button"
                              disabled={!isAvailable}
                              onClick={() => handleSlotChange(slot)}
                              className={`p-2 sm:p-3 rounded-lg border-2 text-xs sm:text-sm font-medium transition-all ${
                                isSelected
                                  ? 'border-primary bg-primary text-primary-foreground'
                                  : isAvailable
                                    ? 'border-border hover:border-primary/50 cursor-pointer'
                                    : 'border-border bg-muted cursor-not-allowed opacity-50'
                              }`}
                            >
                              {slot.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="p-3 sm:p-4 text-center text-muted-foreground border border-border rounded-lg text-sm">
                        No available slots for this date
                      </div>
                    )}
                    {errors.start_time && (
                      <p className="text-sm text-destructive">{errors.start_time.message}</p>
                    )}
                  </FieldGroup>

                  {timeError && (
                    <p className="text-sm text-destructive">{timeError}</p>
                  )}
                </>
              )}

              <FieldGroup>
                <FieldLabel>Notes (Optional)</FieldLabel>
                <Input
                  {...register('notes')}
                  placeholder="Any special requests or concerns?"
                  className="border-border"
                />
              </FieldGroup>

              <Button
                type="submit"
                disabled={submitting || !selectedSlot}
                className="w-full"
              >
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Booking...
                  </>
                ) : (
                  'Book Appointment'
                )}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        }
      />

      <DataTable<Appointment>
        data={filteredAppointments}
        columns={columns}
        loading={isLoading}
        searchKeys={searchKeys}
        actions={(appointment) => (
          canCancel(appointment) ? (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive"
              onClick={() => handleCancelAppointment(appointment)}
            >
              Cancel
            </Button>
          ) : null
        )}
      />
    </Sidebar>
  );
}
