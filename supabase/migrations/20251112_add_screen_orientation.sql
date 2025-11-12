-- Add screen_orientation field to tv_devices table
-- This stores whether the display is in portrait or landscape mode

ALTER TABLE tv_devices
ADD COLUMN IF NOT EXISTS screen_orientation TEXT CHECK (screen_orientation IN ('portrait', 'landscape')) DEFAULT 'landscape';

-- Update existing devices based on their screen_resolution if available
UPDATE tv_devices
SET screen_orientation = CASE
  WHEN screen_resolution IS NOT NULL THEN
    CASE
      WHEN CAST(SPLIT_PART(screen_resolution, 'x', 2) AS INTEGER) > CAST(SPLIT_PART(screen_resolution, 'x', 1) AS INTEGER)
      THEN 'portrait'
      ELSE 'landscape'
    END
  ELSE 'landscape'
END
WHERE screen_orientation IS NULL OR screen_orientation = 'landscape';

-- Add comment
COMMENT ON COLUMN tv_devices.screen_orientation IS 'Display orientation: portrait (height > width) or landscape (width >= height)';
