import { useState, useEffect, useCallback } from 'react';
import apiClient from '../lib/api';
import { Pet, Appointment, HealthRecord, Prescription, Vaccination, Staff, Room, Camera, Notification } from '../types';

export function usePets() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.clientInstance.get('/api/pets/');
      setPets(res.data.pets || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function createPet(data: Partial<Pet>) {
    const res = await apiClient.clientInstance.post('/api/pets/', data);
    setPets(prev => [...prev, res.data.pet]);
    return res.data.pet;
  }

  async function updatePet(id: number, data: Partial<Pet>) {
    const res = await apiClient.clientInstance.patch('/api/pets/', { id, ...data });
    setPets(prev => prev.map(p => p.id === id ? res.data.pet : p));
    return res.data.pet;
  }

  async function deletePet(id: number) {
    await apiClient.clientInstance.delete(`/api/pets/?id=${id}`);
    setPets(prev => prev.filter(p => p.id !== id));
  }

  return { pets, loading, error, refetch: fetch, createPet, updatePet, deletePet };
}

export function useAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.clientInstance.get('/api/appointments/');
      setAppointments(res.data.appointments || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  async function createAppointment(data: Partial<Appointment>) {
    const res = await apiClient.clientInstance.post('/api/appointments/', data);
    setAppointments(prev => [...prev, res.data.appointment]);
    return res.data.appointment;
  }

  async function updateAppointment(id: number, data: Partial<Appointment>) {
    const res = await apiClient.clientInstance.patch('/api/appointments/', { id, ...data });
    setAppointments(prev => prev.map(a => a.id === id ? res.data.appointment : a));
    return res.data.appointment;
  }

  async function cancelAppointment(id: number) {
    await apiClient.clientInstance.delete(`/api/appointments/?id=${id}`);
    setAppointments(prev => prev.filter(a => a.id !== id));
  }

  return { appointments, loading, error, refetch: fetch, createAppointment, updateAppointment, cancelAppointment };
}

export function useHealthRecords() {
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    try {
      setLoading(true);
      const res = await apiClient.clientInstance.get('/api/health-records/');
      setRecords(res.data.records || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { records, loading, error, refetch: fetch };
}

export function usePrescriptions() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.clientInstance.get('/api/prescriptions/')
      .then(res => setPrescriptions(res.data.prescriptions || []))
      .finally(() => setLoading(false));
  }, []);

  return { prescriptions, loading };
}

export function useVaccinations() {
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.clientInstance.get('/api/vaccinations/')
      .then(res => setVaccinations(res.data.vaccinations || []))
      .finally(() => setLoading(false));
  }, []);

  return { vaccinations, loading };
}

export function useStaff() {
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.clientInstance.get('/api/staff/')
      .then(res => setStaff(res.data.staff || []))
      .finally(() => setLoading(false));
  }, []);

  return { staff, loading };
}

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.clientInstance.get('/api/rooms/')
      .then(res => setRooms(res.data.rooms || []))
      .finally(() => setLoading(false));
  }, []);

  return { rooms, loading };
}

export function useCameras() {
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.clientInstance.get('/api/cameras/')
      .then(res => setCameras(res.data.cameras || []))
      .finally(() => setLoading(false));
  }, []);

  return { cameras, loading };
}

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.clientInstance.get('/api/notifications/')
      .then(res => setNotifications(res.data.notifications || []))
      .finally(() => setLoading(false));
  }, []);

  async function markAsRead(id?: number) {
    await apiClient.clientInstance.patch('/api/notifications/', { id });
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  }

  return { notifications, loading, markAsRead };
}