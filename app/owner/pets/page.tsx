'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { PageHeader } from '@/components/admin/PageHeader';
import { Card } from '@/components/ui/card';
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
import { usePets, createPet, updatePet, archivePet, restorePet } from '@/hooks/useAPI';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { toast } from '@/lib/toast';
import type { Pet } from '@/lib/supabase';
import { Plus, PawPrint, Pencil, Archive, RotateCcw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const petSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  species: z.string().min(1, 'Species is required'),
  breed: z.string().optional(),
  age: z.number().optional(),
  weight: z.number().optional(),
  medical_history_notes: z.string().optional(),
});

type PetForm = z.infer<typeof petSchema>;

export default function MyPetsPage() {
  const { pets, isLoading, mutate } = usePets();
  const [open, setOpen] = useState(false);
  const [editingPet, setEditingPet] = useState<Pet | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [petToDelete, setPetToDelete] = useState<Pet | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'active' | 'inactive' | 'all'>('active');

  const filteredPets = pets.filter((pet: Pet) => {
    if (statusFilter === 'active') return pet.is_active !== false;
    if (statusFilter === 'inactive') return pet.is_active === false;
    return true;
  });

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<PetForm>({
    resolver: zodResolver(petSchema),
  });

  const onSubmit = async (data: PetForm) => {
    setSubmitting(true);
    try {
      if (editingPet) {
        await updatePet(editingPet.id, data);
        toast.success('Pet updated', {
          description: 'Pet information has been updated successfully.',
        });
      } else {
        await createPet(data);
        toast.success('Pet added', {
          description: 'New pet has been added successfully.',
        });
      }
      mutate();
      reset();
      setOpen(false);
      setEditingPet(null);
    } catch (error) {
      toast.error('Failed', {
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
    if (!petToDelete) return;
    setIsDeleting(true);
    
    try {
      await archivePet(petToDelete.id);
      mutate();
      setPetToDelete(null);
      toast.success('Pet archived', {
        description: 'Pet has been archived successfully.',
      });
    } catch (error) {
      toast.error('Failed to archive', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRestore = async (pet: Pet) => {
    try {
      await restorePet(pet.id);
      mutate();
      toast.success('Pet restored', {
        description: 'Pet has been restored successfully.',
      });
    } catch (error) {
      toast.error('Failed to restore', {
        description: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingPet(null);
    reset();
  };

  const DialogForm = () => (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) {
        setEditingPet(null);
        reset();
      }
    }}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Add Pet
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingPet ? 'Edit Pet' : 'Add New Pet'}</DialogTitle>
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
              {...register('age')}
              type="number"
              step="0.1"
              placeholder="e.g., 3"
              className="border-border"
            />
          </FieldGroup>

          <FieldGroup>
            <FieldLabel>Weight (kg)</FieldLabel>
            <Input
              {...register('weight')}
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

          <Button
            type="submit"
            disabled={submitting}
            className="w-full"
          >
            {submitting ? (editingPet ? 'Updating...' : 'Adding...') : (editingPet ? 'Update Pet' : 'Add Pet')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );

  return (
    <Sidebar>
      <PageHeader 
        title="My Pets" 
        description="Manage your pets and their information"
        action={<DialogForm />}
      />

      <div className="mb-4 flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="border rounded px-3 py-1 text-sm"
        >
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All</option>
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading pets...</p>
        </div>
      ) : filteredPets.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <PawPrint className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground mb-4">No pets added yet</p>
          <DialogForm />
        </Card>
      ) : (
        <div className="grid grid-cols-1 xs:grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filteredPets.map((pet: Pet) => (
            <Card key={pet.id} className="p-4 sm:p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg sm:rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <PawPrint className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-base sm:text-lg font-semibold text-foreground">
                      {pet.name}
                    </h3>
<p className="text-sm text-muted-foreground">
                       {pet.species}
                       {pet.breed && ` - ${pet.breed}`}
                     </p>
                     <Badge variant={pet.is_active !== false ? 'default' : 'secondary'} className="mt-1">
                       {pet.is_active !== false ? 'Active' : 'Inactive'}
                     </Badge>
                    <dl className="mt-2 sm:mt-3 space-y-1 text-sm">
                      {pet.age && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Age:</dt>
                          <dd className="text-foreground">{pet.age} years</dd>
                        </div>
                      )}
                      {pet.weight && (
                        <div className="flex justify-between">
                          <dt className="text-muted-foreground">Weight:</dt>
                          <dd className="text-foreground">{pet.weight} kg</dd>
                        </div>
                      )}
                    </dl>
                    {pet.medical_history_notes && (
                      <div className="mt-2 sm:mt-3 pt-2 sm:pt-3 border-t border-border">
                        <p className="text-xs text-muted-foreground">Medical Notes:</p>
                        <p className="text-sm text-foreground mt-1 line-clamp-2">
                          {pet.medical_history_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex gap-1">
<Button variant="ghost" size="icon" onClick={() => handleEdit(pet)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  {pet.is_active !== false ? (
                    <Button variant="ghost" size="icon" onClick={() => setPetToDelete(pet)}>
                      <Archive className="h-4 w-4 text-muted-foreground" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={() => handleRestore(pet)}>
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ConfirmDialog
        open={!!petToDelete}
        title="Archive Pet"
        description={`Are you sure you want to archive ${petToDelete?.name}? This action can be undone later.`}
        actionLabel="Archive"
        onConfirm={handleArchive}
        onCancel={() => setPetToDelete(null)}
        isLoading={isDeleting}
        variant="destructive"
      />
    </Sidebar>
  );
}
