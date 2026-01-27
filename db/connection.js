require("dotenv").config();
const { Client } = require("pg");

async function createClient() {
  const client = new Client({ connectionString: process.env.DEV_DATABASE_URL });
  await client.connect();
  return client;
}

module.exports = { createClient };
