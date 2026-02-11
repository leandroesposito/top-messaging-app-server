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

  const newUser = await runQuery(query, params);
  return newUser[0].id;
}

async function usernameExists(username) {
  const query = `SELECT username FROM users where username = $1`;
  const params = [username];

  const res = await runQuery(query, params);
  return res.length > 0;
}

async function getUserByUsername(username) {
  const query = `
    SELECT u.id, u.username, u.password, u.friend_code, p.public_name
    FROM users u
    JOIN profiles p
    ON u.id = p.user_id
    WHERE username = $1`;
  const params = [username];

  const res = await runQuery(query, params);
  return res[0];
}

async function getUserById(id) {
  const query = `SELECT id, username, friend_code, is_online FROM users WHERE id = $1`;
  const params = [id];

  const res = await runQuery(query, params);
  return res[0];
}

async function getUserByFriendCode(friendCode) {
  const query = `
    SELECT u.id, u.username, p.public_name
    FROM users u
    JOIN profiles p
    ON u.id = p.user_id
    WHERE u.friend_code = $1`;
  const params = [friendCode];

  const res = await runQuery(query, params);
  return res[0];
}

async function getUserFriendsById(id) {
  const query = `
    SELECT u.id, p.public_name, u.is_online
    FROM friends f
    JOIN users u
      ON f.uid1 = u.id
        OR f.uid2 = u.id
    JOIN profiles p
      ON u.id = p.user_id
    WHERE (f.uid1 = $1 OR f.uid2 = $1)
      AND u.id != $1;
    `;
  const params = [id];

  const res = await runQuery(query, params);
  return res;
}

module.exports = {
  createUser,
  usernameExists,
  getUserByUsername,
  getUserById,
  getUserFriendsById,
  getUserByFriendCode,
};
