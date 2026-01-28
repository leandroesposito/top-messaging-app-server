const pool = require("./pool");

async function runQuery(query, params = []) {
  const res = await pool.query(query, params);
  const rows = res.rows;

  return rows;
}

module.exports = { runQuery };
