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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Clock, Save, Check } from 'lucide-react';
import { toast } from '@/lib/toast';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';

const DAYS = [
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
];

const TIME_SLOTS = [
  { start: '08:00', end: '09:00', label: '8:00 AM - 9:00 AM' },
  { start: '09:00', end: '10:00', label: '9:00 AM - 10:00 AM' },
  { start: '10:00', end: '11:00', label: '10:00 AM - 11:00 AM' },
  { start: '11:00', end: '12:00', label: '11:00 AM - 12:00 PM' },
  { start: '12:00', end: '13:00', label: '12:00 PM - 1:00 PM' },
  { start: '13:00', end: '14:00', label: '1:00 PM - 2:00 PM' },
  { start: '14:00', end: '15:00', label: '2:00 PM - 3:00 PM' },
  { start: '15:00', end: '16:00', label: '3:00 PM - 4:00 PM' },
  { start: '16:00', end: '17:00', label: '4:00 PM - 5:00 PM' },
];

export default function AvailabilityPage() {
  const [availability, setAvailability] = useState<Map<number, Set<string>>>(new Map());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [tempSlots, setTempSlots] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/staff/availability/`)
      .then((res) => res.json())
      .then((data) => {
        const availMap = new Map<number, Set<string>>();
        
        if (data.availability && data.availability.length > 0) {
          data.availability.forEach((slot: any) => {
            if (!availMap.has(slot.day_of_week)) {
              availMap.set(slot.day_of_week, new Set());
            }
            if (slot.is_available) {
              const startTime = slot.start_time.substring(0, 5);
              availMap.get(slot.day_of_week)!.add(startTime);
            }
          });
        }
        
        setAvailability(availMap);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const openDayModal = (dayValue: number) => {
    setSelectedDay(dayValue);
    setTempSlots(availability.get(dayValue) || new Set());
    setDialogOpen(true);
  };

  const toggleTempSlot = (startTime: string) => {
    setTempSlots((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(startTime)) {
        newSet.delete(startTime);
      } else {
        newSet.add(startTime);
      }
      return newSet;
    });
  };

  const saveDayAvailability = () => {
    setAvailability((prev) => {
      const newMap = new Map(prev);
      newMap.set(selectedDay!, tempSlots);
      return newMap;
    });
    setDialogOpen(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const availabilityData = Array.from(availability.entries()).flatMap(([day, slots]) =>
        Array.from(slots).map((startTime) => {
          const slot = TIME_SLOTS.find(s => s.start === startTime);
          return {
            day_of_week: day,
            start_time: startTime,
            end_time: slot?.end || '17:00',
            is_available: true,
          };
        })
      );
      
      await fetch(`${API_URL}/api/staff/availability/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ availability: availabilityData }),
      });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      toast.success('Availability saved', {
        description: 'Your schedule has been updated successfully.',
      });
    } catch (error) {
      console.error('Failed to save:', error);
      toast.error('Failed to save', {
        description: 'An error occurred while saving your availability.',
      });
    } finally {
      setSaving(false);
    }
  };

  const getDayInfo = (dayValue: number) => {
    const daySlots = availability.get(dayValue) || new Set();
    const count = daySlots.size;
    if (count === 0) return { status: 'unavailable', label: 'Not Available' };
    if (count === TIME_SLOTS.length) return { status: 'full', label: 'Full Day' };
    return { status: 'partial', label: `${count} slot${count !== 1 ? 's' : ''}` };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'full':
        return 'bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700 text-green-700 dark:text-green-400';
      case 'partial':
        return 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-muted border-border text-muted-foreground';
    }
  };

  if (loading) {
    return (
      <Sidebar>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </Sidebar>
    );
  }

  return (
    <Sidebar>
      <PageHeader 
        title="My Availability" 
        description="Click on a day to set your available time slots" 
      />

      <div className="flex items-center justify-end mb-6">
        <Button onClick={handleSave} disabled={saving}>
          {saved ? <Check className="h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Schedule'}
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {DAYS.map((day) => {
          const dayInfo = getDayInfo(day.value);
          const isAvailable = dayInfo.status !== 'unavailable';
          const isSelected = selectedDay === day.value && dialogOpen;
          
          return (
            <div key={day.value}>
              <button
                onClick={() => openDayModal(day.value)}
                className={`w-full p-6 rounded-xl border-2 transition-all text-center hover:shadow-md ${
                  isSelected
                    ? 'border-primary bg-primary/5 ring-2 ring-primary'
                    : isAvailable
                      ? 'border-primary bg-primary/5'
                      : 'border-border bg-muted/50'
                }`}
              >
                <div className="font-semibold text-lg text-foreground mb-2">{day.short}</div>
                <div className={`text-xs px-2 py-1 rounded-full ${getStatusColor(dayInfo.status)}`}>
                  {dayInfo.label}
                </div>
              </button>
              {selectedDay === day.value && (
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{day.label} - Available Time Slots</DialogTitle>
                    </DialogHeader>
                    <div className="grid grid-cols-2 gap-2 py-4">
                      {TIME_SLOTS.map((slot) => {
                        const isSelected = tempSlots.has(slot.start);
                        return (
                          <button
                            key={slot.start}
                            type="button"
                            onClick={() => toggleTempSlot(slot.start)}
                            className={`p-3 rounded-lg border-2 text-sm font-medium transition-all ${
                              isSelected
                                ? 'border-primary bg-primary text-primary-foreground'
                                : 'border-border hover:border-primary/50'
                            }`}
                          >
                            {slot.label}
                          </button>
                        );
                      })}
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={saveDayAvailability}>
                        Save Day
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          );
        })}
      </div>

      <Card className="mt-6 p-4">
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-muted-foreground">Full Day</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <span className="text-muted-foreground">Partial</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-400" />
            <span className="text-muted-foreground">Not Available</span>
          </div>
        </div>
      </Card>
    </Sidebar>
  );
}
