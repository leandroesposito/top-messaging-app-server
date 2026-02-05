const { createClient } = require("../db/connection.js");
const { createTables } = require("../db/create-tables.js");
const pool = require("../db/pool.js");

async function initDatabase() {
  const client = await createClient();
  await createTables(client);
  return client.end();
}

function endPool() {
  return pool.end();
}

module.exports = {
  initDatabase,
  endPool,
};
