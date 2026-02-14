const query = `
DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS users_groups;
DROP TABLE IF EXISTS group_messages;
DROP TABLE IF EXISTS friends;
DROP TABLE IF EXISTS private_messages;
DROP TABLE IF EXISTS profiles;
DROP TABLE IF EXISTS groups;
DROP TABLE IF EXISTS users;

CREATE TABLE IF NOT EXISTS users (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  friend_code TEXT UNIQUE,
  is_online BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS friends (
  uid1 INT REFERENCES users (id) ON DELETE CASCADE,
  uid2 INT REFERENCES users (id) ON DELETE CASCADE,
  CONSTRAINT uuid1_lessthan_uuid2 CHECK (uid1 < uid2),
  CONSTRAINT uid1_uid2 PRIMARY KEY (uid1, uid2)
);

CREATE TABLE IF NOT EXISTS profiles(
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  user_id INT UNIQUE REFERENCES users (id) ON DELETE CASCADE,
  public_name TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS private_messages (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  sender_user_id INT REFERENCES users (id) ON DELETE CASCADE,
  receiver_user_id INT REFERENCES users (id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL,
  body TEXT
);

CREATE TABLE IF NOT EXISTS groups (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  invite_code TEXT UNIQUE,
  name TEXT,
  description TEXT
);

CREATE TABLE IF NOT EXISTS users_groups (
  user_id INT REFERENCES users (id) ON DELETE CASCADE,
  group_id INT REFERENCES groups (id) ON DELETE CASCADE,
  is_owner BOOLEAN DEFAULT false,
  CONSTRAINT user_group PRIMARY KEY (user_id, group_id)
);

CREATE TABLE IF NOT EXISTS group_messages (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  sender_user_id INT REFERENCES users (id) ON DELETE CASCADE,
  group_id INT REFERENCES groups (id) ON DELETE CASCADE,
  created_at TIMESTAMP NOT NULL,
  body TEXT
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
  id INT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  token TEXT UNIQUE NOT NULL,
  user_id INT REFERENCES users (id) ON DELETE CASCADE
)

`;

async function createTables(client) {
  await client.query(query);
}

module.exports = { createTables };
