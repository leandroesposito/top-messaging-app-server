require("dotenv").config();
const { Client } = require("pg");

const connectionString =
  process.env.NODE_ENV === "test"
    ? process.env.TEST_DATABASE_URL
    : process.env.DEV_DATABASE_URL;

async function createClient() {
  const client = new Client({ connectionString: connectionString });
  await client.connect();
  return client;
}

module.exports = { createClient };
