'use client';

import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Plus, Pill, Pencil, Archive, Clock } from 'lucide-react';
import { usePets, useHealthRecords } from '@/hooks/useAPI';
import { toast } from '@/lib/toast';
import type { Pet, HealthRecord } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const prescriptionSchema = z.object({
  health_record_id: z.string().min(1, 'Please select a health record'),
  pet_id: z.string().min(1, 'Please select a pet'),
  medication_name: z.string().min(1, 'Medication name is required'),
  dosage: z.string().optional(),
  duration: z.string().optional(),
  scheduled_start: z.string().optional(),
  scheduled_end: z.string().optional(),
  scheduled_times: z.string().optional(),
  dosage_per_time: z.string().optional(),
});

type PrescriptionForm = z.infer<typeof prescriptionSchema>;

interface Prescription {
  id: number;
  pet_id: number;
  health_record_id: number;
  medication_name: string;
  dosage?: string;
  duration?: string;
  scheduled_start?: string;
  scheduled_end?: string;
  scheduled_times?: string;
  dosage_per_time?: string;
  created_at: string;
  pets?: { name: string; species: string };
}

function formatTimeDisplay(timeStr: string) {
  return timeStr
    .split(',')
    .map((t) => {
      const [h, m] = t.trim().split(':');
      const hour = parseInt(h);
      const amPm = hour >= 12 ? 'PM' : 'AM';
      const hour12 = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
      return `${hour12}:${m} ${amPm}`;
    })
    .join(', ');
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingPrescription, setEditingPrescription] = useState<Prescription | null>(null);
  const [prescriptionToArchive, setPrescriptionToArchive] = useState<Prescription | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const { pets } = usePets();
  const { records: healthRecords } = useHealthRecords();

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<PrescriptionForm>({
    resolver: zodResolver(prescriptionSchema),
  });

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    fetch(`${API_URL}/api/prescriptions/`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        const hasPetNames = data.prescriptions?.length > 0 && data.prescriptions[0].pets?.name;
        setPrescriptions(data.prescriptions || []);
        if (!hasPetNames) {
          setTimeout(() => window.location.reload(), 100);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data: PrescriptionForm) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        pet_id: parseInt(data.pet_id),
        health_record_id: parseInt(data.health_record_id),
      };
      
      const url = editingPrescription ? `${API_URL}/api/prescriptions/?id=${editingPrescription.id}` : `${API_URL}/api/prescriptions/`;
      const method = editingPrescription ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      if (res.ok) {
        const result = await res.json();
        if (editingPrescription) {
          setPrescriptions(prescriptions.map(p => p.id === editingPrescription.id ? result.prescription : p));
          toast.success('Prescription updated');
        } else {
          setPrescriptions([result.prescription, ...prescriptions]);
          toast.success('Prescription added');
        }
        reset();
        setOpen(false);
        setEditingPrescription(null);
      }
    } catch (error) {
      console.error('Failed to save prescription:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (prescription: Prescription) => {
    setEditingPrescription(prescription);
    setValue('pet_id', prescription.pet_id.toString());
    setValue('health_record_id', prescription.health_record_id.toString());
    setValue('medication_name', prescription.medication_name);
    setValue('dosage', prescription.dosage || '');
    setValue('duration', prescription.duration || '');
    setValue('scheduled_start', prescription.scheduled_start || '');
    setValue('scheduled_end', prescription.scheduled_end || '');
    setValue('scheduled_times', prescription.scheduled_times || '');
    setValue('dosage_per_time', prescription.dosage_per_time || '');
    setOpen(true);
  };

  const handleArchive = async () => {
    if (!prescriptionToArchive) return;
    try {
      const res = await fetch(`${API_URL}/api/prescriptions/?id=${prescriptionToArchive.id}`, { method: 'PATCH', credentials: 'include', headers: {'Content-Type': 'application/json'}, body: JSON.stringify({is_active: false}) });
      if (!res.ok) throw new Error('Failed to archive');
      setPrescriptions(prescriptions.map(p => p.id === prescriptionToArchive.id ? { ...p, is_active: false } : p));
      setPrescriptionToArchive(null);
      toast.success('Prescription archived');
    } catch (error) {
      console.error('Failed to archive prescription:', error);
      toast.error('Failed to archive prescription');
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingPrescription(null);
    reset();
  };

  const columns = [
    {
      key: 'id' as const,
      label: 'ID',
    },
    {
      key: 'pets' as const,
      label: 'Pet',
      render: (_: any, item: Prescription) => {
          const pet = pets?.find((p: Pet) => p.id === item.pet_id);
          return pet?.name || `Pet #${item.pet_id}`;
        },
    },
    {
      key: 'medication_name' as const,
      label: 'Medication',
    },
    {
      key: 'dosage' as const,
      label: 'Dosage',
      render: (value: string) => value || '-',
    },
    {
      key: 'scheduled_times' as const,
      label: 'Schedule',
      render: (value: string | undefined, item: Prescription) => {
        if (!item.scheduled_start) return '-';
        const times = value ? formatTimeDisplay(value) : '';
        const start = item.scheduled_start ? new Date(item.scheduled_start).toLocaleDateString() : '';
        const end = item.scheduled_end ? new Date(item.scheduled_end).toLocaleDateString() : '';
        return (
          <div className="text-xs">
            <div>{start} – {end}</div>
            {times && <div className="text-muted-foreground">{times}</div>}
            {item.dosage_per_time && <div className="text-muted-foreground">{item.dosage_per_time}</div>}
          </div>
        );
      },
    },
    {
      key: 'created_at' as const,
      label: 'Date',
      render: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  const searchKeys = ['id', 'pet_id', 'medication_name', 'dosage', 'duration', 'pets.name', 'pets.species'];

  return (
    <Sidebar>
      <PageHeader 
        title="Prescriptions" 
        description="Manage pet prescriptions and medications"
        action={
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setEditingPrescription(null);
            reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Prescription
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPrescription ? 'Edit Prescription' : 'Add Prescription'}</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FieldGroup>
                <FieldLabel>Pet</FieldLabel>
                <select
                  {...register('pet_id')}
                  className={`w-full rounded-md border border-border bg-background px-3 py-2 text-sm ${
                    errors.pet_id ? 'border-destructive focus-visible:ring-destructive/20' : ''
                  }`}
                >
                  <option value="">Select a pet</option>
                  {pets.map((pet: Pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species})
                    </option>
                  ))}
                </select>
                {errors.pet_id && <p className="text-sm text-destructive">{errors.pet_id.message}</p>}
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>Health Record</FieldLabel>
                <select
                  {...register('health_record_id')}
                  className={`w-full rounded-md border border-border bg-background px-3 py-2 text-sm ${
                    errors.health_record_id ? 'border-destructive focus-visible:ring-destructive/20' : ''
                  }`}
                >
                  <option value="">Select a health record</option>
                  {healthRecords.map((record: HealthRecord) => (
                    <option key={record.id} value={record.id}>
                      Diagnosis: {record.diagnosis?.substring(0, 30) || 'N/A'}...
                    </option>
                  ))}
                </select>
                {errors.health_record_id && <p className="text-sm text-destructive">{errors.health_record_id.message}</p>}
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>Medication Name</FieldLabel>
                <Input 
                  {...register('medication_name')} 
                  placeholder="e.g., Amoxicillin"
                  aria-invalid={!!errors.medication_name}
                  className={errors.medication_name ? 'border-destructive focus-visible:ring-destructive/20' : 'border-border'}
                />
                {errors.medication_name && <p className="text-sm text-destructive">{errors.medication_name.message}</p>}
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>Dosage</FieldLabel>
                <Input {...register('dosage')} placeholder="e.g., 50mg twice daily" className="border-border" />
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>Duration</FieldLabel>
                <Input {...register('duration')} placeholder="e.g., 7 days" className="border-border" />
              </FieldGroup>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> Medication Schedule (optional)
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <FieldGroup>
                    <FieldLabel>Start Date</FieldLabel>
                    <Input {...register('scheduled_start')} type="date" className="border-border" />
                  </FieldGroup>
                  <FieldGroup>
                    <FieldLabel>End Date</FieldLabel>
                    <Input {...register('scheduled_end')} type="date" className="border-border" />
                  </FieldGroup>
                </div>
                <FieldGroup>
                  <FieldLabel>Times (comma-separated, 24h)</FieldLabel>
                  <Input {...register('scheduled_times')} placeholder="e.g., 06:00,18:00" className="border-border" />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>Dosage Per Time</FieldLabel>
                  <Input {...register('dosage_per_time')} placeholder="e.g., 1 tablet" className="border-border" />
                </FieldGroup>
              </div>

              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Saving...' : editingPrescription ? 'Update Prescription' : 'Add Prescription'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        }
      />

      {loading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      ) : prescriptions.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Pill className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">No prescriptions yet</p>
        </Card>
      ) : (
        <DataTable<Prescription>
          data={prescriptions}
          columns={columns}
          loading={loading}
          searchKeys={searchKeys}
          filters={[{ key: 'is_active', label: 'Status', options: [{value:'true',label:'Active'},{value:'false',label:'Inactive'}] }]}
          actions={(prescription) => (
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(prescription)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setPrescriptionToArchive(prescription)}>
                <Archive className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        />
      )}

      <ConfirmDialog
        open={!!prescriptionToArchive}
        title="Archive Prescription"
        description={`Archive this prescription for ${prescriptionToArchive?.pets?.name || ''}?`}
        actionLabel="Archive"
        onConfirm={handleArchive}
        onCancel={() => setPrescriptionToArchive(null)}
        isLoading={isArchiving}
      />
    </Sidebar>
  );
}
