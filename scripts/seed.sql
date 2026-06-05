-- HelpingPaws Database Seed Data
-- Run this after init-db.sql to populate the database with sample data
-- Password for all accounts: password123

-- Note: Run init-db.sql first to create tables

BEGIN;

-- ============================================
-- USERS
-- ============================================

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create admin user (password: password123)
INSERT INTO users (email, password_hash, name, role, is_active)
VALUES (
  'admin@helpingpaws.com',
  crypt('password123', gen_salt('bf')),
  'Admin User',
  'ADMIN',
  true
) ON CONFLICT (email) DO NOTHING;

-- Create staff users
INSERT INTO users (email, password_hash, name, role, is_active)
VALUES 
  (
    'dr.smith@helpingpaws.com',
    crypt('password123', gen_salt('bf')),
    'Dr. Sarah Smith',
    'STAFF',
    true
  ),
  (
    'dr.jones@helpingpaws.com',
    crypt('password123', gen_salt('bf')),
    'Dr. Michael Jones',
    'STAFF',
    true
  ),
  (
    'nurse.emily@helpingpaws.com',
    crypt('password123', gen_salt('bf')),
    'Emily Rodriguez',
    'STAFF',
    true
  )
ON CONFLICT (email) DO NOTHING;

-- Create pet owner users
INSERT INTO users (email, password_hash, name, role, is_active)
VALUES 
  (
    'john.doe@email.com',
    crypt('password123', gen_salt('bf')),
    'John Doe',
    'PET_OWNER',
    true
  ),
  (
    'jane.smith@email.com',
    crypt('password123', gen_salt('bf')),
    'Jane Smith',
    'PET_OWNER',
    true
  ),
  (
    'bob.wilson@email.com',
    crypt('password123', gen_salt('bf')),
    'Bob Wilson',
    'PET_OWNER',
    true
  ),
  (
    'alice.brown@email.com',
    crypt('password123', gen_salt('bf')),
    'Alice Brown',
    'PET_OWNER',
    true
  )
ON CONFLICT (email) DO NOTHING;

-- ============================================
-- STAFF RECORDS
-- ============================================

INSERT INTO staff (user_id, specialty, phone, schedule_notes, is_available)
SELECT u.id, 'General Surgery', '555-1000', 'Available Mon-Fri', true
FROM users u WHERE u.email = 'dr.smith@helpingpaws.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO staff (user_id, specialty, phone, schedule_notes, is_available)
SELECT u.id, 'Orthopedics', '555-1001', 'Available Tue-Sat', true
FROM users u WHERE u.email = 'dr.jones@helpingpaws.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO staff (user_id, specialty, phone, schedule_notes, is_available)
SELECT u.id, 'Nursing', '555-1002', 'Available Mon-Fri', true
FROM users u WHERE u.email = 'nurse.emily@helpingpaws.com'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- PET OWNER RECORDS
-- ============================================

INSERT INTO pet_owners (user_id, phone, address)
SELECT u.id, '555-2000', '100 Main St, Pet City, PC 12345'
FROM users u WHERE u.email = 'john.doe@email.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO pet_owners (user_id, phone, address)
SELECT u.id, '555-2001', '101 Main St, Pet City, PC 12345'
FROM users u WHERE u.email = 'jane.smith@email.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO pet_owners (user_id, phone, address)
SELECT u.id, '555-2002', '102 Main St, Pet City, PC 12345'
FROM users u WHERE u.email = 'bob.wilson@email.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO pet_owners (user_id, phone, address)
SELECT u.id, '555-2003', '103 Main St, Pet City, PC 12345'
FROM users u WHERE u.email = 'alice.brown@email.com'
ON CONFLICT (user_id) DO NOTHING;

-- ============================================
-- PETS
-- ============================================

-- John Doe's pets
INSERT INTO pets (owner_id, name, species, breed, age, weight, medical_history_notes)
SELECT po.id, 'Max', 'Dog', 'Golden Retriever', 3.5, 65, 'Routine checkups only'
FROM pet_owners po
JOIN users u ON po.user_id = u.id
WHERE u.email = 'john.doe@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO pets (owner_id, name, species, breed, age, weight, medical_history_notes)
SELECT po.id, 'Whiskers', 'Cat', 'Persian', 2, 12, 'Allergic to chicken'
FROM pet_owners po
JOIN users u ON po.user_id = u.id
WHERE u.email = 'john.doe@email.com'
ON CONFLICT DO NOTHING;

-- Jane Smith's pets
INSERT INTO pets (owner_id, name, species, breed, age, weight, medical_history_notes)
SELECT po.id, 'Bella', 'Dog', 'Labrador', 5, 70, 'Mild arthritis, on glucosamine'
FROM pet_owners po
JOIN users u ON po.user_id = u.id
WHERE u.email = 'jane.smith@email.com'
ON CONFLICT DO NOTHING;

INSERT INTO pets (owner_id, name, species, breed, age, weight, medical_history_notes)
SELECT po.id, 'Mittens', 'Cat', 'Siamese', 4, 10, 'Diabetes - insulin daily'
FROM pet_owners po
JOIN users u ON po.user_id = u.id
WHERE u.email = 'jane.smith@email.com'
ON CONFLICT DO NOTHING;

-- Bob Wilson's pet
INSERT INTO pets (owner_id, name, species, breed, age, weight, medical_history_notes)
SELECT po.id, 'Charlie', 'Dog', 'Beagle', 2, 30, 'Prone to ear infections'
FROM pet_owners po
JOIN users u ON po.user_id = u.id
WHERE u.email = 'bob.wilson@email.com'
ON CONFLICT DO NOTHING;

-- Alice Brown's pet
INSERT INTO pets (owner_id, name, species, breed, age, weight, medical_history_notes)
SELECT po.id, 'Luna', 'Dog', 'Husky', 1.5, 55, 'Young and healthy'
FROM pet_owners po
JOIN users u ON po.user_id = u.id
WHERE u.email = 'alice.brown@email.com'
ON CONFLICT DO NOTHING;

-- ============================================
-- APPOINTMENTS
-- ============================================

-- Get IDs for appointments
-- We'll use specific dates for the appointments

INSERT INTO appointments (pet_id, staff_id, owner_id, appointment_date, start_time, end_time, status, notes)
SELECT 
  p.id,
  s.id,
  po.id,
  CURRENT_DATE + 2,
  '09:00',
  '10:00',
  'CONFIRMED',
  'Routine checkup and vaccination'
FROM pets p
JOIN pet_owners po ON p.owner_id = po.id
JOIN users u ON po.user_id = u.id
JOIN staff s ON s.specialty = 'General Surgery'
WHERE p.name = 'Max' AND u.email = 'john.doe@email.com'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO appointments (pet_id, staff_id, owner_id, appointment_date, start_time, end_time, status, notes)
SELECT 
  p.id,
  s.id,
  po.id,
  CURRENT_DATE + 5,
  '10:00',
  '11:00',
  'PENDING',
  'Dental cleaning'
FROM pets p
JOIN pet_owners po ON p.owner_id = po.id
JOIN users u ON po.user_id = u.id
JOIN staff s ON s.specialty = 'Orthopedics'
WHERE p.name = 'Whiskers' AND u.email = 'john.doe@email.com'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO appointments (pet_id, staff_id, owner_id, appointment_date, start_time, end_time, status, notes)
SELECT 
  p.id,
  s.id,
  po.id,
  CURRENT_DATE + 1,
  '14:00',
  '15:00',
  'CONFIRMED',
  'Follow-up for arthritis'
FROM pets p
JOIN pet_owners po ON p.owner_id = po.id
JOIN users u ON po.user_id = u.id
JOIN staff s ON s.specialty = 'General Surgery'
WHERE p.name = 'Bella' AND u.email = 'jane.smith@email.com'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO appointments (pet_id, staff_id, owner_id, appointment_date, start_time, end_time, status, notes)
SELECT 
  p.id,
  s.id,
  po.id,
  CURRENT_DATE + 3,
  '11:00',
  '12:00',
  'CONFIRMED',
  'Ear infection treatment'
FROM pets p
JOIN pet_owners po ON p.owner_id = po.id
JOIN users u ON po.user_id = u.id
JOIN staff s ON s.specialty = 'Nursing'
WHERE p.name = 'Charlie' AND u.email = 'bob.wilson@email.com'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO appointments (pet_id, staff_id, owner_id, appointment_date, start_time, end_time, status, notes)
SELECT 
  p.id,
  s.id,
  po.id,
  CURRENT_DATE + 7,
  '15:00',
  '16:00',
  'PENDING',
  'First vaccination series'
FROM pets p
JOIN pet_owners po ON p.owner_id = po.id
JOIN users u ON po.user_id = u.id
JOIN staff s ON s.specialty = 'General Surgery'
WHERE p.name = 'Luna' AND u.email = 'alice.brown@email.com'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- HEALTH RECORDS
-- ============================================

INSERT INTO health_records (pet_id, diagnosis, treatment, recorded_by_staff_id)
SELECT p.id, 'Healthy with minor dental tartar', 'Prophylactic dental cleaning recommended', s.id
FROM pets p
JOIN users u ON u.email = 'john.doe@email.com'
JOIN pet_owners po ON po.user_id = u.id
JOIN staff s ON s.specialty = 'General Surgery'
WHERE p.name = 'Max' AND p.owner_id = po.id
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO health_records (pet_id, diagnosis, treatment, recorded_by_staff_id)
SELECT p.id, 'Mild food allergy', 'Switched to hypoallergenic diet', s.id
FROM pets p
JOIN users u ON u.email = 'john.doe@email.com'
JOIN pet_owners po ON po.user_id = u.id
JOIN staff s ON s.specialty = 'Orthopedics'
WHERE p.name = 'Whiskers' AND p.owner_id = po.id
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO health_records (pet_id, diagnosis, treatment, recorded_by_staff_id)
SELECT p.id, 'Osteoarthritis in rear legs', 'Glucosamine supplement and weight management', s.id
FROM pets p
JOIN users u ON u.email = 'jane.smith@email.com'
JOIN pet_owners po ON po.user_id = u.id
JOIN staff s ON s.specialty = 'General Surgery'
WHERE p.name = 'Bella' AND p.owner_id = po.id
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO health_records (pet_id, diagnosis, treatment, recorded_by_staff_id)
SELECT p.id, 'Type 1 Diabetes', 'Daily insulin injections, dietary management', s.id
FROM pets p
JOIN users u ON u.email = 'jane.smith@email.com'
JOIN pet_owners po ON po.user_id = u.id
JOIN staff s ON s.specialty = 'Orthopedics'
WHERE p.name = 'Mittens' AND p.owner_id = po.id
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO health_records (pet_id, diagnosis, treatment, recorded_by_staff_id)
SELECT p.id, 'Chronic otitis externa', 'Antibiotic ear drops, weekly cleaning', s.id
FROM pets p
JOIN users u ON u.email = 'bob.wilson@email.com'
JOIN pet_owners po ON po.user_id = u.id
JOIN staff s ON s.specialty = 'Nursing'
WHERE p.name = 'Charlie' AND p.owner_id = po.id
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- PRESCRIPTIONS
-- ============================================

INSERT INTO prescriptions (health_record_id, pet_id, medication_name, dosage, duration, notes)
SELECT hr.id, p.id, 'Hypoallergenic Dog Food', 'As needed', 'Ongoing', 'Royal Canin Hydrolyzed Protein'
FROM health_records hr
JOIN pets p ON p.name = 'Whiskers'
WHERE hr.diagnosis = 'Mild food allergy'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO prescriptions (health_record_id, pet_id, medication_name, dosage, duration, notes)
SELECT hr.id, p.id, 'Glucosamine Supplement', '500mg twice daily', '6 months', 'With chondroitin'
FROM health_records hr
JOIN pets p ON p.name = 'Bella'
WHERE hr.diagnosis = 'Osteoarthritis in rear legs'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO prescriptions (health_record_id, pet_id, medication_name, dosage, duration, notes)
SELECT hr.id, p.id, 'Insulin Glargine', '4 units twice daily', 'Ongoing', 'Monitor blood glucose regularly'
FROM health_records hr
JOIN pets p ON p.name = 'Mittens'
WHERE hr.diagnosis = 'Type 1 Diabetes'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO prescriptions (health_record_id, pet_id, medication_name, dosage, duration, notes)
SELECT hr.id, p.id, 'Enrofloxacin Ear Drops', '5 drops twice daily', '14 days', 'Clean ear before application'
FROM health_records hr
JOIN pets p ON p.name = 'Charlie'
WHERE hr.diagnosis = 'Chronic otitis externa'
LIMIT 1
ON CONFLICT DO NOTHING;

-- ============================================
-- VACCINATIONS
-- ============================================

-- Max's vaccinations
INSERT INTO vaccinations (pet_id, vaccine_name, administered_date, next_due_date, notes)
SELECT p.id, 'DHPP (Distemper, Hepatitis, Parvo, Parainfluenza)', '2024-01-15', '2025-01-15', 'Booster shot'
FROM pets p WHERE p.name = 'Max'
ON CONFLICT DO NOTHING;

INSERT INTO vaccinations (pet_id, vaccine_name, administered_date, next_due_date, notes)
SELECT p.id, 'Rabies', '2024-01-15', '2026-01-15', '3-year vaccine'
FROM pets p WHERE p.name = 'Max'
ON CONFLICT DO NOTHING;

-- Whiskers' vaccinations
INSERT INTO vaccinations (pet_id, vaccine_name, administered_date, next_due_date, notes)
SELECT p.id, 'FVRCP (Feline Viral Rhinotracheitis, Calicivirus, Panleukopenia)', '2024-02-10', '2025-02-10', 'Annual booster'
FROM pets p WHERE p.name = 'Whiskers'
ON CONFLICT DO NOTHING;

INSERT INTO vaccinations (pet_id, vaccine_name, administered_date, next_due_date, notes)
SELECT p.id, 'Rabies (Feline)', '2024-02-10', '2026-02-10', '3-year vaccine'
FROM pets p WHERE p.name = 'Whiskers'
ON CONFLICT DO NOTHING;

-- Bella's vaccinations
INSERT INTO vaccinations (pet_id, vaccine_name, administered_date, next_due_date, notes)
SELECT p.id, 'DHPP (Distemper, Hepatitis, Parvo, Parainfluenza)', '2023-12-20', '2024-12-20', 'Booster shot'
FROM pets p WHERE p.name = 'Bella'
ON CONFLICT DO NOTHING;

-- Charlie's vaccinations
INSERT INTO vaccinations (pet_id, vaccine_name, administered_date, next_due_date, notes)
SELECT p.id, 'DHPP (Distemper, Hepatitis, Parvo, Parainfluenza)', '2024-02-01', '2024-03-01', 'First shot of series'
FROM pets p WHERE p.name = 'Charlie'
ON CONFLICT DO NOTHING;

-- Luna's vaccinations
INSERT INTO vaccinations (pet_id, vaccine_name, administered_date, next_due_date, notes)
SELECT p.id, 'DHPP (Distemper, Hepatitis, Parvo, Parainfluenza)', '2024-03-15', '2024-04-15', 'Puppy first shot'
FROM pets p WHERE p.name = 'Luna'
ON CONFLICT DO NOTHING;

-- ============================================
-- ROOMS
-- ============================================

INSERT INTO rooms (name, description)
VALUES 
  ('Room 101', 'General examination room 1'),
  ('Room 102', 'General examination room 2'),
  ('Room 103', 'Surgery room'),
  ('Recovery', 'Post-surgery recovery room')
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- CAMERAS
-- ============================================

INSERT INTO cameras (room_id, stream_url, is_active)
SELECT r.id, 'rtsp://localhost:8554/' || LOWER(REPLACE(r.name, ' ', '')), true
FROM rooms r
WHERE r.name = 'Room 101'
ON CONFLICT DO NOTHING;

INSERT INTO cameras (room_id, stream_url, is_active)
SELECT r.id, 'rtsp://localhost:8554/' || LOWER(REPLACE(r.name, ' ', '')), true
FROM rooms r
WHERE r.name = 'Room 102'
ON CONFLICT DO NOTHING;

INSERT INTO cameras (room_id, stream_url, is_active)
SELECT r.id, 'rtsp://localhost:8554/' || LOWER(REPLACE(r.name, ' ', '')), true
FROM rooms r
WHERE r.name = 'Room 103'
ON CONFLICT DO NOTHING;

INSERT INTO cameras (room_id, stream_url, is_active)
SELECT r.id, 'rtsp://localhost:8554/recovery', true
FROM rooms r
WHERE r.name = 'Recovery'
ON CONFLICT DO NOTHING;

-- ============================================
-- PET LOCATIONS
-- ============================================

INSERT INTO pet_locations (pet_id, room_id, status, notes)
SELECT p.id, r.id, 'CHECKED_IN', 'Routine checkup'
FROM pets p, rooms r
WHERE p.name = 'Max' AND r.name = 'Room 101'
ON CONFLICT DO NOTHING;

INSERT INTO pet_locations (pet_id, room_id, status, notes)
SELECT p.id, r.id, 'UNDER_OBSERVATION', 'Post-surgery monitoring'
FROM pets p, rooms r
WHERE p.name = 'Whiskers' AND r.name = 'Recovery'
ON CONFLICT DO NOTHING;

INSERT INTO pet_locations (pet_id, room_id, status, notes)
SELECT p.id, r.id, 'READY_FOR_PICKUP', 'Ready for owner pickup'
FROM pets p, rooms r
WHERE p.name = 'Bella' AND r.name = 'Room 101'
ON CONFLICT DO NOTHING;

-- ============================================
-- STAFF AVAILABILITY
-- ============================================

-- Dr. Smith (staff id 1) - Mon-Fri, 8am-5pm with 1-hour slots
INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available)
SELECT s.id, day, 
       (start_time::text || ':00')::time, 
       ((start_time + 1)::text || ':00')::time, 
       true
FROM staff s
CROSS JOIN generate_series(0, 4) AS day
CROSS JOIN generate_series(8, 16) AS start_time
WHERE s.specialty = 'General Surgery'
ON CONFLICT DO NOTHING;

-- Dr. Jones (staff id 2) - Tue-Sat, 8am-5pm with 1-hour slots
INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available)
SELECT s.id, day, 
       (start_time::text || ':00')::time, 
       ((start_time + 1)::text || ':00')::time, 
       true
FROM staff s
CROSS JOIN generate_series(1, 5) AS day
CROSS JOIN generate_series(8, 16) AS start_time
WHERE s.specialty = 'Orthopedics'
ON CONFLICT DO NOTHING;

-- Nurse Emily (staff id 3) - Mon-Fri, 8am-5pm with 1-hour slots
INSERT INTO staff_availability (staff_id, day_of_week, start_time, end_time, is_available)
SELECT s.id, day, 
       (start_time::text || ':00')::time, 
       ((start_time + 1)::text || ':00')::time, 
       true
FROM staff s
CROSS JOIN generate_series(0, 4) AS day
CROSS JOIN generate_series(8, 16) AS start_time
WHERE s.specialty = 'Nursing'
ON CONFLICT DO NOTHING;

-- ============================================
-- ACTIVITY LOGS
-- ============================================

-- Admin actions
INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
SELECT (SELECT id FROM users WHERE email = 'admin@helpingpaws.com' LIMIT 1), 'Created staff account', 'staff', id
FROM staff WHERE user_id = (SELECT id FROM users WHERE email = 'dr.smith@helpingpaws.com' LIMIT 1);

INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
SELECT (SELECT id FROM users WHERE email = 'admin@helpingpaws.com' LIMIT 1), 'Created staff account', 'staff', id
FROM staff WHERE user_id = (SELECT id FROM users WHERE email = 'dr.jones@helpingpaws.com' LIMIT 1);

INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
SELECT (SELECT id FROM users WHERE email = 'admin@helpingpaws.com' LIMIT 1), 'Created staff account', 'staff', id
FROM staff WHERE user_id = (SELECT id FROM users WHERE email = 'nurse.emily@helpingpaws.com' LIMIT 1);

INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
SELECT (SELECT id FROM users WHERE email = 'admin@helpingpaws.com' LIMIT 1), 'Registered camera', 'camera', id FROM cameras WHERE id <= 4;

-- Staff actions
INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
SELECT (SELECT id FROM users WHERE email = 'dr.smith@helpingpaws.com' LIMIT 1), 'Created health record', 'health_record', id FROM health_records WHERE id = 1;

INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
SELECT (SELECT id FROM users WHERE email = 'dr.smith@helpingpaws.com' LIMIT 1), 'Updated appointment status', 'appointment', id FROM appointments WHERE id = 1;

INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
SELECT (SELECT id FROM users WHERE email = 'dr.jones@helpingpaws.com' LIMIT 1), 'Created health record', 'health_record', id FROM health_records WHERE id = 2;

INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
SELECT (SELECT id FROM users WHERE email = 'dr.jones@helpingpaws.com' LIMIT 1), 'Created prescription', 'prescription', id FROM prescriptions WHERE id = 1;

INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
SELECT (SELECT id FROM users WHERE email = 'nurse.emily@helpingpaws.com' LIMIT 1), 'Created health record', 'health_record', id FROM health_records WHERE id = 3;

INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
SELECT (SELECT id FROM users WHERE email = 'nurse.emily@helpingpaws.com' LIMIT 1), 'Updated pet location', 'pet_location', id FROM pet_locations WHERE id = 1;

-- Pet owner actions
INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
SELECT (SELECT id FROM users WHERE email = 'john.doe@email.com' LIMIT 1), 'Created pet', 'pet', id FROM pets WHERE name = 'Max';

INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
SELECT (SELECT id FROM users WHERE email = 'john.doe@email.com' LIMIT 1), 'Booked appointment', 'appointment', id FROM appointments WHERE pet_id = (SELECT id FROM pets WHERE name = 'Max' LIMIT 1) LIMIT 1;

INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
SELECT (SELECT id FROM users WHERE email = 'jane.smith@email.com' LIMIT 1), 'Created pet', 'pet', id FROM pets WHERE name = 'Bella';

INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
SELECT (SELECT id FROM users WHERE email = 'jane.smith@email.com' LIMIT 1), 'Booked appointment', 'appointment', id FROM appointments WHERE pet_id = (SELECT id FROM pets WHERE name = 'Bella' LIMIT 1) LIMIT 1;

INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
SELECT (SELECT id FROM users WHERE email = 'bob.wilson@email.com' LIMIT 1), 'Created pet', 'pet', id FROM pets WHERE name = 'Charlie';

INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
SELECT (SELECT id FROM users WHERE email = 'bob.wilson@email.com' LIMIT 1), 'Booked appointment', 'appointment', id FROM appointments WHERE pet_id = (SELECT id FROM pets WHERE name = 'Charlie' LIMIT 1) LIMIT 1;

INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
SELECT (SELECT id FROM users WHERE email = 'alice.brown@email.com' LIMIT 1), 'Created pet', 'pet', id FROM pets WHERE name = 'Luna';

INSERT INTO activity_logs (user_id, action, entity_type, entity_id)
SELECT (SELECT id FROM users WHERE email = 'alice.brown@email.com' LIMIT 1), 'Booked appointment', 'appointment', id FROM appointments WHERE pet_id = (SELECT id FROM pets WHERE name = 'Luna' LIMIT 1) LIMIT 1;

-- ============================================
-- NOTIFICATIONS
-- ============================================

-- Notifications for pet owners
INSERT INTO notifications (user_id, type, message) VALUES
((SELECT id FROM users WHERE email = 'john.doe@email.com' LIMIT 1), 'APPOINTMENT', 'Your appointment for Max is confirmed on ' || CURRENT_DATE + 2),
((SELECT id FROM users WHERE email = 'john.doe@email.com' LIMIT 1), 'INFO', 'Welcome to HelpingPaws! Your pet records are now available.'),
((SELECT id FROM users WHERE email = 'jane.smith@email.com' LIMIT 1), 'APPOINTMENT', 'Your appointment for Bella has been confirmed.'),
((SELECT id FROM users WHERE email = 'jane.smith@email.com' LIMIT 1), 'REMINDER', 'Remember to bring Bella\'s medication list to your next appointment.'),
((SELECT id FROM users WHERE email = 'bob.wilson@email.com' LIMIT 1), 'APPOINTMENT', 'Your appointment for Charlie is scheduled for tomorrow.'),
((SELECT id FROM users WHERE email = 'alice.brown@email.com' LIMIT 1), 'APPOINTMENT', 'Your first appointment for Luna has been booked.');

-- Notifications for staff
INSERT INTO notifications (user_id, type, message) VALUES
((SELECT id FROM users WHERE email = 'dr.smith@helpingpaws.com' LIMIT 1), 'APPOINTMENT', 'New appointment booked for ' || CURRENT_DATE + 2),
((SELECT id FROM users WHERE email = 'dr.smith@helpingpaws.com' LIMIT 1), 'INFO', 'You have 3 appointments scheduled for tomorrow.'),
((SELECT id FROM users WHERE email = 'dr.jones@helpingpaws.com' LIMIT 1), 'APPOINTMENT', 'New appointment request pending your confirmation.'),
((SELECT id FROM users WHERE email = 'nurse.emily@helpingpaws.com' LIMIT 1), 'INFO', 'Pet Charlie has been checked in to Recovery room.');

-- Notification for admin
INSERT INTO notifications (user_id, type, message) VALUES
((SELECT id FROM users WHERE email = 'admin@helpingpaws.com' LIMIT 1), 'INFO', 'System initialized successfully.'),
((SELECT id FROM users WHERE email = 'admin@helpingpaws.com' LIMIT 1), 'INFO', '4 staff members are currently available.');

COMMIT;

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check created data
SELECT 'Users' AS table_name, COUNT(*) AS count FROM users
UNION ALL
SELECT 'Staff', COUNT(*) FROM staff
UNION ALL
SELECT 'Pet Owners', COUNT(*) FROM pet_owners
UNION ALL
SELECT 'Pets', COUNT(*) FROM pets
UNION ALL
SELECT 'Appointments', COUNT(*) FROM appointments
UNION ALL
SELECT 'Health Records', COUNT(*) FROM health_records
UNION ALL
SELECT 'Prescriptions', COUNT(*) FROM prescriptions
UNION ALL
SELECT 'Vaccinations', COUNT(*) FROM vaccinations
UNION ALL
SELECT 'Rooms', COUNT(*) FROM rooms
UNION ALL
SELECT 'Cameras', COUNT(*) FROM cameras
UNION ALL
SELECT 'Pet Locations', COUNT(*) FROM pet_locations
UNION ALL
SELECT 'Staff Availability', COUNT(*) FROM staff_availability;

-- ============================================
-- TEST CREDENTIALS
-- ============================================

-- All accounts use password: password123
-- 
-- Login with:
-- Admin: admin@helpingpaws.com / password123
-- Staff: dr.smith@helpingpaws.com / password123  
-- Pet Owner: john.doe@email.com / password123
