const { createClient } = require("./connection.js");
const { createTables } = require("./create-tables.js");
const { insertData } = require("./insert-data.js");

async function populate() {
  const client = await createClient();
  await createTables(client);
  await insertData(client);
  client.end();
}

populate();
