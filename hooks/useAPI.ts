import useSWR, { SWRConfiguration } from 'swr';
import type {
  Pet,
  Appointment,
  HealthRecord,
  Prescription,
  User,
  Staff,
  Room,
  ActivityLog,
  FilterCategory,
  FilterOption,
} from '@/lib/supabase';

const API_URL = process.env.NEXT_PUBLIC_API_URL || '';
const DJANGO_API = API_URL; // Use Django directly

const fetcher = (url: string) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  return fetch(`${API_URL}${url}`, { 
    credentials: 'include',
    headers: token ? { 'Authorization': `Bearer ${token}` } : {},
  }).then((res) => {
    if (!res.ok) throw new Error('API error');
    return res.json();
  });
};

export function usePets(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/pets/',
    fetcher,
    options
  );

  return {
    pets: data?.pets || [],
    isLoading,
    error: error?.message,
    mutate,
  };
}

export function useAppointments(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/appointments/',
    fetcher,
    options
  );

  return {
    appointments: data?.appointments || [],
    isLoading,
    error: error?.message,
    mutate,
  };
}

export function useHealthRecords(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/health-records/',
    fetcher,
    options
  );

  return {
    records: data?.records || [],
    isLoading,
    error: error?.message,
    mutate,
  };
}

export function useUsers(
  role?: string,
  options?: SWRConfiguration
) {
  const url = role ? `/api/users/?role=${role}` : '/api/users/';
  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    options
  );

  return {
    users: data?.users || [],
    isLoading,
    error: error?.message,
    mutate,
  };
}

export async function createPet(petData: Partial<Pet>) {
  const response = await fetch(`${API_URL}/api/pets/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(petData),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create pet');
  }

  return response.json();
}

export async function updatePet(id: number, petData: Partial<Pet>) {
  const response = await fetch(`${API_URL}/api/pets/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...petData }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update pet');
  }

  return response.json();
}

export async function archivePet(id: number) {
  const response = await fetch(`${API_URL}/api/pets/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, is_active: false }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to archive pet');
  }

  return response.json();
}

export async function restorePet(id: number) {
  const response = await fetch(`${API_URL}/api/pets/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, is_active: true }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to restore pet');
  }

  return response.json();
}

export async function createAppointment(
  appointmentData: Partial<Appointment>
) {
  const response = await fetch(`${API_URL}/api/appointments/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(appointmentData),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create appointment');
  }

  return response.json();
}

export async function createHealthRecord(
  recordData: Partial<HealthRecord>
) {
  const response = await fetch(`${API_URL}/api/health-records/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(recordData),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create health record');
  }

  return response.json();
}

export async function updateUser(
  id: number,
  updates: Partial<User>
) {
  const response = await fetch(`${API_URL}/api/users/`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, ...updates }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update user');
  }

  return response.json();
}

export function useRooms(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/rooms/',
    fetcher,
    options
  );

  return {
    rooms: data?.rooms || [],
    isLoading,
    error: error?.message,
    mutate,
  };
}

export function useCameras(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/cameras/',
    fetcher,
    options
  );

  return {
    cameras: data?.cameras || [],
    isLoading,
    error: error?.message,
    mutate,
  };
}

export function useStaff(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/staff/',
    fetcher,
    options
  );

  return {
    staff: data?.staff || [],
    isLoading,
    error: error?.message,
    mutate,
  };
}

export function useActivityLogs(options?: SWRConfiguration) {
  const { data, error, isLoading, mutate } = useSWR(
    '/api/activity-logs/',
    fetcher,
    options
  );

  return {
    logs: data?.logs || [],
    isLoading,
    error: error?.message,
    mutate,
  };
}

export async function logActivity(
  action: string,
  entityType?: string,
  entityId?: number
) {
  const response = await fetch(`${API_URL}/api/activity-logs/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, entity_type: entityType, entity_id: entityId }),
    credentials: 'include',
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to log activity');
  }

  return response.json();
}

export interface AnalyticsOverview {
  totalPets: number;
  totalAppointments: number;
  todayAppointments: number;
  activeStaff: number;
  petsMonitoring: number;
}

export interface AppointmentStatusData {
  status: string;
  count: number;
}

export interface AppointmentTrendData {
  date: string;
  total: number;
  completed: number;
  pending: number;
}

export interface SpeciesData {
  species: string;
  count: number;
}

export interface StaffPerformanceData {
  staffId: number;
  name: string;
  specialty: string;
  totalAppointments: number;
  completedAppointments: number;
}

export interface RoomUtilizationData {
  roomId: number;
  name: string;
  activePets: number;
}

export interface AnalyticsData {
  overview: AnalyticsOverview;
  charts: {
    appointmentsByStatus: AppointmentStatusData[];
    appointmentsTrend: AppointmentTrendData[];
    petsBySpecies: SpeciesData[];
    staffPerformance: StaffPerformanceData[];
    roomsUtilization: RoomUtilizationData[];
  };
}

export function useAnalytics(
  startDate?: string,
  endDate?: string,
  options?: SWRConfiguration
) {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);

  const url = `/api/analytics/${params.toString() ? `?${params.toString()}` : ''}`;
  const { data, error, isLoading, mutate } = useSWR<AnalyticsData>(
    url,
    fetcher,
    options
  );

  return {
    analytics: data,
    isLoading,
    error: error?.message,
    mutate,
  };
}

export async function exportAnalyticsPDF(
  analytics: AnalyticsData | undefined,
  startDate?: string,
  endDate?: string
) {
  const { default: jsPDF } = await import('jspdf');
  const autoTable = (await import('jspdf-autotable')).default;

  if (!analytics) {
    throw new Error('No analytics data available');
  }

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  doc.setFontSize(20);
  doc.setTextColor(58, 125, 108);
  doc.text('HelpingPaws Analytics Report', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  const dateRange = startDate && endDate 
    ? `${startDate} to ${endDate}` 
    : 'All Time';
  doc.text(`Date Range: ${dateRange}`, pageWidth / 2, 28, { align: 'center' });
  doc.text(`Generated: ${new Date().toLocaleDateString()}`, pageWidth / 2, 34, { align: 'center' });

  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text('Overview', 14, 48);
  
  autoTable(doc, {
    startY: 52,
    head: [['Metric', 'Value']],
    body: [
      ['Total Pets', analytics.overview.totalPets.toString()],
      ['Total Appointments', analytics.overview.totalAppointments.toString()],
      ['Today\'s Appointments', analytics.overview.todayAppointments.toString()],
      ['Active Staff', analytics.overview.activeStaff.toString()],
      ['Pets Under Monitoring', analytics.overview.petsMonitoring.toString()],
    ],
    headStyles: { fillColor: [58, 125, 108] },
    alternateRowStyles: { fillColor: [245, 250, 248] },
  });

  let currentY = (doc as any).lastAutoTable.finalY + 15;
  
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.setFontSize(14);
  doc.text('Appointments by Status', 14, currentY);
  
  autoTable(doc, {
    startY: currentY + 4,
    head: [['Status', 'Count']],
    body: analytics.charts.appointmentsByStatus.map(item => [item.status, item.count.toString()]),
    headStyles: { fillColor: [58, 125, 108] },
    alternateRowStyles: { fillColor: [245, 250, 248] },
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;
  
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.setFontSize(14);
  doc.text('Pets by Species', 14, currentY);
  
  autoTable(doc, {
    startY: currentY + 4,
    head: [['Species', 'Count']],
    body: analytics.charts.petsBySpecies.map(item => [item.species, item.count.toString()]),
    headStyles: { fillColor: [58, 125, 108] },
    alternateRowStyles: { fillColor: [245, 250, 248] },
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;
  
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.setFontSize(14);
  doc.text('Staff Performance', 14, currentY);
  
  autoTable(doc, {
    startY: currentY + 4,
    head: [['Name', 'Specialty', 'Total Appointments', 'Completed']],
    body: analytics.charts.staffPerformance.map(item => [
      item.name,
      item.specialty,
      item.totalAppointments.toString(),
      item.completedAppointments.toString()
    ]),
    headStyles: { fillColor: [58, 125, 108] },
    alternateRowStyles: { fillColor: [245, 250, 248] },
  });

  currentY = (doc as any).lastAutoTable.finalY + 15;
  
  if (currentY > 250) {
    doc.addPage();
    currentY = 20;
  }
  
  doc.setFontSize(14);
  doc.text('Room Utilization', 14, currentY);
  
  autoTable(doc, {
    startY: currentY + 4,
    head: [['Room', 'Active Pets']],
    body: analytics.charts.roomsUtilization.map(item => [item.name, item.activePets.toString()]),
    headStyles: { fillColor: [58, 125, 108] },
    alternateRowStyles: { fillColor: [245, 250, 248] },
  });

  doc.save(`analytics-report-${new Date().toISOString().split('T')[0]}.pdf`);
}

export async function exportAnalyticsCSV(
  startDate?: string,
  endDate?: string
) {
  const params = new URLSearchParams();
  if (startDate) params.set('startDate', startDate);
  if (endDate) params.set('endDate', endDate);
  params.set('format', 'csv');

  const response = await fetch(`${API_URL}/api/analytics/?${params.toString()}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to export CSV');
  }

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics-report-${new Date().toISOString().split('T')[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);
}

export function useFilters(categoryKey?: string, options?: SWRConfiguration) {
  const url = categoryKey ? `/api/filters/?category=${categoryKey}` : '/api/filters/';
  
  const { data, error, isLoading, mutate } = useSWR(
    url,
    fetcher,
    options
  );

  return {
    categories: data?.filters || [],
    category: data?.category,
    options: data?.options || [],
    isLoading,
    error: error?.message,
    mutate,
  };
}
