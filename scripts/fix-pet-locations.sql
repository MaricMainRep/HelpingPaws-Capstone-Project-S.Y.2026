-- Migration script to add cameras table and foreign key to pet_locations
-- Run this on your existing Supabase database

-- First, create cameras table if it doesn't exist
CREATE TABLE IF NOT EXISTS cameras (
  id SERIAL PRIMARY KEY,
  room_number VARCHAR(50) UNIQUE NOT NULL,
  stream_url VARCHAR(500),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add foreign key from pet_locations to cameras via room_number
-- This will only work if there are matching room_numbers or NULL values
ALTER TABLE pet_locations 
ADD CONSTRAINT fk_pet_locations_cameras 
FOREIGN KEY (room_number) REFERENCES cameras(room_number) ON DELETE SET NULL;

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_pet_locations_room_number ON pet_locations(room_number);
