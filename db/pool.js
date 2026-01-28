require("dotenv").config();
const { Pool } = require("pg");

const pool = new Pool({ connectionString: process.env.DEV_DATABASE_URL });

module.exports = pool;
