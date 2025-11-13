-- Add screen_orientation to tv_devices table
ALTER TABLE tv_devices
  ADD COLUMN IF NOT EXISTS screen_orientation TEXT CHECK (screen_orientation IN ('landscape', 'portrait', 'auto')) DEFAULT 'landscape';

CREATE INDEX IF NOT EXISTS idx_tv_devices_orientation ON tv_devices(screen_orientation);
