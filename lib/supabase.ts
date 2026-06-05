import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseKey);

// Type definitions for database tables
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF' | 'PET_OWNER';
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Staff {
  id: number;
  user_id: number;
  specialty?: string;
  phone?: string;
  schedule_notes?: string;
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export interface PetOwner {
  id: number;
  user_id: number;
  phone?: string;
  address?: string;
  created_at: string;
  updated_at: string;
}

export interface Pet {
  id: number;
  owner_id: number;
  name: string;
  species: string;
  breed?: string;
  age?: number;
  weight?: number;
  medical_history_notes?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: number;
  pet_id: number;
  staff_id?: number;
  owner_id: number;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  notes?: string;
  is_active?: boolean;
  created_at: string;
  updated_at: string;
  pets?: { name: string; species: string };
  staff?: { users?: { name: string } };
}

export interface HealthRecord {
  id: number;
  pet_id: number;
  diagnosis?: string;
  treatment?: string;
  recorded_by_staff_id?: number;
  created_at: string;
  updated_at: string;
}

export interface Prescription {
  id: number;
  health_record_id: number;
  pet_id: number;
  medication_name: string;
  dosage?: string;
  duration?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: number;
  name: string;
  description?: string;
  is_active?: boolean;
  created_at: string;
}

export interface Camera {
  id: number;
  room_id?: number;
  stream_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  rooms?: { name: string };
}

export interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  entity_type?: string;
  entity_id?: number;
  created_at: string;
  users?: { name: string; email: string };
}

export interface FilterCategory {
  id: number;
  key: string;
  label: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  filter_options?: FilterOption[];
}

export interface FilterOption {
  id: number;
  category_id: number;
  value: string;
  label: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}
