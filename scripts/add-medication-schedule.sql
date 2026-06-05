ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS scheduled_start DATE;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS scheduled_end DATE;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS scheduled_times TEXT;
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS dosage_per_time VARCHAR(100);
ALTER TABLE prescriptions ADD COLUMN IF NOT EXISTS last_reminded_at TIMESTAMP WITH TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_prescriptions_schedule ON prescriptions(scheduled_start, scheduled_end) WHERE scheduled_start IS NOT NULL;