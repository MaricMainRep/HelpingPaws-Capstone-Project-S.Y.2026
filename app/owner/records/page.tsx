'use client';

import { useState, useEffect } from 'react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { PageHeader } from '@/components/admin/PageHeader';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Pill, Syringe, ClipboardList, Eye } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface HealthRecord {
  id: number;
  pet_id: number;
  diagnosis?: string;
  treatment?: string;
  created_at: string;
  pets?: { name: string };
}

interface Prescription {
  id: number;
  pet_id: number;
  medication_name: string;
  dosage?: string;
  duration?: string;
  created_at: string;
  pets?: { name: string };
}

interface Vaccination {
  id: number;
  pet_id: number;
  vaccine_name: string;
  administered_date: string;
  next_due_date?: string;
  pets?: { name: string };
}

function renderText(text: string | null | undefined) {
  if (!text) return <span className="text-muted-foreground italic">None</span>;
  const lines = text.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => (
        <p key={i}>{line.startsWith('- ') || line.startsWith('* ') ? <span className="pl-3">&bull; {line.slice(2)}</span> : line}</p>
      ))}
    </div>
  );
}

function TextPreview({ text, maxLines = 2 }: { text: string | null | undefined; maxLines?: number }) {
  if (!text) return null;
  const lines = text.split('\n');
  const truncated = lines.length > maxLines;
  const preview = truncated ? lines.slice(0, maxLines).join('\n') + '...' : text;
  return (
    <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-2">{preview}</p>
  );
}

export default function OwnerRecordsPage() {
  const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingRecord, setViewingRecord] = useState<HealthRecord | null>(null);
  const [viewingPrescription, setViewingPrescription] = useState<Prescription | null>(null);
  const [viewingVaccination, setViewingVaccination] = useState<Vaccination | null>(null);

  useEffect(() => {
    Promise.all([
      fetch(`${API_URL}/api/health-records/`).then((r) => r.json()),
      fetch(`${API_URL}/api/prescriptions/`).then((r) => r.json()),
      fetch(`${API_URL}/api/vaccinations/`).then((r) => r.json()),
    ])
      .then(([hr, rx, vax]) => {
        setHealthRecords(hr.records || []);
        setPrescriptions(rx.prescriptions || []);
        setVaccinations(vax.vaccinations || []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <Sidebar>
      <PageHeader 
        title="Medical Records" 
        description="View your pet's medical history" 
      />

      <Tabs defaultValue="health" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="health" className="flex items-center gap-2">
            <ClipboardList className="h-4 w-4" /> Health Records
          </TabsTrigger>
          <TabsTrigger value="medications" className="flex items-center gap-2">
            <Pill className="h-4 w-4" /> Medications
          </TabsTrigger>
          <TabsTrigger value="vaccinations" className="flex items-center gap-2">
            <Syringe className="h-4 w-4" /> Vaccinations
          </TabsTrigger>
        </TabsList>

        <TabsContent value="health" className="mt-4">
          {loading ? <p className="text-muted-foreground">Loading...</p> : healthRecords.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <FileText className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No health records found</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {healthRecords.map((record) => (
                <Card key={record.id} className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setViewingRecord(record)}>
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10"><FileText className="h-5 w-5 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{record.pets?.name || `Pet #${record.pet_id}`}</h3>
                      {record.diagnosis && <TextPreview text={record.diagnosis} />}
                      {!record.diagnosis && record.treatment && <TextPreview text={record.treatment} />}
                      <p className="text-xs text-muted-foreground mt-2">{new Date(record.created_at).toLocaleDateString()}</p>
                    </div>
                    <Eye className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="medications" className="mt-4">
          {loading ? <p className="text-muted-foreground">Loading...</p> : prescriptions.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <Pill className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No prescriptions found</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {prescriptions.map((rx) => (
                <Card key={rx.id} className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setViewingPrescription(rx)}>
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10"><Pill className="h-5 w-5 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{rx.medication_name}</h3>
                      <p className="text-sm text-muted-foreground">{rx.pets?.name}</p>
                      {rx.dosage && <p className="text-sm text-muted-foreground mt-1">{rx.dosage}</p>}
                    </div>
                    <Eye className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="vaccinations" className="mt-4">
          {loading ? <p className="text-muted-foreground">Loading...</p> : vaccinations.length === 0 ? (
            <Card className="p-8 text-center border-dashed">
              <Syringe className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-muted-foreground">No vaccinations found</p>
            </Card>
          ) : (
            <div className="space-y-3">
              {vaccinations.map((vax) => (
                <Card key={vax.id} className="p-4 cursor-pointer hover:bg-muted/50 transition-colors" onClick={() => setViewingVaccination(vax)}>
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-lg bg-primary/10"><Syringe className="h-5 w-5 text-primary" /></div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground">{vax.vaccine_name}</h3>
                      <p className="text-sm text-muted-foreground">{vax.pets?.name}</p>
                      <p className="text-sm text-muted-foreground">Given: {new Date(vax.administered_date).toLocaleDateString()}</p>
                      {vax.next_due_date && <p className="text-sm text-muted-foreground">Next due: {new Date(vax.next_due_date).toLocaleDateString()}</p>}
                    </div>
                    <Eye className="h-4 w-4 text-muted-foreground mt-1 shrink-0" />
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Health Record Detail Dialog */}
      <Dialog open={!!viewingRecord} onOpenChange={(open) => !open && setViewingRecord(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Health Record — {viewingRecord?.pets?.name || `Pet #${viewingRecord?.pet_id}`}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Date</p>
              <p className="text-sm">{viewingRecord?.created_at ? new Date(viewingRecord.created_at).toLocaleDateString() : '-'}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Diagnosis</p>
              <div className="text-sm bg-muted/50 rounded-md p-3 whitespace-pre-wrap leading-relaxed">
                {renderText(viewingRecord?.diagnosis)}
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">Treatment</p>
              <div className="text-sm bg-muted/50 rounded-md p-3 whitespace-pre-wrap leading-relaxed">
                {renderText(viewingRecord?.treatment)}
              </div>
            </div>
            <Button variant="outline" className="w-full" onClick={() => setViewingRecord(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Prescription Detail Dialog */}
      <Dialog open={!!viewingPrescription} onOpenChange={(open) => !open && setViewingPrescription(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingPrescription?.medication_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Pet</p>
              <p className="text-sm">{viewingPrescription?.pets?.name || `Pet #${viewingPrescription?.pet_id}`}</p>
            </div>
            {viewingPrescription?.dosage && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Dosage</p>
                <p className="text-sm">{viewingPrescription.dosage}</p>
              </div>
            )}
            {viewingPrescription?.duration && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Duration</p>
                <p className="text-sm">{viewingPrescription.duration}</p>
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={() => setViewingPrescription(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Vaccination Detail Dialog */}
      <Dialog open={!!viewingVaccination} onOpenChange={(open) => !open && setViewingVaccination(null)}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingVaccination?.vaccine_name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Pet</p>
              <p className="text-sm">{viewingVaccination?.pets?.name || `Pet #${viewingVaccination?.pet_id}`}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Administered</p>
              <p className="text-sm">{viewingVaccination?.administered_date ? new Date(viewingVaccination.administered_date).toLocaleDateString() : '-'}</p>
            </div>
            {viewingVaccination?.next_due_date && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Next Due</p>
                <p className="text-sm">{new Date(viewingVaccination.next_due_date).toLocaleDateString()}</p>
              </div>
            )}
            <Button variant="outline" className="w-full" onClick={() => setViewingVaccination(null)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}