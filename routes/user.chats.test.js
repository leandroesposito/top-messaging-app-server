const { signUpRouter } = require("./sign-up");
const { logInRouter } = require("./log-in");
const { messagesRouter } = require("./messages");

const request = require("supertest");
const passport = require("passport");
const jwtStratety = require("../auth/jwt-strategy");

const express = require("express");
const { initDatabase, endPool, runQuery } = require("./test-helpers");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use("/sign-up", signUpRouter);
app.use("/log-in", logInRouter);
app.use("/messages", messagesRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
passport.use(jwtStratety);

const populateQuery = `
 -- 1. First, insert users (main user is ID 1)
  INSERT INTO users (username, password, friend_code, is_online) VALUES
  ('mary_smith', 'hash456', 'MARY456', true),    -- ID 2
  ('peter_jones', 'hash789', 'PETER789', false), -- ID 3
  ('lisa_brown', 'hash101', 'LISA101', true);    -- ID 4

  -- 2. Create profiles for everyone
  INSERT INTO profiles (user_id, public_name, description) VALUES
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

describe("test users route", function () {
  let login;
  beforeAll(async () => {
    await initDatabase();

    await request(app).post("/sign-up").type("form").send({
      username: "john_doe",
      password: "hash1234",
      "confirm-password": "hash1234",
    });

    login = await request(app).post("/log-in").type("form").send({
      username: "john_doe",
      password: "hash1234",
    });

    await runQuery(populateQuery);
  });
  afterAll(endPool);

  test("validate query result", async () => {
    const getPrivateChatsResponse = await request(app)
      .get(`/messages`)
      .set("Authorization", "bearer " + login.body.accessToken);

    const rows = getPrivateChatsResponse.body.privateChats;

    expect(rows).toHaveLength(3);

    expect(rows[0]).toEqual({
      id: 3,
      publicName: "Peter Jones",
      isOnline: false,
      lastMessageTime: "2026-02-19T14:05:00.000Z",
      unreadCount: "1",
    });

    expect(rows[1]).toEqual({
      id: 2,
      publicName: "Mary Smith",
      isOnline: true,
      lastMessageTime: "2026-02-19T09:15:00.000Z",
      unreadCount: "0",
    });

    //
    expect(rows[2]).toEqual({
      id: 4,
      publicName: "Lisa Brown",
      isOnline: true,
      lastMessageTime: "2026-02-10T19:00:00.000Z",
      unreadCount: "0",
    });

    expect(rows[0].unreadCount).toBe("1");

    expect(rows[1].lastMessageTime).toBeDefined();
    expect(rows[1].lastMessageTime).not.toBeNull();

    rows.forEach((row) => {
      expect(typeof row.id).toBe("number");
      expect(typeof row.publicName).toBe("string");
      expect(typeof row.isOnline).toBe("boolean");
      expect(row.lastMessageTime).toBeDefined();
      expect(row.unreadCount).toBeDefined();
    });

    const expectedIds = [3, 2, 4];
    const actualIds = rows.map((row) => row.id);
    expect(actualIds).toEqual(expectedIds);
  });
});
