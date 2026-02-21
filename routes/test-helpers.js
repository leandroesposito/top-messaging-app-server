const { createClient } = require("../db/connection.js");
const { createTables } = require("../db/create-tables.js");
const pool = require("../db/pool.js");

async function initDatabase() {
  const client = await createClient();
  await createTables(client);
  return client.end();
}

async function runQuery(query, params = []) {
  const result = await pool.query(query, params);

  return result.rows;
}

function endPool() {
  return pool.end();
}

function delay(time) {
  return new Promise((resolve) => {
    setTimeout(resolve, time);
  });
}

module.exports = {
  initDatabase,
  endPool,
  delay,
  runQuery,
};
