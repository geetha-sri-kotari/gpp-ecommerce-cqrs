const { Pool } = require("pg");

module.exports = new Pool({
  connectionString: process.env.READ_DATABASE_URL
});
