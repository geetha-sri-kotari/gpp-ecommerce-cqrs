const amqp = require("amqplib");
const pool = require("./db");

async function connectWithRetry() {
  while (true) {
    try {
      console.log("Connecting to RabbitMQ...");
      const conn = await amqp.connect(process.env.BROKER_URL);
      console.log("Connected to RabbitMQ");
      return conn;
    } catch (err) {
      console.log("RabbitMQ not ready, retrying in 5 seconds...");
      await new Promise(res => setTimeout(res, 5000));
    }
  }
}

async function startPublisher() {
  const conn = await connectWithRetry();
  const channel = await conn.createChannel();

  await channel.assertQueue("order-events", { durable: true });

  setInterval(async () => {
    try {
      const res = await pool.query(
        "SELECT * FROM outbox WHERE published_at IS NULL LIMIT 10"
      );

      for (const row of res.rows) {
        channel.sendToQueue(
          row.topic,
          Buffer.from(JSON.stringify(row.payload)),
          { persistent: true }
        );

        await pool.query(
          "UPDATE outbox SET published_at = NOW() WHERE id = $1",
          [row.id]
        );
      }
    } catch (err) {
      console.error("Publisher error:", err.message);
    }
  }, 3000);
}

module.exports = startPublisher;
