'use client';

import { useState } from 'react';
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
import { useRooms } from '@/hooks/useAPI';
import { toast } from '@/lib/toast';
import { Plus, DoorOpen, Pencil, Archive, RotateCcw } from 'lucide-react';
import type { Room } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function RoomsPage() {
  const { rooms, isLoading, mutate } = useRooms();
  const [open, setOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [roomToArchive, setRoomToArchive] = useState<Room | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const { register, handleSubmit, reset, setValue } = useForm();

  const onSubmit = async (data: any) => {
    try {
      const url = editingRoom ? `${API_URL}/api/rooms/?id=${editingRoom.id}` : `${API_URL}/api/rooms/`;
      const method = editingRoom ? 'PUT' : 'POST';
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(data),
        credentials: 'include',
      });
      
      if (res.ok) {
        mutate();
        reset();
        setOpen(false);
        setEditingRoom(null);
        toast.success(editingRoom ? 'Room updated' : 'Room added');
      }
    } catch (error) {
      console.error('Failed to save room:', error);
      toast.error('Failed to save room');
    }
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setValue('name', room.name);
    setValue('description', room.description || '');
    setOpen(true);
  };

  const handleArchive = async () => {
    if (!roomToArchive) return;
    setIsArchiving(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    try {
      const res = await fetch(`${API_URL}/api/rooms/?id=${roomToArchive.id}`, { 
        method: 'PATCH',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({is_active: false}),
      });
      if (res.ok) {
        mutate();
        setRoomToArchive(null);
        toast.success('Room archived');
      }
    } catch (error) {
      console.error('Failed to archive room:', error);
      toast.error('Failed to archive room');
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestore = async (room: Room) => {
    setIsRestoring(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    try {
      const res = await fetch(`${API_URL}/api/rooms/?id=${room.id}`, { 
        method: 'PATCH',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({is_active: true}),
      });
      if (res.ok) {
        mutate();
        toast.success('Room restored');
      }
    } catch (error) {
      console.error('Failed to restore room:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <Sidebar>
      <PageHeader 
        title="Room Management" 
        description="Manage clinic rooms"
        action={
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setEditingRoom(null);
              reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Room</Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingRoom ? 'Edit Room' : 'Add Room'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 sm:space-y-4">
                <FieldGroup>
                  <FieldLabel>Room Name</FieldLabel>
                  <Input {...register('name')} placeholder="e.g., Room 101" required className="border-border" />
                </FieldGroup>
                <FieldGroup>
                  <FieldLabel>Description</FieldLabel>
                  <Input {...register('description')} placeholder="e.g., Emergency room" className="border-border" />
                </FieldGroup>
                <Button type="submit" className="w-full">
                  {editingRoom ? 'Update Room' : 'Add Room'}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        }
      />

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : rooms.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <DoorOpen className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">No rooms registered</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {rooms.map((room: Room) => (
            <Card key={room.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <DoorOpen className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{room.name}</h3>
                    <p className="text-sm text-muted-foreground">{room.description || 'No description'}</p>
                    <Badge variant={room.is_active ? 'default' : 'secondary'} className="mt-2">
                      {room.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
<div className="flex gap-1">
                   <Button variant="ghost" size="icon" onClick={() => handleEdit(room)}>
                     <Pencil className="h-4 w-4" />
                   </Button>
                   {room.is_active ? (
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => setRoomToArchive(room)}
                       className="text-destructive"
                     >
                       <Archive className="h-4 w-4" />
                     </Button>
                   ) : (
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => handleRestore(room)}
                     >
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
        open={!!roomToArchive}
        title="Archive Room"
        description={`Archive ${roomToArchive?.name}?`}
        actionLabel="Archive"
        onConfirm={handleArchive}
        onCancel={() => setRoomToArchive(null)}
        isLoading={isArchiving}
      />
    </Sidebar>
  );
}