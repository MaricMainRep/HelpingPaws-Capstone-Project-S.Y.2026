-- HelpingPaws - Filter Management Tables
-- Add dynamic filter categories and options for admin management

-- Create filter_categories table (defines what filter groups exist)
CREATE TABLE filter_categories (
  id SERIAL PRIMARY KEY,
  key VARCHAR(100) UNIQUE NOT NULL,
  label VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create filter_options table (individual filter values)
CREATE TABLE filter_options (
  id SERIAL PRIMARY KEY,
  category_id INTEGER NOT NULL REFERENCES filter_categories(id) ON DELETE CASCADE,
  value VARCHAR(255) NOT NULL,
  label VARCHAR(255) NOT NULL,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint for value per category
ALTER TABLE filter_options ADD UNIQUE (category_id, value);

-- Create indexes
CREATE INDEX idx_filter_categories_key ON filter_categories(key);
CREATE INDEX idx_filter_categories_active ON filter_categories(is_active);
CREATE INDEX idx_filter_options_category ON filter_options(category_id);
CREATE INDEX idx_filter_options_active ON filter_options(is_active);

-- Seed default filter categories
INSERT INTO filter_categories (key, label, description) VALUES
  ('user_role', 'User Role', 'User roles in the system'),
  ('user_status', 'User Status', 'User account status'),
  ('pet_species', 'Pet Species', 'Types of pets'),
  ('appointment_status', 'Appointment Status', 'Status of appointments'),
  ('pet_location_status', 'Pet Location Status', 'Status of pet confinement'),
  ('notification_type', 'Notification Type', 'Types of notifications'),
  ('activity_action', 'Activity Action', 'Types of system actions'),
  ('activity_entity', 'Activity Entity', 'Types of entities affected');

-- Seed default filter options for user roles
INSERT INTO filter_options (category_id, value, label, sort_order) VALUES
  ((SELECT id FROM filter_categories WHERE key = 'user_role'), 'ADMIN', 'Admin', 1),
  ((SELECT id FROM filter_categories WHERE key = 'user_role'), 'STAFF', 'Staff', 2),
  ((SELECT id FROM filter_categories WHERE key = 'user_role'), 'PET_OWNER', 'Pet Owner', 3);

-- Seed default filter options for user status
INSERT INTO filter_options (category_id, value, label, sort_order) VALUES
  ((SELECT id FROM filter_categories WHERE key = 'user_status'), 'true', 'Active', 1),
  ((SELECT id FROM filter_categories WHERE key = 'user_status'), 'false', 'Inactive', 2);

-- Seed default filter options for pet species
INSERT INTO filter_options (category_id, value, label, sort_order) VALUES
  ((SELECT id FROM filter_categories WHERE key = 'pet_species'), 'Dog', 'Dog', 1),
  ((SELECT id FROM filter_categories WHERE key = 'pet_species'), 'Cat', 'Cat', 2),
  ((SELECT id FROM filter_categories WHERE key = 'pet_species'), 'Bird', 'Bird', 3),
  ((SELECT id FROM filter_categories WHERE key = 'pet_species'), 'Rabbit', 'Rabbit', 4),
  ((SELECT id FROM filter_categories WHERE key = 'pet_species'), 'Hamster', 'Hamster', 5),
  ((SELECT id FROM filter_categories WHERE key = 'pet_species'), 'Other', 'Other', 6);

-- Seed default filter options for appointment status
INSERT INTO filter_options (category_id, value, label, sort_order) VALUES
  ((SELECT id FROM filter_categories WHERE key = 'appointment_status'), 'PENDING', 'Pending', 1),
  ((SELECT id FROM filter_categories WHERE key = 'appointment_status'), 'CONFIRMED', 'Confirmed', 2),
  ((SELECT id FROM filter_categories WHERE key = 'appointment_status'), 'REJECTED', 'Rejected', 3),
  ((SELECT id FROM filter_categories WHERE key = 'appointment_status'), 'COMPLETED', 'Completed', 4),
  ((SELECT id FROM filter_categories WHERE key = 'appointment_status'), 'CANCELLED', 'Cancelled', 5);

-- Seed default filter options for pet location status
INSERT INTO filter_options (category_id, value, label, sort_order) VALUES
  ((SELECT id FROM filter_categories WHERE key = 'pet_location_status'), 'CHECKED_IN', 'Checked In', 1),
  ((SELECT id FROM filter_categories WHERE key = 'pet_location_status'), 'UNDER_OBSERVATION', 'Under Observation', 2),
  ((SELECT id FROM filter_categories WHERE key = 'pet_location_status'), 'READY_FOR_PICKUP', 'Ready for Pickup', 3),
  ((SELECT id FROM filter_categories WHERE key = 'pet_location_status'), 'DISCHARGED', 'Discharged', 4);

-- Seed default filter options for notification types
INSERT INTO filter_options (category_id, value, label, sort_order) VALUES
  ((SELECT id FROM filter_categories WHERE key = 'notification_type'), 'INFO', 'Info', 1),
  ((SELECT id FROM filter_categories WHERE key = 'notification_type'), 'SUCCESS', 'Success', 2),
  ((SELECT id FROM filter_categories WHERE key = 'notification_type'), 'WARNING', 'Warning', 3),
  ((SELECT id FROM filter_categories WHERE key = 'notification_type'), 'ERROR', 'Error', 4);
