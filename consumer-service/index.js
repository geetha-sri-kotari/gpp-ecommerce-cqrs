const amqp = require("amqplib");
const { Pool } = require("pg");
const fs = require("fs");

const pool = new Pool({
  connectionString: process.env.READ_DATABASE_URL,
});

async function initDB() {
  const schema = fs.readFileSync("./schema.sql").toString();
  await pool.query(schema);
}

async function startConsumer() {
  const conn = await amqp.connect(process.env.BROKER_URL);
  const channel = await conn.createChannel();
  await channel.assertQueue("order-events", { durable: true });

  channel.consume("order-events", async (msg) => {
    const event = JSON.parse(msg.content.toString());

    const exists = await pool.query(
      "SELECT 1 FROM processed_events WHERE event_id=$1",
      [event.orderId]
    );

    if (exists.rowCount > 0) {
      channel.ack(msg);
      return;
    }

    for (const item of event.items) {
      await pool.query(`
        INSERT INTO product_sales_view(product_id,total_quantity_sold,total_revenue,order_count)
        VALUES($1,$2,$3,1)
        ON CONFLICT(product_id)
        DO UPDATE SET
          total_quantity_sold = product_sales_view.total_quantity_sold + $2,
          total_revenue = product_sales_view.total_revenue + $3,
          order_count = product_sales_view.order_count + 1
      `, [item.productId, item.quantity, item.price * item.quantity]);
    }

    await pool.query(`
      INSERT INTO customer_ltv_view(customer_id,total_spent,order_count,last_order_date)
      VALUES($1,$2,1,NOW())
      ON CONFLICT(customer_id)
      DO UPDATE SET
        total_spent = customer_ltv_view.total_spent + $2,
        order_count = customer_ltv_view.order_count + 1,
        last_order_date = NOW()
    `, [event.customerId, event.total]);

    await pool.query(
      "INSERT INTO processed_events(event_id) VALUES($1)",
      [event.orderId]
    );

    await pool.query(
      "UPDATE sync_status SET last_processed_event_timestamp = NOW() WHERE id=1"
    );

    channel.ack(msg);

  }, { noAck: false });
}

initDB().then(startConsumer);
