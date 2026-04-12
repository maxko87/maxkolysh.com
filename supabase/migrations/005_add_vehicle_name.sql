-- Add vehicle_name column so reminder emails can use the car's name (e.g. "Tessy")
ALTER TABLE tesla_users ADD COLUMN IF NOT EXISTS vehicle_name text;
