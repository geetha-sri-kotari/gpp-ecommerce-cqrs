const express = require("express");
const pool = require("./db");

const app = express();

app.get("/health", (req, res) => res.send("OK"));

app.get("/api/analytics/products/:id/sales", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM product_sales_view WHERE product_id=$1",
    [req.params.id]
  );
  res.json(result.rows[0] || {});
});

app.get("/api/analytics/customers/:id/lifetime-value", async (req, res) => {
  const result = await pool.query(
    "SELECT * FROM customer_ltv_view WHERE customer_id=$1",
    [req.params.id]
  );
  res.json(result.rows[0] || {});
});

app.get("/api/analytics/sync-status", async (req, res) => {
  const result = await pool.query("SELECT * FROM sync_status WHERE id=1");
  const ts = result.rows[0]?.last_processed_event_timestamp;
  const lag = ts ? (Date.now() - new Date(ts)) / 1000 : null;
  res.json({
    lastProcessedEventTimestamp: ts,
    lagSeconds: lag
  });
});

app.listen(8081, () => console.log("Query Service running"));
