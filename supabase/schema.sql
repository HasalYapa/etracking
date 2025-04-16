-- Create tables for eTracking.store

-- Enable RLS (Row Level Security)
alter table auth.users enable row level security;

-- Create profiles table
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  name text not null,
  email text not null,
  role text not null check (role in ('shop_owner', 'driver', 'admin')),
  phone text,
  address text,
  business_name text,
  subscription_tier text check (subscription_tier in ('free', 'basic', 'pro', 'custom')),
  subscription_status text check (subscription_status in ('active', 'cancelled', 'past_due')),
  subscription_start timestamp with time zone,
  subscription_end timestamp with time zone
);

-- Create customers table
create table public.customers (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  name text not null,
  phone text not null,
  email text,
  address text not null,
  shop_id uuid references public.profiles(id) on delete cascade not null
);

-- Create orders table
create table public.orders (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null,
  shop_id uuid references public.profiles(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade not null,
  driver_id uuid references public.profiles(id) on delete set null,
  status text not null check (status in ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')) default 'pending',
  delivery_address text not null,
  delivery_notes text,
  proof_of_delivery text,
  tracking_number text not null unique,
  estimated_delivery timestamp with time zone
);

-- Create order_history table
create table public.order_history (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default now() not null,
  order_id uuid references public.orders(id) on delete cascade not null,
  status text not null check (status in ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  notes text,
  updated_by uuid references public.profiles(id) on delete set null not null
);

-- Create sms_logs table
create table public.sms_logs (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default now() not null,
  order_id uuid references public.orders(id) on delete cascade not null,
  customer_id uuid references public.customers(id) on delete cascade not null,
  message text not null,
  status text not null check (status in ('sent', 'delivered', 'failed')) default 'sent',
  shop_id uuid references public.profiles(id) on delete cascade not null
);

-- Create sms_packs table
create table public.sms_packs (
  id uuid default uuid_generate_v4() primary key,
  created_at timestamp with time zone default now() not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  pack_size integer not null,
  remaining integer not null,
  expires_at timestamp with time zone not null
);

-- Create RLS policies

-- Profiles policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Admin can view all profiles"
  on profiles for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Customers policies
create policy "Shop owners can CRUD their own customers"
  on customers for all
  using (shop_id = auth.uid());

create policy "Drivers can view customers for their assigned orders"
  on customers for select
  using (
    exists (
      select 1 from orders
      where orders.customer_id = customers.id
      and orders.driver_id = auth.uid()
    )
  );

create policy "Admin can view all customers"
  on customers for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Orders policies
create policy "Shop owners can CRUD their own orders"
  on orders for all
  using (shop_id = auth.uid());

create policy "Drivers can view and update their assigned orders"
  on orders for select
  using (driver_id = auth.uid());

create policy "Drivers can update their assigned orders"
  on orders for update
  using (driver_id = auth.uid());

create policy "Admin can view all orders"
  on orders for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Public can view orders by tracking number"
  on orders for select
  using (true);

-- Order history policies
create policy "Shop owners can view history for their orders"
  on order_history for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_history.order_id
      and orders.shop_id = auth.uid()
    )
  );

create policy "Drivers can view history for their assigned orders"
  on order_history for select
  using (
    exists (
      select 1 from orders
      where orders.id = order_history.order_id
      and orders.driver_id = auth.uid()
    )
  );

create policy "Shop owners can create history for their orders"
  on order_history for insert
  with check (
    exists (
      select 1 from orders
      where orders.id = order_history.order_id
      and orders.shop_id = auth.uid()
    )
  );

create policy "Drivers can create history for their assigned orders"
  on order_history for insert
  with check (
    exists (
      select 1 from orders
      where orders.id = order_history.order_id
      and orders.driver_id = auth.uid()
    )
  );

create policy "Admin can view all order history"
  on order_history for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

create policy "Public can view order history"
  on order_history for select
  using (true);

-- SMS logs policies
create policy "Shop owners can view their SMS logs"
  on sms_logs for select
  using (shop_id = auth.uid());

create policy "Admin can view all SMS logs"
  on sms_logs for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- SMS packs policies
create policy "Users can view their own SMS packs"
  on sms_packs for select
  using (user_id = auth.uid());

create policy "Admin can view all SMS packs"
  on sms_packs for select
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_history enable row level security;
alter table public.sms_logs enable row level security;
alter table public.sms_packs enable row level security;

-- Create functions and triggers

-- Function to handle user creation
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name, email, role)
  values (new.id, new.raw_user_meta_data->>'name', new.email, new.raw_user_meta_data->>'role');
  
  -- Set default subscription tier based on role
  if (new.raw_user_meta_data->>'role' = 'shop_owner') then
    update public.profiles
    set subscription_tier = 'free',
        subscription_status = 'active',
        subscription_start = now(),
        subscription_end = now() + interval '30 days'
    where id = new.id;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user creation
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Function to update timestamp on record update
create or replace function public.update_timestamp()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Triggers for timestamp updates
create trigger update_profiles_timestamp
  before update on public.profiles
  for each row execute procedure public.update_timestamp();

create trigger update_customers_timestamp
  before update on public.customers
  for each row execute procedure public.update_timestamp();

create trigger update_orders_timestamp
  before update on public.orders
  for each row execute procedure public.update_timestamp();

-- Function to create order history on status change
create or replace function public.create_order_history()
returns trigger as $$
begin
  if (old.status is null or new.status != old.status) then
    insert into public.order_history (order_id, status, notes, updated_by)
    values (new.id, new.status, 'Order status updated to ' || new.status, auth.uid());
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger for order status changes
create trigger on_order_status_change
  after update on public.orders
  for each row execute procedure public.create_order_history();

-- Function to create initial order history
create or replace function public.create_initial_order_history()
returns trigger as $$
begin
  insert into public.order_history (order_id, status, notes, updated_by)
  values (new.id, new.status, 'Order created', auth.uid());
  return new;
end;
$$ language plpgsql;

-- Trigger for new order creation
create trigger on_order_created
  after insert on public.orders
  for each row execute procedure public.create_initial_order_history();
