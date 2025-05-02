/*
  # Initial Schema Setup for Sunu Rekolt

  1. New Tables
    - `profiles`
      - User profiles with role-specific fields
      - Stores farmer/buyer information
    - `products`
      - Agricultural products listed by farmers
      - Includes approval status and inventory tracking
    - `orders`
      - Customer orders with items and payment status
    - `agricultural_inputs`
      - Shop items (seeds, fertilizers, etc.)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
    - Secure access based on user roles
*/

-- Create enum types
CREATE TYPE user_role AS ENUM ('farmer', 'buyer', 'admin');
CREATE TYPE product_category AS ENUM ('vegetables', 'fruits', 'grains', 'livestock', 'dairy', 'other');
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'delivered', 'cancelled');
CREATE TYPE payment_method AS ENUM ('orange_money', 'wave', 'free_money');
CREATE TYPE input_category AS ENUM ('seeds', 'fertilizer', 'pesticide', 'tools', 'other');

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  phone text UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'buyer',
  name text NOT NULL,
  location text,
  farm_size decimal,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text NOT NULL,
  price decimal NOT NULL CHECK (price > 0),
  quantity decimal NOT NULL CHECK (quantity >= 0),
  unit text NOT NULL,
  category product_category NOT NULL,
  image_url text NOT NULL,
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create orders table
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  items jsonb NOT NULL,
  total decimal NOT NULL CHECK (total > 0),
  status order_status NOT NULL DEFAULT 'pending',
  payment_method payment_method,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create agricultural_inputs table
CREATE TABLE IF NOT EXISTS agricultural_inputs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL,
  price decimal NOT NULL CHECK (price > 0),
  category input_category NOT NULL,
  image_url text NOT NULL,
  stock integer NOT NULL CHECK (stock >= 0),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE agricultural_inputs ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can read their own profile"
  ON profiles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

-- Products policies
CREATE POLICY "Anyone can read approved products"
  ON products
  FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Farmers can read their own products"
  ON products
  FOR SELECT
  TO authenticated
  USING (farmer_id = auth.uid());

CREATE POLICY "Farmers can create products"
  ON products
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role = 'farmer'
    )
  );

CREATE POLICY "Farmers can update their own products"
  ON products
  FOR UPDATE
  TO authenticated
  USING (farmer_id = auth.uid());

CREATE POLICY "Farmers can delete their own products"
  ON products
  FOR DELETE
  TO authenticated
  USING (farmer_id = auth.uid());

-- Orders policies
CREATE POLICY "Users can read their own orders"
  ON orders
  FOR SELECT
  TO authenticated
  USING (buyer_id = auth.uid());

CREATE POLICY "Authenticated users can create orders"
  ON orders
  FOR INSERT
  TO authenticated
  WITH CHECK (buyer_id = auth.uid());

-- Agricultural inputs policies
CREATE POLICY "Anyone can read agricultural inputs"
  ON agricultural_inputs
  FOR SELECT
  TO authenticated
  USING (true);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_agricultural_inputs_updated_at
  BEFORE UPDATE ON agricultural_inputs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();