'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Sidebar } from '@/components/dashboard/Sidebar';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { Plus, MapPin, Home, PawPrint, Pencil, Archive, RotateCcw } from 'lucide-react';
import { usePets, useRooms } from '@/hooks/useAPI';
import { toast } from '@/lib/toast';
import type { Pet, Room } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface PetLocation {
  id: number;
  pet_id: number;
  room_id?: number;
  status: string;
  notes?: string;
  is_active?: boolean;
  updated_at: string;
  pets?: { name: string; species: string };
  rooms?: { name: string };
}

const STATUS_COLORS: Record<string, string> = {
  CHECKED_IN: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UNDER_OBSERVATION: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  READY_FOR_PICKUP: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  DISCHARGED: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

const STATUS_LABELS: Record<string, string> = {
  CHECKED_IN: 'Checked In',
  UNDER_OBSERVATION: 'Under Observation',
  READY_FOR_PICKUP: 'Ready for Pickup',
  DISCHARGED: 'Discharged',
};

export default function PetMonitoringPage() {
  const [locations, setLocations] = useState<PetLocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<PetLocation | null>(null);
  const [locationToArchive, setLocationToArchive] = useState<PetLocation | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('active');
  const { pets } = usePets();
  const { rooms } = useRooms();
  const { register, handleSubmit, reset, setValue } = useForm();

  const filteredLocations = locations.filter((loc) => {
    if (statusFilter === 'active') return loc.is_active !== false;
    if (statusFilter === 'inactive') return loc.is_active === false;
    return true;
  });

  useEffect(() => {
    fetch(`${API_URL}/api/pet-locations/`)
      .then((res) => res.json())
      .then((data) => {
        const locs = data.locations || [];
        const latestByPet = locs.reduce((acc: Record<number, PetLocation>, loc: PetLocation) => {
          if (!acc[loc.pet_id] || new Date(loc.updated_at) > new Date(acc[loc.pet_id].updated_at)) {
            acc[loc.pet_id] = {...loc, is_active: true};
          }
          return acc;
        }, {});
        setLocations(Object.values(latestByPet));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const onSubmit = async (data: any) => {
    setSubmitting(true);
    try {
      const payload = {
        pet_id: parseInt(data.pet_id),
        room_id: parseInt(data.room_id),
        status: data.status,
        notes: data.notes,
      };
      
      const url = editingLocation ? `${API_URL}/api/pet-locations/?id=${editingLocation.id}` : `${API_URL}/api/pet-locations/`;
      const method = editingLocation ? 'PUT' : 'POST';
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      if (res.ok) {
        const result = await res.json();
        const existingLoc = editingLocation 
          ? locations.find(l => l.id === editingLocation.id) 
          : null;
        const updatedLoc = existingLoc 
          ? { ...result.location, pets: existingLoc.pets, rooms: existingLoc.rooms }
          : result.location;
        if (editingLocation) {
          setLocations(locations.map(l => l.id === editingLocation.id ? updatedLoc : l));
          toast.success('Location updated');
        } else {
          setLocations([updatedLoc, ...locations]);
          toast.success('Location added');
        }
        reset();
        setOpen(false);
        setEditingLocation(null);
      }
    } catch (error) {
      console.error('Failed to save location:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (location: PetLocation) => {
    setEditingLocation(location);
    setValue('pet_id', location.pet_id);
    setValue('room_id', location.room_id || '');
    setValue('status', location.status);
    setValue('notes', location.notes || '');
    setOpen(true);
  };

  const handleArchive = async () => {
    if (!locationToArchive) return;
    try {
      const res = await fetch(`${API_URL}/api/pet-locations/?id=${locationToArchive.id}`, { method: 'PATCH', credentials: 'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({is_active:false}) });
      if (res.ok) {
        setLocations(locations.map(l => l.id === locationToArchive.id ? { ...l, is_active: false } : l));
        setLocationToArchive(null);
        toast.success('Location archived');
      }
    } catch (error) {
      console.error('Failed to archive location:', error);
    }
  };

  const handleRestore = async (location: PetLocation) => {
    try {
      const res = await fetch(`${API_URL}/api/pet-locations/?id=${location.id}`, { method: 'PATCH', credentials: 'include', headers:{'Content-Type':'application/json'}, body: JSON.stringify({is_active:true}) });
      if (res.ok) {
        setLocations(locations.map(l => l.id === location.id ? { ...l, is_active: true } : l));
        toast.success('Location restored');
      }
    } catch (error) {
      console.error('Failed to restore location:', error);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingLocation(null);
    reset();
  };

  return (
    <Sidebar>
      <PageHeader 
        title="Pet Monitoring" 
        description="Track pets currently in the clinic"
        action={
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setEditingLocation(null);
              reset();
            }
          }}>
          <DialogTrigger asChild>
            <Button><Plus className="h-4 w-4 mr-2" />Add Pet Location</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingLocation ? 'Edit Pet Location' : 'Assign Pet Location'}</DialogTitle></DialogHeader>
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
                <FieldLabel>Room</FieldLabel>
                <select {...register('room_id')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="">Select room</option>
                  {rooms.map((room: Room) => (
                    <option key={room.id} value={room.id}>
                      {room.name}
                    </option>
                  ))}
                </select>
              </FieldGroup>
              <FieldGroup>
                <FieldLabel>Status</FieldLabel>
                <select {...register('status')} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm">
                  <option value="CHECKED_IN">Checked In</option>
                  <option value="UNDER_OBSERVATION">Under Observation</option>
                  <option value="READY_FOR_PICKUP">Ready for Pickup</option>
                  <option value="DISCHARGED">Discharged</option>
                </select>
              </FieldGroup>
              <FieldGroup>
                <FieldLabel>Notes</FieldLabel>
                <Input {...register('notes')} placeholder="Any notes" className="border-border" />
              </FieldGroup>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? 'Saving...' : editingLocation ? 'Update Location' : 'Save Location'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        }
      />

      <div className="mb-4 flex gap-2">
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} className="border rounded px-3 py-1 text-sm">
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="all">All</option>
        </select>
      </div>

      {loading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : locations.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <PawPrint className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">No pets currently in clinic</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredLocations.map((loc) => (
            <Card key={loc.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <PawPrint className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground">{loc.pets?.name || `Pet #${loc.pet_id}`}</h3>
                    <p className="text-sm text-muted-foreground">{loc.pets?.species}</p>
                  </div>
                </div>
                <Badge className={STATUS_COLORS[loc.status]}>{STATUS_LABELS[loc.status] || loc.status}</Badge>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Home className="h-4 w-4" />
                  <span>{loc.rooms?.name || 'No room assigned'}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span>Updated: {new Date(loc.updated_at).toLocaleString()}</span>
                </div>
                {loc.notes && <p className="text-muted-foreground mt-2 pt-2 border-t border-border">{loc.notes}</p>}
              </div>
<div className="flex gap-1 mt-3 pt-3 border-t border-border">
                 <Button variant="ghost" size="sm" onClick={() => handleEdit(loc)} className="flex-1">
                   <Pencil className="h-4 w-4 mr-1" /> Edit
                 </Button>
                 {loc.is_active !== false ? (
                   <Button variant="ghost" size="sm" onClick={() => setLocationToArchive(loc)} className="flex-1 text-destructive">
                     <Archive className="h-4 w-4 mr-1" /> Archive
                   </Button>
                 ) : (
                   <Button variant="ghost" size="sm" onClick={() => handleRestore(loc)} className="flex-1">
                     <RotateCcw className="h-4 w-4 mr-1" /> Restore
                   </Button>
                 )}
               </div>
            </Card>
          ))}
        </div>
      )}

        <ConfirmDialog
          open={!!locationToArchive}
          title="Archive Location"
          description={`Archive location for ${locationToArchive?.pets?.name || 'this pet'}?`}
          actionLabel="Archive"
          onConfirm={handleArchive}
          onCancel={() => setLocationToArchive(null)}
        />
    </Sidebar>
  );
}
