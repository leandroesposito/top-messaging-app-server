const { signUpRouter } = require("./sign-up");
const { logInRouter } = require("./log-in");
const { groupRouter } = require("./group");

const request = require("supertest");
const passport = require("passport");
const jwtStratety = require("../auth/jwt-strategy");

const express = require("express");
const { initDatabase, endPool, runQuery } = require("./test-helpers");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use("/sign-up", signUpRouter);
app.use("/log-in", logInRouter);
app.use("/groups", groupRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
passport.use(jwtStratety);

const populateQuery = `
  -- 1. First, insert users (including control user)
  INSERT INTO users (username, password, friend_code, is_online) VALUES
  ('mary_smith', 'hash456', 'MARY456', true),    -- ID 2
  ('peter_jones', 'hash789', 'PETER789', false), -- ID 3
  ('lisa_brown', 'hash101', 'LISA101', true),    -- ID 4
  ('tom_wilson', 'hash102', 'TOM102', false),    -- ID 5
  ('amy_adams', 'hash103', 'AMY103', true);      -- ID 6

  -- 2. Create profiles
  INSERT INTO profiles (user_id, public_name, description) VALUES
  (2, 'Mary Smith', 'Active member'),
  (3, 'Peter Jones', 'Occasional member'),
  (4, 'Lisa Brown', 'Group admin'),
  (5, 'Tom Wilson', 'New member'),
  (6, 'Amy Adams', 'Lurker');

  -- 3. Create groups
  INSERT INTO groups (invite_code, name, description) VALUES
  ('FAMILY123', 'Family Group', 'Family discussions'),                    -- ID 1
  ('WORK456', 'Work Team', 'Work related chat'),                          -- ID 2
  ('FRIENDS789', 'Friend Circle', 'Close friends group'),                 -- ID 3
  ('HOBBY101', 'Hobby Club', 'Weekend activities');                       -- ID 4 (John is NOT a member)

  -- 4. Add users to groups (users_groups)
  INSERT INTO users_groups (user_id, group_id, is_owner, last_seen) VALUES
  -- Family Group (ID 1)
  (1, 1, false, '2026-02-19 10:15:00'), -- John (control user)
  (2, 1, false, '2026-02-19 10:00:00'), -- Mary
  (4, 1, true, '2026-02-19 15:00:00'),  -- Lisa (owner)

  -- Work Team (ID 2)
  (1, 2, false, '2026-02-19 09:00:00'), -- John (control user)
  (3, 2, true, '2026-02-18 14:00:00'),  -- Peter (owner)
  (5, 2, false, '2026-02-17 11:00:00'), -- Tom

  -- Friend Circle (ID 3)
  (1, 3, true, '2026-02-19 12:00:00'),  -- John (control user, owner)
  (2, 3, false, '2026-02-18 18:00:00'), -- Mary
  (6, 3, false, '2026-02-10 09:00:00'), -- Amy

  -- Hobby Club (ID 4) - John is NOT a member
  (2, 4, false, '2026-02-19 08:00:00'), -- Mary
  (3, 4, true, '2026-02-18 22:00:00'),  -- Peter (owner)
  (4, 4, false, '2026-02-17 16:00:00'); -- Lisa

  -- 5. Insert group messages
  INSERT INTO group_messages (sender_user_id, group_id, created_at, body) VALUES
  -- Family Group (ID 1) - Multiple new messages
  (2, 1, '2026-02-19 08:00:00', 'Good morning everyone!'),
  (4, 1, '2026-02-19 09:30:00', 'Who is coming to dinner?'),
  (2, 1, '2026-02-19 10:15:00', 'I will be there!'),
  (4, 1, '2026-02-19 11:00:00', 'Great! Bring some wine'),
  (1, 1, '2026-02-19 11:30:00', 'Count me in too'),
  (2, 1, '2026-02-19 14:00:00', 'What time should we arrive?'), -- New message after John's last_seen

  -- Work Team (ID 2) - Some new messages
  (3, 2, '2026-02-18 10:00:00', 'Meeting at 3 PM'),
  (1, 2, '2026-02-18 11:00:00', 'I will prepare the presentation'),
  (5, 2, '2026-02-18 15:00:00', 'Meeting started'),
  (3, 2, '2026-02-19 08:30:00', 'Good job yesterday!'), -- New message after John's last_seen
  (5, 2, '2026-02-19 09:30:00', 'Thanks everyone'),      -- New message after John's last_seen
  (3, 2, '2026-02-19 10:00:00', 'Next meeting on Friday'), -- New message

  -- Friend Circle (ID 3) - No new messages since John's last_seen
  (2, 3, '2026-02-18 17:00:00', 'Anyone up for movies?'),
  (6, 3, '2026-02-18 17:30:00', 'I am!'),
  (2, 3, '2026-02-18 18:00:00', 'Great, 8 PM at cinema'),
  (1, 3, '2026-02-18 18:30:00', 'See you there'),

  -- Hobby Club (ID 4) - John is NOT a member, but adding messages anyway
  (3, 4, '2026-02-19 09:00:00', 'Hiking this weekend?'),
  (2, 4, '2026-02-19 10:00:00', 'Yes, count me in'),
  (4, 4, '2026-02-19 11:00:00', 'What trail?');
`;

describe("test get groups query", function () {
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

  describe("general get group query", () => {
    test("should return groups ordered by new messages and last message time", async () => {
      const getGroupsResponse = await request(app)
        .get(`/groups`)
        .set("Authorization", "bearer " + login.body.accessToken);

      const rows = getGroupsResponse.body.groups;

      // Test 1: Should return 3 groups (John is in groups 1, 2, 3 only)
      expect(rows).toHaveLength(3);

      // Test 2: Family Group should be FIRST (3 new messages)
      expect(rows[0]).toEqual({
        id: 1,
        name: "Family Group",
        inviteCode: "FAMILY123",
        newMessages: "3",
        lastMessageTime: "2026-02-19T14:00:00.000Z",
      });

      // Test 3: Work Team should be SECOND (2 new messages)
      expect(rows[1]).toEqual({
        id: 2,
        name: "Work Team",
        inviteCode: "WORK456",
        newMessages: "2",
        lastMessageTime: "2026-02-19T10:00:00.000Z",
      });

      // Test 4: Friend Circle should be THIRD (0 new messages)
      expect(rows[2]).toEqual({
        id: 3,
        name: "Friend Circle",
        inviteCode: "FRIENDS789",
        newMessages: "0",
        lastMessageTime: "2026-02-18T18:30:00.000Z",
      });

      // Test 5: Verify Hobby Club is NOT included (John not a member)
      const hobbyGroup = rows.find((row) => row.id === 4);
      expect(hobbyGroup).toBeUndefined();

      // Test 6: Verify order by newMessages DESC
      expect(parseInt(rows[0].newMessages)).toBe(3);
      expect(parseInt(rows[1].newMessages)).toBe(2);
      expect(parseInt(rows[2].newMessages)).toBe(0);
    });
  });

  describe("Group chats detailed tests", () => {
    let rows;
    beforeAll(async () => {
      const getGroupsResponse = await request(app)
        .get(`/groups`)
        .set("Authorization", "bearer " + login.body.accessToken);

      rows = getGroupsResponse.body.groups;
    });

    test("should return correct number of groups", () => {
      expect(rows).toHaveLength(3);
    });

    test("Work Team should have correct properties", () => {
      const workTeam = rows[1];
      expect(workTeam.id).toBe(2);
      expect(workTeam.name).toBe("Work Team");
      expect(workTeam.inviteCode).toBe("WORK456");
      expect(parseInt(workTeam.newMessages)).toBe(2);

      // Verify new messages count matches
      const lastSeen = "2026-02-19T09:00:00.000Z"; // John's last_seen for Work Team
      const messagesAfter =
        new Date(workTeam.lastMessageTime) > new Date(lastSeen);
      expect(messagesAfter).toBe(true);
    });

    test("Family Group should have correct new messages count", () => {
      const familyGroup = rows[0];
      expect(familyGroup.id).toBe(1);
      expect(parseInt(familyGroup.newMessages)).toBe(3);

      // Verify the new message is from Mary at 14:00
      const messages = [{ time: "2026-02-19T14:00:00.000Z", sender: "Mary" }];
      const lastSeen = "2026-02-18T20:00:00.000Z"; // John's last_seen
      const newMessages = messages.filter(
        (m) => new Date(m.time) > new Date(lastSeen),
      );
      expect(newMessages).toHaveLength(1);
    });

    test("Friend Circle should have zero new messages", () => {
      const friendCircle = rows[2];
      expect(friendCircle.id).toBe(3);
      expect(parseInt(friendCircle.newMessages)).toBe(0);

      // Verify all messages are before John's last_seen
      const lastSeen = "2026-02-19T12:00:00.000Z"; // John's last_seen for Friend Circle
      expect(new Date(rows[2].lastMessageTime) < new Date(lastSeen)).toBe(true);
    });

    test("Hobby Club should not be in results", () => {
      const hobbyGroup = rows.find((row) => row.id === 4);
      expect(hobbyGroup).toBeUndefined();
    });

    test("all groups should have required fields", () => {
      rows.forEach((group) => {
        expect(group).toHaveProperty("id");
        expect(group).toHaveProperty("name");
        expect(group).toHaveProperty("inviteCode");
        expect(group).toHaveProperty("newMessages");
        expect(group).toHaveProperty("lastMessageTime");

        expect(typeof group.id).toBe("number");
        expect(typeof group.name).toBe("string");
        expect(typeof group.inviteCode).toBe("string");
        expect(group.lastMessageTime).toBeDefined();
      });
    });
  });
});
