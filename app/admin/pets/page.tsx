'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { DataTable } from '@/components/admin/DataTable';
import { PageHeader } from '@/components/admin/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FieldGroup, FieldLabel } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { usePets, updatePet, archivePet, restorePet } from '@/hooks/useAPI';
import { toast } from '@/lib/toast';
import { Pencil, Archive, RotateCcw, PawPrint } from 'lucide-react';
import type { Pet } from '@/lib/supabase';

const petSchema = z.object({
  name: z.string().min(1, 'Pet name is required'),
  species: z.string().min(1, 'Species is required'),
  breed: z.string().optional(),
  age: z.number().optional(),
  weight: z.number().optional(),
  medical_history_notes: z.string().optional(),
});

type PetForm = z.infer<typeof petSchema>;

export default function PetsPage() {
  const { pets, isLoading, mutate } = usePets();
  const [open, setOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [petToArchive, setPetToArchive] = useState<Pet | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<PetForm>({
    resolver: zodResolver(petSchema),
  });

  const onSubmit = async (data: PetForm) => {
    setSubmitting(true);
    try {
      await updatePet(editingPet!.id, data);
      mutate();
      reset();
      setOpen(false);
      setEditingPet(null);
      toast.success('Pet updated', {
        description: 'Pet information has been updated successfully.',
      });
    } catch (error) {
      toast.error('Failed to update pet', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (pet: Pet) => {
    setEditingPet(pet);
    setValue('name', pet.name);
    setValue('species', pet.species);
    setValue('breed', pet.breed || '');
    setValue('age', pet.age);
    setValue('weight', pet.weight);
    setValue('medical_history_notes', pet.medical_history_notes || '');
    setOpen(true);
  };

  const handleArchive = async () => {
    if (!petToArchive) return;
    setIsArchiving(true);
    try {
      await archivePet(petToArchive.id);
      mutate();
      setPetToArchive(null);
      toast.success('Pet archived');
    } catch (error) {
      toast.error('Failed to archive pet');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestore = async (pet: Pet) => {
    try {
      await restorePet(pet.id);
      mutate();
      toast.success('Pet restored');
    } catch (error) {
      toast.error('Failed to restore pet');
    }
  };

  const columns = [
    {
      key: 'name' as const,
      label: 'Name',
    },
    {
      key: 'species' as const,
      label: 'Species',
    },
    {
      key: 'breed' as const,
      label: 'Breed',
      render: (value: string | null) => value || '-',
    },
    {
      key: 'age' as const,
      label: 'Age',
      render: (value: number | null) => (value ? `${value} years` : '-'),
    },
    {
      key: 'weight' as const,
      label: 'Weight',
      render: (value: number | null) => (value ? `${value} kg` : '-'),
    },
    {
      key: 'is_active' as const,
      label: 'Status',
      render: (value: boolean) => (
        <Badge variant={value ? 'default' : 'secondary'}>
          {value ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
  ];

  return (
    <Sidebar>
      <PageHeader
        title="Pet Registry"
        description="View all pets in the system"
      />

      <Dialog open={open} onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) {
          setEditingPet(null);
          reset();
        }
      }}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Pet</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
            <FieldGroup>
              <FieldLabel>Pet Name</FieldLabel>
              <Input
                {...register('name')}
                placeholder="e.g., Max"
                aria-invalid={!!errors.name}
                className={errors.name ? 'border-destructive focus-visible:ring-destructive/20' : 'border-border'}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name.message}</p>
              )}
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Species</FieldLabel>
              <select
                {...register('species')}
                className={`w-full rounded-md border border-border bg-background px-3 py-2 text-sm ${
                  errors.species ? 'border-destructive focus-visible:ring-destructive/20' : ''
                }`}
              >
                <option value="">Select species</option>
                <option value="Dog">Dog</option>
                <option value="Cat">Cat</option>
                <option value="Bird">Bird</option>
                <option value="Rabbit">Rabbit</option>
                <option value="Hamster">Hamster</option>
                <option value="Other">Other</option>
              </select>
              {errors.species && (
                <p className="text-sm text-destructive">{errors.species.message}</p>
              )}
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Breed</FieldLabel>
              <Input
                {...register('breed')}
                placeholder="e.g., Golden Retriever"
                className="border-border"
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Age (years)</FieldLabel>
              <Input
                {...register('age', { valueAsNumber: true })}
                type="number"
                step="0.1"
                placeholder="e.g., 3"
                className="border-border"
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Weight (kg)</FieldLabel>
              <Input
                {...register('weight', { valueAsNumber: true })}
                type="number"
                step="0.1"
                placeholder="e.g., 25"
                className="border-border"
              />
            </FieldGroup>

            <FieldGroup>
              <FieldLabel>Medical History Notes</FieldLabel>
              <Input
                {...register('medical_history_notes')}
                placeholder="Any important medical information"
                className="border-border"
              />
            </FieldGroup>

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? 'Updating...' : 'Update Pet'}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : pets.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <PawPrint className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">No pets registered</p>
        </Card>
      ) : (
<DataTable<Pet>
           data={pets}
           columns={columns}
           filters={[{
             key: 'is_active',
             label: 'Status',
             options: [{value: 'true', label: 'Active'}, {value: 'false', label: 'Inactive'}]
           }]}
           loading={isLoading}
actions={(pet) => (
             <div className="flex gap-2">
               <Button variant="ghost" size="icon" onClick={() => handleEdit(pet)}>
                 <Pencil className="h-4 w-4" />
               </Button>
               {pet.is_active !== false ? (
                 <Button
                   variant="ghost"
                   size="icon"
                   onClick={() => setPetToArchive(pet)}
                   className="text-destructive"
                 >
                   <Archive className="h-4 w-4" />
                 </Button>
               ) : (
                 <Button
                   variant="ghost"
                   size="icon"
                   onClick={() => handleRestore(pet)}
                 >
                   <RotateCcw className="h-4 w-4" />
                 </Button>
               )}
             </div>
           )}
        />
      )}

      <ConfirmDialog
        open={!!petToArchive}
        title="Archive Pet"
        description={`Archive ${petToArchive?.name}?`}
        actionLabel="Archive"
        onConfirm={handleArchive}
        onCancel={() => setPetToArchive(null)}
        isLoading={isArchiving}
      />
    </Sidebar>
  );
}