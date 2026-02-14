const express = require("express");
const { v4: uuidv4 } = require("uuid");
const pool = require("./db");
const startPublisher = require("./outboxPublisher");
const fs = require("fs");

const app = express();
app.use(express.json());

async function initDB() {
  const schema = fs.readFileSync("./schema.sql").toString();
  await pool.query(schema);
}

app.get("/health", (req, res) => res.send("OK"));

app.post("/api/products", async (req, res) => {
  const { name, category, price, stock } = req.body;

  const result = await pool.query(
    "INSERT INTO products(name, category, price, stock) VALUES($1,$2,$3,$4) RETURNING id",
    [name, category, price, stock]
  );

  res.status(201).json({ productId: result.rows[0].id });
});

app.post("/api/orders", async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const { customerId, items } = req.body;

    let total = 0;

    for (const item of items) {
      const product = await client.query(
        "SELECT stock FROM products WHERE id=$1",
        [item.productId]
      );
      if (product.rows[0].stock < item.quantity) {
        throw new Error("Insufficient stock");
      }
      total += item.price * item.quantity;

      await client.query(
        "UPDATE products SET stock = stock - $1 WHERE id=$2",
        [item.quantity, item.productId]
      );
    }

    const order = await client.query(
      "INSERT INTO orders(customer_id,total) VALUES($1,$2) RETURNING id",
      [customerId, total]
    );

    const orderId = order.rows[0].id;

    for (const item of items) {
      await client.query(
        "INSERT INTO order_items(order_id,product_id,quantity,price) VALUES($1,$2,$3,$4)",
        [orderId, item.productId, item.quantity, item.price]
      );
    }

    const event = {
      eventType: "OrderCreated",
      orderId,
      customerId,
      items,
      total,
      timestamp: new Date()
    };

    await client.query(
      "INSERT INTO outbox(id,topic,payload) VALUES($1,$2,$3)",
      [uuidv4(), "order-events", event]
    );

    await client.query("COMMIT");

    res.status(201).json({ orderId });

  } catch (err) {
    await client.query("ROLLBACK");
    res.status(400).json({ error: err.message });
  } finally {
    client.release();
  }
});

initDB().then(() => {
  startPublisher();
  app.listen(8080, () => console.log("Command Service running"));
});
