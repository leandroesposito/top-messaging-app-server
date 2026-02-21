const { initDatabase, endPool, runQuery } = require("./test-helpers");

const populateQuery = `
 -- 1. First, insert users (main user is ID 1)
  INSERT INTO users (username, password, friend_code, is_online) VALUES
  ('john_doe', 'hash123', 'JOHN123', true),      -- ID 1 (main user)
  ('mary_smith', 'hash456', 'MARY456', true),    -- ID 2
  ('peter_jones', 'hash789', 'PETER789', false), -- ID 3
  ('lisa_brown', 'hash101', 'LISA101', true);    -- ID 4

  -- 2. Create profiles for everyone
  INSERT INTO profiles (user_id, public_name, description) VALUES
  (1, 'John Doe', 'Main user'),
  (2, 'Mary Smith', 'Best friend'),
  (3, 'Peter Jones', 'Work colleague'),
  (4, 'Lisa Brown', 'Childhood friend');

  -- 3. Establish friendship relationships
  INSERT INTO friends (uid1, uid2) VALUES
  (1, 2), -- John and Mary are friends
  (1, 3), -- John and Peter are friends
  (1, 4); -- John and Lisa are friends

  -- 4. Insert private messages
  INSERT INTO private_messages (sender_user_id, receiver_user_id, created_at, body) VALUES
  -- Conversation with Mary (ID 2) - all read, recent
  (1, 2, '2026-02-19 09:00:00', 'Good morning Mary!'),
  (2, 1, '2026-02-19 09:05:00', 'Hi John! How are you?'),
  (1, 2, '2026-02-19 09:10:00', 'Doing great!'),
  (2, 1, '2026-02-19 09:15:00', 'Great!'),

  -- Conversation with Peter (ID 3) - unread messages from Peter
  (3, 1, '2026-02-19 14:00:00', 'John, did you finish the report?'),
  (3, 1, '2026-02-19 14:05:00', 'We need it by tomorrow'),
  (1, 3, '2026-02-19 13:55:00', 'Almost done!'), -- Earlier message

  -- Conversation with Lisa (ID 4) - old messages, already read
  (4, 1, '2026-02-10 18:00:00', 'Hey! Long time no see'),
  (1, 4, '2026-02-10 18:30:00', 'I know! We should catch up'),
  (4, 1, '2026-02-10 19:00:00', 'Definitely! Next week?');

  -- 5. Insert last seen records
  INSERT INTO last_seen_private_chat (uid1, uid2, last_seen) VALUES
  -- John viewed conversations with...
  (1, 2, '2026-02-19 09:20:00'), -- Saw everything with Mary
  (1, 3, '2026-02-19 14:00:00'), -- Saw up to before Peter's 14:05 message
  (1, 4, '2026-02-10 20:00:00'); -- Saw everything with Lisa
`;

const getQuery = `
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

describe("test users route", function () {
  beforeAll(async () => {
    await initDatabase();
    await runQuery(populateQuery);
  });
  afterAll(endPool);

  test("validate query result", async () => {
    const rows = await runQuery(getQuery, [1]);

    expect(rows).toHaveLength(3);

    expect(rows[0]).toEqual({
      id: 3,
      public_name: "Peter Jones",
      is_online: false,
      last_message_time: new Date("2026-02-19T14:05:00.000Z"),
      unread_count: "1",
    });

    expect(rows[1]).toEqual({
      id: 2,
      public_name: "Mary Smith",
      is_online: true,
      last_message_time: new Date("2026-02-19T09:15:00.000Z"),
      unread_count: "0",
    });

    //
    expect(rows[2]).toEqual({
      id: 4,
      public_name: "Lisa Brown",
      is_online: true,
      last_message_time: new Date("2026-02-10T19:00:00.000Z"),
      unread_count: "0",
    });

    expect(rows[0].unread_count).toBe("1");

    expect(rows[1].last_message_time).toBeDefined();
    expect(rows[1].last_message_time).not.toBeNull();

    rows.forEach((row) => {
      expect(typeof row.id).toBe("number");
      expect(typeof row.public_name).toBe("string");
      expect(typeof row.is_online).toBe("boolean");
      expect(row.last_message_time).toBeDefined();
      expect(row.unread_count).toBeDefined();
    });

    const expectedIds = [3, 2, 4];
    const actualIds = rows.map((row) => row.id);
    expect(actualIds).toEqual(expectedIds);
  });
});
