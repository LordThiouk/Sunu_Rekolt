-- supabase/migrations/20250511015623_create_farmer_sales_summary_rpc.sql
-- This migration creates/replaces the get_farmer_sales_summary RPC function
-- with corrected logic to derive farmer sales through products and order_items.
-- Corrected to use 'price_at_time' from order_items.

CREATE OR REPLACE FUNCTION get_farmer_sales_summary(farmer_id_param uuid)
RETURNS TABLE (
    total_sales_value numeric,
    current_month_sales_value numeric
)
LANGUAGE sql
STABLE
AS $$
WITH farmer_product_order_items AS (
    -- Select order items for products belonging to the specified farmer
    SELECT
        oi.order_id,
        oi.quantity,
        oi.price_at_time, -- Corrected column name
        o.status as order_status,
        o.updated_at as order_updated_at -- Assuming this is when order status last changed
    FROM
        public.order_items oi
    JOIN
        public.products p ON oi.product_id = p.id
    JOIN
        public.orders o ON oi.order_id = o.id
    WHERE
        p.farmer_id = farmer_id_param
        AND o.status = 'received' -- Only consider items from orders that are 'received'
),
aggregated_sales AS (
    -- Calculate total value for each relevant order item
    SELECT
        fpoi.order_id, 
        fpoi.order_updated_at,
        (fpoi.quantity * fpoi.price_at_time) as item_total_value -- Corrected column name
    FROM
        farmer_product_order_items fpoi
)
SELECT
    COALESCE(SUM(ags.item_total_value), 0)::numeric AS total_sales_value,
    COALESCE(SUM(
        CASE
            WHEN date_trunc('month', ags.order_updated_at AT TIME ZONE 'utc') = date_trunc('month', CURRENT_TIMESTAMP AT TIME ZONE 'utc')
            THEN ags.item_total_value
            ELSE 0
        END
    ), 0)::numeric AS current_month_sales_value
FROM
    aggregated_sales ags;
$$;

COMMENT ON FUNCTION get_farmer_sales_summary(uuid) IS 'Calculates total sales and current month sales for a given farmer. Sales are based on items from "received" orders where the product belongs to the farmer using price_at_time. Current month is based on when the order (containing the item) was last updated (assumed to be when it was marked received).';
