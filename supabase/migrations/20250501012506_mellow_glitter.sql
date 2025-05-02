/*
  # Add order tracking fields

  1. Changes
    - Add order_items table to track individual items in orders
    - Add indexes for better query performance
    - Add functions for calculating sales statistics
*/

-- Create order_items table for better tracking
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id) ON DELETE SET NULL,
  farmer_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  price_at_time decimal NOT NULL CHECK (price_at_time > 0),
  created_at timestamptz DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_items_farmer_id ON order_items(farmer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);

-- Enable RLS on order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for order_items
CREATE POLICY "Farmers can view their own order items"
  ON order_items
  FOR SELECT
  TO authenticated
  USING (farmer_id = auth.uid());

-- Function to get monthly sales for a farmer
CREATE OR REPLACE FUNCTION get_farmer_monthly_sales(farmer_id uuid, start_date timestamptz)
RETURNS TABLE (
  month date,
  total_orders bigint,
  total_items bigint,
  total_revenue decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    date_trunc('month', o.created_at)::date as month,
    COUNT(DISTINCT o.id) as total_orders,
    SUM(oi.quantity) as total_items,
    SUM(oi.quantity * oi.price_at_time) as total_revenue
  FROM orders o
  JOIN order_items oi ON o.id = oi.order_id
  WHERE oi.farmer_id = get_farmer_monthly_sales.farmer_id
    AND o.created_at >= start_date
    AND o.status = 'paid'
  GROUP BY date_trunc('month', o.created_at)
  ORDER BY month DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get top products for a farmer
CREATE OR REPLACE FUNCTION get_farmer_top_products(farmer_id uuid, limit_count integer DEFAULT 5)
RETURNS TABLE (
  product_id uuid,
  product_name text,
  total_quantity bigint,
  total_revenue decimal
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as product_id,
    p.name as product_name,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.quantity * oi.price_at_time) as total_revenue
  FROM order_items oi
  JOIN products p ON oi.product_id = p.id
  JOIN orders o ON oi.order_id = o.id
  WHERE oi.farmer_id = get_farmer_top_products.farmer_id
    AND o.status = 'paid'
  GROUP BY p.id, p.name
  ORDER BY total_quantity DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;