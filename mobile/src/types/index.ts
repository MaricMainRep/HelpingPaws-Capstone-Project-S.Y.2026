export interface User {
  id: number;
  email: string;
  name: string;
  role: 'ADMIN' | 'STAFF' | 'PET_OWNER';
  is_active: boolean;
  created_at?: string;
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
  image_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PetOwner {
  id: number;
  user_id: number;
}

export interface Staff {
  id: number;
  user_id: number;
  is_available: boolean;
  specialization?: string;
  users?: {
    name: string;
    email: string;
  };
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
  pets?: Pet;
  staff?: Staff;
}

export interface HealthRecord {
  id: number;
  pet_id: number;
  recorded_by_staff_id?: number;
  diagnosis?: string;
  treatment?: string;
  notes?: string;
  created_at?: string;
  pets?: Pet;
  staff?: Staff;
}

export interface Prescription {
  id: number;
  health_record_id: number;
  pet_id: number;
  medication_name: string;
  dosage?: string;
  duration?: string;
  notes?: string;
  created_at?: string;
}

export interface Vaccination {
  id: number;
  pet_id: number;
  vaccine_name: string;
  date_given?: string;
  next_due_date?: string;
  notes?: string;
  created_at?: string;
}

export interface Room {
  id: number;
  name: string;
  description?: string;
  capacity?: number;
}

export interface Camera {
  id: number;
  room_id: number;
  name: string;
  stream_url?: string;
  is_active: boolean;
  rooms?: Room;
}

export interface PetLocation {
  id: number;
  pet_id: number;
  room_id: number;
  status: string;
  checked_in_at?: string;
  pets?: Pet;
  rooms?: Room;
}

export interface Notification {
  id: number;
  user_id: number;
  message: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'APPOINTMENT';
  is_read: boolean;
  created_at: string;
}

export interface StaffAvailability {
  id: number;
  staff_id: number;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_available: boolean;
}

export interface ActivityLog {
  id: number;
  user_id: number;
  action: string;
  entity_type?: string;
  entity_id?: number;
  created_at: string;
  users?: {
    name: string;
    email: string;
  };
}