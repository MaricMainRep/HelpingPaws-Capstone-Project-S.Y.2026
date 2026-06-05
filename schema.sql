-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.activity_logs (
  id integer NOT NULL DEFAULT nextval('activity_logs_id_seq'::regclass),
  user_id integer NOT NULL,
  action character varying NOT NULL,
  entity_type character varying,
  entity_id integer,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.appointments (
  id integer NOT NULL DEFAULT nextval('appointments_id_seq'::regclass),
  pet_id integer NOT NULL,
  staff_id integer,
  owner_id integer NOT NULL,
  appointment_date date NOT NULL,
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  status character varying NOT NULL DEFAULT 'PENDING'::character varying CHECK (status::text = ANY (ARRAY['PENDING'::character varying, 'CONFIRMED'::character varying, 'REJECTED'::character varying, 'COMPLETED'::character varying, 'CANCELLED'::character varying]::text[])),
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT appointments_pkey PRIMARY KEY (id),
  CONSTRAINT appointments_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id),
  CONSTRAINT appointments_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id),
  CONSTRAINT appointments_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.pet_owners(id)
);
CREATE TABLE public.cameras (
  id integer NOT NULL DEFAULT nextval('cameras_id_seq'::regclass),
  room_id integer,
  stream_url character varying,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  stream_id integer,
  CONSTRAINT cameras_pkey PRIMARY KEY (id),
  CONSTRAINT cameras_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.filter_categories (
  id integer NOT NULL DEFAULT nextval('filter_categories_id_seq'::regclass),
  key character varying NOT NULL UNIQUE,
  label character varying NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT filter_categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.filter_options (
  id integer NOT NULL DEFAULT nextval('filter_options_id_seq'::regclass),
  category_id integer NOT NULL,
  value character varying NOT NULL,
  label character varying NOT NULL,
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT filter_options_pkey PRIMARY KEY (id),
  CONSTRAINT filter_options_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.filter_categories(id)
);
CREATE TABLE public.health_records (
  id integer NOT NULL DEFAULT nextval('health_records_id_seq'::regclass),
  pet_id integer NOT NULL,
  diagnosis text,
  treatment text,
  recorded_by_staff_id integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT health_records_pkey PRIMARY KEY (id),
  CONSTRAINT health_records_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id),
  CONSTRAINT health_records_recorded_by_staff_id_fkey FOREIGN KEY (recorded_by_staff_id) REFERENCES public.staff(id)
);
CREATE TABLE public.notifications (
  id integer NOT NULL DEFAULT nextval('notifications_id_seq'::regclass),
  user_id integer NOT NULL,
  type character varying NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.pet_locations (
  id integer NOT NULL DEFAULT nextval('pet_locations_id_seq'::regclass),
  pet_id integer NOT NULL,
  room_id integer,
  status character varying CHECK (status::text = ANY (ARRAY['CHECKED_IN'::character varying, 'UNDER_OBSERVATION'::character varying, 'READY_FOR_PICKUP'::character varying, 'DISCHARGED'::character varying]::text[])),
  notes text,
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT pet_locations_pkey PRIMARY KEY (id),
  CONSTRAINT pet_locations_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id),
  CONSTRAINT pet_locations_room_id_fkey FOREIGN KEY (room_id) REFERENCES public.rooms(id)
);
CREATE TABLE public.pet_owners (
  id integer NOT NULL DEFAULT nextval('pet_owners_id_seq'::regclass),
  user_id integer NOT NULL UNIQUE,
  phone character varying,
  address text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT pet_owners_pkey PRIMARY KEY (id),
  CONSTRAINT pet_owners_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.pets (
  id integer NOT NULL DEFAULT nextval('pets_id_seq'::regclass),
  owner_id integer NOT NULL,
  name character varying NOT NULL,
  species character varying NOT NULL,
  breed character varying,
  age numeric,
  weight numeric,
  medical_history_notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT pets_pkey PRIMARY KEY (id),
  CONSTRAINT pets_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.pet_owners(id)
);
CREATE TABLE public.prescriptions (
  id integer NOT NULL DEFAULT nextval('prescriptions_id_seq'::regclass),
  health_record_id integer NOT NULL,
  pet_id integer NOT NULL,
  medication_name character varying NOT NULL,
  dosage character varying,
  duration character varying,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  scheduled_at timestamp with time zone,
  scheduled_start date,
  scheduled_end date,
  scheduled_times text,
  dosage_per_time character varying,
  last_reminded_at timestamp with time zone,
  is_active boolean DEFAULT true,
  CONSTRAINT prescriptions_pkey PRIMARY KEY (id),
  CONSTRAINT prescriptions_health_record_id_fkey FOREIGN KEY (health_record_id) REFERENCES public.health_records(id),
  CONSTRAINT prescriptions_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id)
);
CREATE TABLE public.rooms (
  id integer NOT NULL DEFAULT nextval('rooms_id_seq'::regclass),
  name character varying NOT NULL UNIQUE,
  description character varying,
  created_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT rooms_pkey PRIMARY KEY (id)
);
CREATE TABLE public.staff (
  id integer NOT NULL DEFAULT nextval('staff_id_seq'::regclass),
  user_id integer NOT NULL UNIQUE,
  specialty character varying,
  phone character varying,
  schedule_notes text,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT staff_pkey PRIMARY KEY (id),
  CONSTRAINT staff_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.staff_availability (
  id integer NOT NULL DEFAULT nextval('staff_availability_id_seq'::regclass),
  staff_id integer NOT NULL,
  day_of_week integer CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time time without time zone NOT NULL,
  end_time time without time zone NOT NULL,
  is_available boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT staff_availability_pkey PRIMARY KEY (id),
  CONSTRAINT staff_availability_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id)
);
CREATE TABLE public.users (
  id integer NOT NULL DEFAULT nextval('users_id_seq'::regclass),
  email character varying NOT NULL UNIQUE,
  password_hash character varying NOT NULL,
  name character varying NOT NULL,
  role character varying NOT NULL CHECK (role::text = ANY (ARRAY['ADMIN'::character varying, 'STAFF'::character varying, 'PET_OWNER'::character varying]::text[])),
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  fcm_token text,
  CONSTRAINT users_pkey PRIMARY KEY (id)
);
CREATE TABLE public.vaccinations (
  id integer NOT NULL DEFAULT nextval('vaccinations_id_seq'::regclass),
  pet_id integer NOT NULL,
  vaccine_name character varying NOT NULL,
  administered_date date,
  next_due_date date,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  is_active boolean DEFAULT true,
  CONSTRAINT vaccinations_pkey PRIMARY KEY (id),
  CONSTRAINT vaccinations_pet_id_fkey FOREIGN KEY (pet_id) REFERENCES public.pets(id)
);
