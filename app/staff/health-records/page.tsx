'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { PageHeader } from '@/components/admin/PageHeader';
import { DataTable } from '@/components/admin/DataTable';

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
import { ConfirmDialog } from '@/components/common/ConfirmDialog';
import { useHealthRecords, usePets } from '@/hooks/useAPI';
import { toast } from '@/lib/toast';
import type { HealthRecord, Pet } from '@/lib/supabase';
import { Plus, FileText, Pencil, Archive, Eye } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const healthRecordSchema = z.object({
  pet_id: z.string().min(1, 'Please select a pet'),
  diagnosis: z.string().optional(),
  treatment: z.string().optional(),
});

type HealthRecordForm = z.infer<typeof healthRecordSchema>;

function formatNotes(text: string | null | undefined): string {
  if (!text) return '-';
  return text;
}

function NotesPreview({ text, maxLines = 2 }: { text: string | null | undefined; maxLines?: number }) {
  const content = text || '-';
  if (!text) return <span className="text-muted-foreground">-</span>;
  const lines = content.split('\n');
  const isTruncated = lines.length > maxLines;
  const preview = isTruncated ? lines.slice(0, maxLines).join('\n') + '...' : content;

  return (
    <div className="text-left max-w-xs whitespace-pre-wrap leading-relaxed line-clamp-2">
      {preview}
    </div>
  );
}

export default function HealthRecordsPage() {
  const { records, isLoading, mutate } = useHealthRecords();
  const { pets } = usePets();
  const [open, setOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);
  const [viewingRecord, setViewingRecord] = useState<HealthRecord | null>(null);
  const [recordToArchive, setRecordToArchive] = useState<HealthRecord | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset, setValue } = useForm<HealthRecordForm>({
    resolver: zodResolver(healthRecordSchema),
  });

  const onSubmit = async (data: HealthRecordForm) => {
    setSubmitting(true);
    try {
      const payload = {
        ...data,
        pet_id: parseInt(data.pet_id),
      };
      
      const url = editingRecord ? `${API_URL}/api/health-records/?id=${editingRecord.id}` : `${API_URL}/api/health-records/`;
      const method = editingRecord ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include',
      });
      
      if (res.ok) {
        mutate();
        toast.success(editingRecord ? 'Health record updated' : 'Health record created');
        reset();
        setOpen(false);
        setEditingRecord(null);
      }
    } catch (error) {
      console.error('Failed to save health record:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (record: HealthRecord) => {
    setEditingRecord(record);
    setValue('pet_id', record.pet_id.toString());
    setValue('diagnosis', record.diagnosis || '');
    setValue('treatment', record.treatment || '');
    setOpen(true);
  };

  const handleArchive = async () => {
    if (!recordToArchive) return;
    setIsArchiving(true);
    try {
      const res = await fetch(`${API_URL}/api/health-records/?id=${recordToArchive.id}`, { method: 'PATCH', credentials: 'include', headers: {'Content-Type':'application/json'}, body: JSON.stringify({is_active:false}) });
      if (res.ok) {
        mutate();
        setRecordToArchive(null);
        toast.success('Health record archived');
      }
    } catch (error) {
      console.error('Failed to archive health record:', error);
    } finally {
      setIsArchiving(false);
    }
  };

  const handleClose = () => {
    setOpen(false);
    setEditingRecord(null);
    reset();
  };

  const columns = [
    {
      key: 'pet_id' as const,
      label: 'Pet',
      render: (value: number, item: any) => item.pets?.name || `Pet #${value}`,
    },
    {
      key: 'diagnosis' as const,
      label: 'Diagnosis',
      render: (value: string | null) => <NotesPreview text={value} />,
    },
    {
      key: 'treatment' as const,
      label: 'Treatment',
      render: (value: string | null) => <NotesPreview text={value} />,
    },
    {
      key: 'created_at' as const,
      label: 'Date',
      render: (value: string) =>
        new Date(value).toLocaleDateString(),
    },
  ];

  const searchKeys = ['pet_id', 'diagnosis', 'treatment', 'pets.name', 'pets.species'];

  return (
    <Sidebar>
      <PageHeader 
        title="Health Records" 
        description="Manage pet health records and medical information"
        action={
          <Dialog open={open} onOpenChange={(isOpen) => {
            setOpen(isOpen);
            if (!isOpen) {
              setEditingRecord(null);
              reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              New Record
            </Button>
          </DialogTrigger>
          <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingRecord ? 'Edit Health Record' : 'Create Health Record'}</DialogTitle>
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
                {errors.pet_id && (
                  <p className="text-sm text-destructive">{errors.pet_id.message}</p>
                )}
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>Diagnosis</FieldLabel>
                <textarea
                  {...register('diagnosis')}
                  placeholder="Enter diagnosis... (supports bullet points and line breaks)"
                  rows={5}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </FieldGroup>

              <FieldGroup>
                <FieldLabel>Treatment</FieldLabel>
                <textarea
                  {...register('treatment')}
                  placeholder="Enter treatment details... (supports bullet points and line breaks)"
                  rows={5}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm resize-y min-h-[100px] focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </FieldGroup>

              <Button
                type="submit"
                disabled={submitting}
                className="w-full"
              >
                {submitting ? 'Saving...' : editingRecord ? 'Update Record' : 'Create Record'}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
        }
      />

      {isLoading ? (
        <p className="text-muted-foreground">Loading...</p>
      ) : records.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <p className="text-muted-foreground">No health records yet</p>
        </Card>
      ) : (
        <DataTable<HealthRecord>
          data={records}
          columns={columns}
          filters={[{
            key: 'is_active',
            label: 'Status',
            options: [{value: 'true', label: 'Active'}, {value: 'false', label: 'Inactive'}]
          }]}
          loading={isLoading}
          searchKeys={searchKeys}
          onRowClick={(record) => setViewingRecord(record)}
          actions={(record) => (
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setViewingRecord(record); }}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleEdit(record); }}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); setRecordToArchive(record); }}>
                <Archive className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          )}
        />
      )}

      {/* View Record Dialog */}
      <Dialog open={!!viewingRecord} onOpenChange={(open) => !open && setViewingRecord(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {(viewingRecord as any)?.pets?.name ? `${(viewingRecord as any).pets.name}'s Record` : 'Health Record'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Pet</p>
              <p className="text-sm">
                {(viewingRecord as any)?.pets?.name
                ? `${(viewingRecord as any).pets.name} (${(viewingRecord as any).pets.species || 'unknown'})`
                : `Pet #${viewingRecord?.pet_id}`}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Date</p>
              <p className="text-sm">{viewingRecord?.created_at ? new Date(viewingRecord.created_at).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Diagnosis</p>
              <div className="text-sm bg-muted/50 rounded-md p-3 whitespace-pre-wrap leading-relaxed">
                {viewingRecord?.diagnosis || 'No diagnosis recorded'}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Treatment</p>
              <div className="text-sm bg-muted/50 rounded-md p-3 whitespace-pre-wrap leading-relaxed">
                {viewingRecord?.treatment || 'No treatment recorded'}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setViewingRecord(null);
                  handleEdit(viewingRecord!);
                }}
              >
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!recordToArchive}
        title="Archive Health Record"
        description="Archive this health record?"
        actionLabel="Archive"
        onConfirm={handleArchive}
        onCancel={() => setRecordToArchive(null)}
        isLoading={isArchiving}
        variant="destructive"
      />
    </Sidebar>
  );
}