require('dotenv').config();

/** @type { import("drizzle-kit").Config } */
module.exports = {
  schema: './db/schema.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.POSTGRES_URI,
  },
};
