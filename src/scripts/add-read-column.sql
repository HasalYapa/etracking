-- Add the read column to the driver_notifications table if it doesn't exist
ALTER TABLE IF EXISTS public.driver_notifications 
ADD COLUMN IF NOT EXISTS read BOOLEAN DEFAULT false NOT NULL;
