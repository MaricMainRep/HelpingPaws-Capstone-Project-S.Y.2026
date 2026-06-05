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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useRooms, useCameras } from '@/hooks/useAPI';
import { toast } from '@/lib/toast';
import { Plus, Camera, Video, Pencil, Archive, RotateCcw } from 'lucide-react';
import type { Room } from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface Camera {
  id: number;
  room_id: number | null;
  stream_url: string;
  is_active: boolean;
}

export default function CamerasPage() {
  const { cameras, isLoading: camerasLoading, mutate: mutateCameras } = useCameras();
  const { rooms, isLoading: roomsLoading } = useRooms();
  const [open, setOpen] = useState(false);
  const [editingCamera, setEditingCamera] = useState<Camera | null>(null);
  const [cameraToArchive, setCameraToArchive] = useState<Camera | null>(null);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const { register, handleSubmit, reset, setValue, watch } = useForm();
  const selectedRoom = watch('room_id');

  const onSubmit = async (data: any) => {
    try {
      const url = editingCamera ? `${API_URL}/api/cameras/?id=${editingCamera.id}` : `${API_URL}/api/cameras/`;
      const method = editingCamera ? 'PUT' : 'POST';
      const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
      
      const payload = editingCamera 
        ? { id: editingCamera.id, room_id: data.room_id ? parseInt(data.room_id) : null, stream_url: data.stream_url || null, is_active: data.is_active ?? editingCamera.is_active }
        : { room_id: data.room_id ? parseInt(data.room_id) : null, stream_url: data.stream_url || null, is_active: true };
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      const result = await res.json();
      
      if (res.ok) {
        mutateCameras();
        reset();
        setOpen(false);
        setEditingCamera(null);
        toast.success(editingCamera ? 'Camera updated' : 'Camera added');
      } else {
        toast.error(result.error || 'Failed to save camera');
      }
    } catch (error) {
      console.error('Failed to save camera:', error);
      toast.error('Failed to save camera');
    }
  };

  const handleEdit = (camera: Camera) => {
    setEditingCamera(camera);
    reset({
      room_id: camera.room_id,
      stream_url: camera.stream_url || '',
    });
    setOpen(true);
  };

  const handleArchive = async () => {
    if (!cameraToArchive) return;
    setIsArchiving(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    try {
      const res = await fetch(`${API_URL}/api/cameras/?id=${cameraToArchive.id}`, { 
        method: 'PATCH',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({is_active: false}),
      });
      if (res.ok) {
        mutateCameras();
        setCameraToArchive(null);
        toast.success('Camera archived');
      }
    } catch (error) {
      console.error('Failed to archive camera:', error);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleRestore = async (camera: Camera) => {
    setIsRestoring(true);
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    try {
      const res = await fetch(`${API_URL}/api/cameras/?id=${camera.id}`, { 
        method: 'PATCH',
        headers: { ...(token ? { 'Authorization': `Bearer ${token}` } : {}), 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({is_active: true}),
      });
      if (res.ok) {
        mutateCameras();
        toast.success('Camera restored');
      }
    } catch (error) {
      console.error('Failed to restore camera:', error);
    } finally {
      setIsRestoring(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCamera(null);
    reset();
  };

  const getRoomName = (roomId: number | null) => {
    if (!roomId) return 'No room assigned';
    const room = rooms.find((r: Room) => r.id === roomId);
    return room?.name || 'Unassigned';
  };

  return (
    <Sidebar>
      <PageHeader 
        title="Camera Management" 
        description="Manage live monitoring cameras"
        action={
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setEditingCamera(null);
              reset();
            }
          }}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 mr-2" />Add Camera</Button>
            </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingCamera ? 'Edit Camera' : 'Add Camera'}</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <FieldGroup>
                <FieldLabel>Room</FieldLabel>
                <Select
                  value={selectedRoom?.toString() || (editingCamera?.room_id?.toString() || 'unassigned')}
                  onValueChange={(value) => {
                    setValue('room_id', value === 'unassigned' ? null : parseInt(value));
                  }}
                >
                  <SelectTrigger className="border-border">
                    <SelectValue placeholder="Select a room" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="unassigned">No room assigned</SelectItem>
                    {rooms.map((room: Room) => (
                      <SelectItem key={room.id} value={room.id.toString()}>
                        {room.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </FieldGroup>
              <FieldGroup>
                <FieldLabel>Stream Name / RTSP URL</FieldLabel>
                <Input {...register('stream_url')} placeholder="camera1 (for mediamtx) or rtsp://..." className="border-border" />
                <p className="text-xs text-muted-foreground mt-1">
                  For mediamtx: use a name (e.g., "room1cam1"). For RTSP: use full rtsp:// URL
                </p>
              </FieldGroup>
              {editingCamera && (
                <FieldGroup>
                  <FieldLabel>Status</FieldLabel>
                  <Select
                    value={editingCamera.is_active ? 'true' : 'false'}
                    onValueChange={(value) => setValue('is_active', value === 'true')}
                  >
                    <SelectTrigger className="borderBorder">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">Active</SelectItem>
                      <SelectItem value="false">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldGroup>
              )}
              <Button type="submit" className="w-full">{editingCamera ? 'Update Camera' : 'Add Camera'}</Button>
            </form>
          </DialogContent>
        </Dialog>
        }
      />

      {camerasLoading || roomsLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : cameras.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <Camera className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">No cameras registered</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cameras.map((cam: Camera) => (
            <Card key={cam.id} className="p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Video className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">{getRoomName(cam.room_id)}</h3>
                    <p className="text-sm text-muted-foreground">
                      {cam.stream_url ? `Stream: ${cam.stream_url}` : 'No stream configured'}
                    </p>
                    <Badge variant={cam.is_active ? 'default' : 'secondary'} className="mt-2">
                      {cam.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                </div>
<div className="flex gap-1">
                   <Button variant="ghost" size="icon" onClick={() => handleEdit(cam)}>
                     <Pencil className="h-4 w-4" />
                   </Button>
                   {cam.is_active ? (
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => setCameraToArchive(cam)}
                       className="text-destructive"
                     >
                       <Archive className="h-4 w-4" />
                     </Button>
                   ) : (
                     <Button
                       variant="ghost"
                       size="icon"
                       onClick={() => handleRestore(cam)}
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
        open={!!cameraToArchive}
        title="Archive Camera"
        description={`Archive the camera for ${cameraToArchive ? getRoomName(cameraToArchive.room_id) : ''}?`}
        actionLabel="Archive"
        onConfirm={handleArchive}
        onCancel={() => setCameraToArchive(null)}
        isLoading={isArchiving}
      />
    </Sidebar>
  );
}
