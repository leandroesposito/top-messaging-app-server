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

async function getPrivateChats(uid) {
  const query = `
    SELECT
        u.id,
        p.public_name,
        u.is_online,
        MAX(pm.created_at)  AT TIME ZONE 'UTC' as last_message_time,
        COALESCE((
            SELECT COUNT(*)
            FROM private_messages pm2
            LEFT JOIN last_seen_private_chat ls
                ON ls.uid1 = $1 AND ls.uid2 = pm2.sender_user_id
            WHERE pm2.receiver_user_id = $1
                AND pm2.sender_user_id = u.id
                AND pm2.created_at > COALESCE(ls.last_seen, '2000-01-01')
        ), 0) as unread_count
    FROM users u
    JOIN profiles p ON u.id = p.user_id
    LEFT JOIN friends f ON (u.id = f.uid1 AND f.uid2 = $1) OR (u.id = f.uid2 AND f.uid1 = $1)
    LEFT JOIN private_messages pm ON
        (pm.sender_user_id = u.id AND pm.receiver_user_id = $1) OR
        (pm.receiver_user_id = u.id AND pm.sender_user_id = $1)
    WHERE (f.uid1 IS NOT NULL OR pm.id IS NOT NULL) AND u.id != $1
    GROUP BY u.id, p.public_name, u.is_online
    ORDER BY MAX(pm.created_at) DESC NULLS LAST, unread_count DESC NULLS LAST;
  `;
  const params = [uid];

  const rows = await runQuery(query, params);
  return rows;
}

async function updatePrivateChatLastSeen(uid1, uid2, lastSeen) {
  const query = `
    INSERT INTO last_seen_private_chat (uid1, uid2, last_seen)
    VALUES ($1, $2, $3)
    ON CONFLICT (uid1, uid2)
    DO UPDATE SET last_seen = $3;
  `;
  const params = [uid1, uid2, lastSeen];

  await runQuery(query, params);
}

module.exports = {
  sendPrivateMessage,
  sendGroupMessage,
  getPrivateChat,
  getGroupChat,
  getPrivateChats,
  updatePrivateChatLastSeen,
};
