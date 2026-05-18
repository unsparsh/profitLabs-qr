// const postgres = require("postgres");

// const connectionString = process.env.POSTGRES_URI;
// const sql = postgres(connectionString);

// module.exports = sql;

const pg = require('pg');
const { drizzle } = require('drizzle-orm/node-postgres');

const client = new pg.Client({
  connectionString: process.env.POSTGRES_URI,
});

// Initialize database connection (run once at startup)
async function initDatabase() {
  await client.connect();
  console.log('✅ PostgreSQL connected');
}

// Create drizzle instance for database operations
const db = drizzle(client);

module.exports = {
  db,
  initDatabase,
  client,
};