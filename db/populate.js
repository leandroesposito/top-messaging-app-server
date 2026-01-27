const { createClient } = require("./connection.js");
const { createTables } = require("./create-tables.js");
const { insertData } = require("./insert-data.js");

async function populate() {
  console.log("Connecting to database...");
  const client = await createClient();
  console.log("Creating tables...");
  await createTables(client);
  console.log("Inserting sample data...");
  await insertData(client);
  await client.end();
  console.log("Finish!");
}

populate();
