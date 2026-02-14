CREATE TABLE IF NOT EXISTS product_sales_view (
  product_id INT PRIMARY KEY,
  total_quantity_sold INT DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0,
  order_count INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS category_metrics_view (
  category_name TEXT PRIMARY KEY,
  total_revenue NUMERIC DEFAULT 0,
  total_orders INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS customer_ltv_view (
  customer_id INT PRIMARY KEY,
  total_spent NUMERIC DEFAULT 0,
  order_count INT DEFAULT 0,
  last_order_date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS hourly_sales_view (
  hour TIMESTAMP PRIMARY KEY,
  total_orders INT DEFAULT 0,
  total_revenue NUMERIC DEFAULT 0
);

CREATE TABLE IF NOT EXISTS processed_events (
  event_id TEXT PRIMARY KEY,
  processed_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sync_status (
  id INT PRIMARY KEY DEFAULT 1,
  last_processed_event_timestamp TIMESTAMP
);

INSERT INTO sync_status(id) VALUES(1)
ON CONFLICT DO NOTHING;
