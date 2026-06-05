-- Migration: Add is_active for archive/soft-delete support (2026)
-- Run this in Supabase SQL editor or psql

ALTER TABLE public.pets ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.health_records ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.vaccinations ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.pet_locations ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.staff_availability ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.filter_categories ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.filter_options ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.cameras ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true; -- already may exist

-- Update existing rows to active if null
UPDATE public.pets SET is_active = true WHERE is_active IS NULL;
UPDATE public.appointments SET is_active = true WHERE is_active IS NULL;
-- repeat for others as needed

-- Note: Add indexes if performance needed
-- CREATE INDEX IF NOT EXISTS idx_pets_is_active ON public.pets(is_active);
