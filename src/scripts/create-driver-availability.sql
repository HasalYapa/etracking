-- Create driver_availability table
CREATE TABLE IF NOT EXISTS public.driver_availability (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  available BOOLEAN DEFAULT false NOT NULL,
  latitude FLOAT,
  longitude FLOAT,
  last_active TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(driver_id)
);

-- Enable RLS
ALTER TABLE public.driver_availability ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Drivers can update their own availability"
  ON driver_availability
  FOR ALL
  USING (driver_id = auth.uid());

CREATE POLICY "Shop owners can view driver availability"
  ON driver_availability
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'shop_owner'
    )
  );

CREATE POLICY "Admin can view all driver availability"
  ON driver_availability
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create driver_notifications table
CREATE TABLE IF NOT EXISTS public.driver_notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  driver_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'accepted', 'rejected', 'expired')) DEFAULT 'pending',
  read BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.driver_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Drivers can view their own notifications"
  ON driver_notifications
  FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can update their own notifications"
  ON driver_notifications
  FOR UPDATE
  USING (driver_id = auth.uid());

CREATE POLICY "Shop owners can create driver notifications"
  ON driver_notifications
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_id
      AND orders.shop_id = auth.uid()
    )
  );

CREATE POLICY "Admin can manage all driver notifications"
  ON driver_notifications
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create a function to automatically create driver availability records for new drivers
CREATE OR REPLACE FUNCTION create_driver_availability()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role = 'driver' THEN
    INSERT INTO public.driver_availability (driver_id, available)
    VALUES (NEW.id, false)
    ON CONFLICT (driver_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function when a new driver is created
DROP TRIGGER IF EXISTS create_driver_availability_trigger ON public.profiles;
CREATE TRIGGER create_driver_availability_trigger
AFTER INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION create_driver_availability();

-- Create a function to automatically update driver availability last_active timestamp
CREATE OR REPLACE FUNCTION update_driver_last_active()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.last_active = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function when driver availability is updated
DROP TRIGGER IF EXISTS update_driver_last_active_trigger ON public.driver_availability;
CREATE TRIGGER update_driver_last_active_trigger
BEFORE UPDATE ON public.driver_availability
FOR EACH ROW
EXECUTE FUNCTION update_driver_last_active();
