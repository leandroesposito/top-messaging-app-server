const { runQuery } = require("./query");

async function sendPrivateMessage(senderId, receiverId, createdAt, body) {
  const query = `
    INSERT INTO private_messages
      (sender_user_id, receiver_user_id, created_at, body)
    VALUES
      ($1, $2, $3, $4)
    RETURNING id;
  `;
  const params = [senderId, receiverId, createdAt, body];

  const result = await runQuery(query, params);

  return result[0].id;
}

async function sendGroupMessage(senderUserId, groupId, createdAt, body) {
  const query = `
    INSERT INTO group_messages
      (sender_user_id, group_id, created_at, body)
    VALUES
      ($1, $2, $3, $4)
    RETURNING id;
  `;
  const params = [senderUserId, groupId, createdAt, body];

  const result = await runQuery(query, params);

  return result[0].id;
}

async function getPrivateChat(uid1, uid2) {
  const query = `
    SELECT private_messages.id, sender_user_id, public_name, body, created_at
    FROM private_messages
    JOIN profiles
    ON private_messages.sender_user_id = profiles.user_id
    WHERE
      (sender_user_id = $1 AND receiver_user_id = $2) OR
      (sender_user_id = $2 AND receiver_user_id = $1)
    ORDER BY created_at;
  `;
  const params = [uid1, uid2];

  const messages = await runQuery(query, params);

  return messages;
}

async function getGroupChat(gid) {
  const query = `
    SELECT group_messages.id, sender_user_id, public_name, body, created_at
    FROM group_messages
    JOIN profiles
    ON group_messages.sender_user_id = profiles.user_id
    WHERE
      group_id = $1
    ORDER BY created_at;
  `;
  const params = [gid];

  const messages = await runQuery(query, params);

  return messages;
}

module.exports = {
  sendPrivateMessage,
  sendGroupMessage,
  getPrivateChat,
  getGroupChat,
};
