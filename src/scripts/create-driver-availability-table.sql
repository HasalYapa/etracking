-- Create the driver_availability table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.driver_availability (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    driver_id UUID NOT NULL REFERENCES public.profiles(id),
    available BOOLEAN NOT NULL DEFAULT false,
    last_active TIMESTAMP WITH TIME ZONE DEFAULT now(),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add RLS policies
ALTER TABLE public.driver_availability ENABLE ROW LEVEL SECURITY;

-- Policy to allow drivers to view their own availability
CREATE POLICY "Drivers can view their own availability"
ON public.driver_availability
FOR SELECT
USING (auth.uid() = driver_id);

-- Policy to allow drivers to update their own availability
CREATE POLICY "Drivers can update their own availability"
ON public.driver_availability
FOR UPDATE
USING (auth.uid() = driver_id);

-- Policy to allow drivers to insert their own availability
CREATE POLICY "Drivers can insert their own availability"
ON public.driver_availability
FOR INSERT
WITH CHECK (auth.uid() = driver_id);

-- Policy to allow shop owners to view driver availability
CREATE POLICY "Shop owners can view driver availability"
ON public.driver_availability
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'shop_owner'
    )
);

-- Policy to allow admins to view and manage all driver availability
CREATE POLICY "Admins can manage all driver availability"
ON public.driver_availability
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    )
);
