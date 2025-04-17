-- Script to add explicit foreign key constraints to the database

-- Add foreign key from orders to profiles (shop_id)
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_shop 
FOREIGN KEY (shop_id) 
REFERENCES profiles(id);

-- Add foreign key from orders to profiles (driver_id)
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_driver 
FOREIGN KEY (driver_id) 
REFERENCES profiles(id);

-- Add foreign key from orders to customers
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_customer 
FOREIGN KEY (customer_id) 
REFERENCES customers(id);

-- Add foreign key from order_history to orders
ALTER TABLE order_history 
ADD CONSTRAINT fk_order_history_order 
FOREIGN KEY (order_id) 
REFERENCES orders(id);

-- Add foreign key from order_history to profiles (updated_by)
ALTER TABLE order_history 
ADD CONSTRAINT fk_order_history_profile 
FOREIGN KEY (updated_by) 
REFERENCES profiles(id);

-- Add foreign key from customers to profiles (shop_id)
ALTER TABLE customers 
ADD CONSTRAINT fk_customers_shop 
FOREIGN KEY (shop_id) 
REFERENCES profiles(id);
