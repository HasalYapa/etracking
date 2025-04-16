-- Add QR code tracking fields to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS dispatch_location TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS last_location TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS latitude FLOAT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS longitude FLOAT;

-- Create order_history table if it doesn't exist
CREATE TABLE IF NOT EXISTS order_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  notes TEXT,
  location TEXT,
  latitude FLOAT,
  longitude FLOAT,
  driver_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create RLS policies for order_history
ALTER TABLE order_history ENABLE ROW LEVEL SECURITY;

-- Policy for shop owners to see their own order history
CREATE POLICY shop_owner_order_history_policy ON order_history
  FOR ALL
  USING (
    order_id IN (
      SELECT id FROM orders WHERE shop_id = auth.uid()
    )
  );

-- Policy for drivers to see order history for orders assigned to them
CREATE POLICY driver_order_history_policy ON order_history
  FOR ALL
  USING (
    order_id IN (
      SELECT id FROM orders WHERE driver_id = auth.uid()
    )
  );

-- Policy for admins to see all order history
CREATE POLICY admin_order_history_policy ON order_history
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Create function to update order status when history is updated
CREATE OR REPLACE FUNCTION update_order_status()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders
  SET 
    status = NEW.status,
    last_updated = NEW.created_at,
    last_location = COALESCE(NEW.location, last_location),
    latitude = COALESCE(NEW.latitude, latitude),
    longitude = COALESCE(NEW.longitude, longitude)
  WHERE id = NEW.order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update order status
DROP TRIGGER IF EXISTS update_order_status_trigger ON order_history;
CREATE TRIGGER update_order_status_trigger
AFTER INSERT ON order_history
FOR EACH ROW
EXECUTE FUNCTION update_order_status();
