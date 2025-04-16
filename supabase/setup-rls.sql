-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sms_packs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Admin can view all profiles" ON profiles;

DROP POLICY IF EXISTS "Shop owners can CRUD their own customers" ON customers;
DROP POLICY IF EXISTS "Drivers can view customers for their assigned orders" ON customers;
DROP POLICY IF EXISTS "Admin can view all customers" ON customers;

DROP POLICY IF EXISTS "Shop owners can CRUD their own orders" ON orders;
DROP POLICY IF EXISTS "Drivers can view and update their assigned orders" ON orders;
DROP POLICY IF EXISTS "Drivers can update their assigned orders" ON orders;
DROP POLICY IF EXISTS "Admin can view all orders" ON orders;
DROP POLICY IF EXISTS "Public can view orders by tracking number" ON orders;

DROP POLICY IF EXISTS "Shop owners can view history for their orders" ON order_history;
DROP POLICY IF EXISTS "Drivers can view history for their assigned orders" ON order_history;
DROP POLICY IF EXISTS "Shop owners can create history for their orders" ON order_history;
DROP POLICY IF EXISTS "Drivers can create history for their assigned orders" ON order_history;
DROP POLICY IF EXISTS "Admin can view all order history" ON order_history;
DROP POLICY IF EXISTS "Public can view order history" ON order_history;

DROP POLICY IF EXISTS "Shop owners can view their SMS logs" ON sms_logs;
DROP POLICY IF EXISTS "Admin can view all SMS logs" ON sms_logs;

DROP POLICY IF EXISTS "Users can view their own SMS packs" ON sms_packs;
DROP POLICY IF EXISTS "Admin can view all SMS packs" ON sms_packs;

-- Profiles policies
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admin can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Customers policies
CREATE POLICY "Shop owners can CRUD their own customers"
  ON customers FOR ALL
  USING (shop_id = auth.uid());

CREATE POLICY "Drivers can view customers for their assigned orders"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.customer_id = customers.id
      AND orders.driver_id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all customers"
  ON customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Orders policies
CREATE POLICY "Shop owners can CRUD their own orders"
  ON orders FOR ALL
  USING (shop_id = auth.uid());

CREATE POLICY "Drivers can view and update their assigned orders"
  ON orders FOR SELECT
  USING (driver_id = auth.uid());

CREATE POLICY "Drivers can update their assigned orders"
  ON orders FOR UPDATE
  USING (driver_id = auth.uid());

CREATE POLICY "Admin can view all orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Public can view orders by tracking number"
  ON orders FOR SELECT
  USING (true);

-- Order history policies
CREATE POLICY "Shop owners can view history for their orders"
  ON order_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_history.order_id
      AND orders.shop_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can view history for their assigned orders"
  ON order_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_history.order_id
      AND orders.driver_id = auth.uid()
    )
  );

CREATE POLICY "Shop owners can create history for their orders"
  ON order_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_history.order_id
      AND orders.shop_id = auth.uid()
    )
  );

CREATE POLICY "Drivers can create history for their assigned orders"
  ON order_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_history.order_id
      AND orders.driver_id = auth.uid()
    )
  );

CREATE POLICY "Admin can view all order history"
  ON order_history FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Public can view order history"
  ON order_history FOR SELECT
  USING (true);

-- SMS logs policies
CREATE POLICY "Shop owners can view their SMS logs"
  ON sms_logs FOR SELECT
  USING (shop_id = auth.uid());

CREATE POLICY "Admin can view all SMS logs"
  ON sms_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- SMS packs policies
CREATE POLICY "Users can view their own SMS packs"
  ON sms_packs FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admin can view all SMS packs"
  ON sms_packs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
