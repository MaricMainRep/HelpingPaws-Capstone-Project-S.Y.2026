'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
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
import { Plus, Syringe, Pencil, Archive } from 'lucide-react';
import { usePets } from '@/hooks/useAPI';
import { toast } from '@/lib/toast';
import type { Pet } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface Vaccination {
  id: number;
  pet_id: number;
  vaccine_name: string;
  administered_date: string;
  next_due_date?: string;
  notes?: string;
  pets?: { name: string; species: string };
}

export default function VaccinationsPage() {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingVax, setEditingVax] = useState<Vaccination | null>(null);
  const [vaxToArchive, setVaxToArchive] = useState<Vaccination | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const { pets } = usePets();
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    fetch(`${API_URL}/api/vaccinations/`, {
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      credentials: 'include',
    })
      .then((res) => res.json())
      .then((data) => {
        const hasPetNames = data.vaccinations?.length > 0 && data.vaccinations[0].pets?.name;
        setVaccinations(data.vaccinations || []);
        if (!hasPetNames) {
          setTimeout(() => window.location.reload(), 100);
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        pet_id: parseInt(data.pet_id),
      };
      
      const url = editingVax ? `${API_URL}/api/vaccinations/?id=${editingVax.id}` : `${API_URL}/api/vaccinations/`;
      const method = editingVax ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      if (res.ok) {
        const result = await res.json();
        if (editingVax) {
          setVaccinations(vaccinations.map(v => v.id === editingVax.id ? result.vaccination : v));
          toast.success('Vaccination updated');
        } else {
          setVaccinations([result.vaccination, ...vaccinations]);
          toast.success('Vaccination added');
        }
        reset();
        setOpen(false);
        setEditingVax(null);
      }
    } catch (error) {
      console.error('Failed to save vaccination:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (vax: Vaccination) => {
    setEditingVax(vax);
    setValue('pet_id', vax.pet_id);
    setValue('vaccine_name', vax.vaccine_name);
    setValue('administered_date', vax.administered_date);
    setValue('next_due_date', vax.next_due_date || '');
    setValue('notes', vax.notes || '');
    setOpen(true);
  };

  const handleArchive = async () => {
    if (!vaxToArchive) return;
    try {
      const res = await fetch(`${API_URL}/api/vaccinations/?id=${vaxToArchive.id}`, { method: 'PATCH', credentials: 'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({is_active:false}) });
      if (res.ok) {
        setVaccinations(vaccinations.map(v => v.id === vaxToArchive.id ? { ...v, is_active: false } : v));
        setVaxToArchive(null);
        toast.success('Vaccination archived');
      }
    } catch (error) {
      console.error('Failed to archive vaccination:', error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingVax(null);
    reset();
  };

  const columns = [
    { key: 'id' as const, label: 'ID' },
    { key: 'pets' as const, label: 'Pet', render: (_: any, item: Vaccination) => {
      const pet = pets?.find((p: Pet) => p.id === item.pet_id);
      return pet?.name || `Pet #${item.pet_id}`;
    } },
    { key: 'vaccine_name' as const, label: 'Vaccine' },
    { key: 'administered_date' as const, label: 'Date Given', render: (v: string) => new Date(v).toLocaleDateString() },
    { key: 'next_due_date' as const, label: 'Next Due', render: (v?: string) => v ? new Date(v).toLocaleDateString() : '-' },
  ];

  return (
    <Sidebar>
      <PageHeader 
        title="Vaccinations" 
        description="Track pet vaccinations and immunization records"
        action={
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setEditingVax(null);
              reset();
            }
        }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Vaccination</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingVax ? 'Edit Vaccination' : 'Add Vaccination Record'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FieldGroup>
                <FieldLabel>Pet</FieldLabel>
                <select {...register('pet_id')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="">Select pet</option>
                  {pets.map((pet: Pet) => (
                    <option key={pet.id} value={pet.id}>
                      {pet.name} ({pet.species})
                    </option>
                  ))}
                </select>
              </FieldGroup>
              <FieldGroup>
                <FieldLabel>Vaccine Name</FieldLabel>
                <Input {...register('vaccine_name')} placeholder="e.g., Rabies" className="border-border" />
              </FieldGroup>
              <FieldGroup>
                <FieldLabel>Date Given</FieldLabel>
                <Input {...register('administered_date')} type="date" className="border-border" />
              </FieldGroup>
              <FieldGroup>
                <FieldLabel>Next Due Date</FieldLabel>
                <Input {...register('next_due_date')} type="date" className="border-border" />
              </FieldGroup>
              <FieldGroup>
                <FieldLabel>Notes</FieldLabel>
                <Input {...register('notes')} placeholder="Any notes" className="border-border" />
              </FieldGroup>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Saving...' : editingVax ? 'Update Vaccination' : 'Add Vaccination'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        }
      />
      
      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : vaccinations.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Syringe className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">No vaccinations recorded</p>
        </Card>
      ) : (
        <DataTable<Vaccination>
          data={vaccinations}
          columns={columns}
          loading={loading}
          filters={[{ key: 'is_active', label: 'Status', options: [{value:'true',label:'Active'},{value:'false',label:'Inactive'}] }]}
          actions={(vax) => (
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={() => handleEdit(vax)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setVaxToArchive(vax)}>
                <Archive className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        />
      )}

      <ConfirmDialog
        open={!!vaxToArchive}
        title="Archive Vaccination"
        description={`Archive this vaccination record for ${vaxToArchive?.pets?.name || ''}?`}
        actionLabel="Archive"
        onConfirm={handleArchive}
        onCancel={() => setVaxToArchive(null)}
      />
    </Sidebar>
  );
}
