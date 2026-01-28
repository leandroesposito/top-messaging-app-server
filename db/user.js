const crypto = require("node:crypto");
const { runQuery } = require("./query");

async function generateFriendCode() {
  const query = "SELECT friend_code FROM users WHERE friend_code = $1;";
  while (true) {
    const friendCode = crypto.randomBytes(5).toString("hex");

    const duplicates = await runQuery(query, [friendCode]);

    if (duplicates.length == 0) {
      return friendCode;
    }
  }
}

async function createUser(username, password) {
  let friendCode = await generateFriendCode();
  const query = `
    INSERT INTO users (username, password, friend_code) VALUES
      ($1, $2, $3)
    RETURNING id
  `;
  const params = [username, password, friendCode];

  const userId = await runQuery(query, params);
  return userId;
}

module.exports = { createUser };
