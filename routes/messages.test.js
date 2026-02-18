const { signUpRouter } = require("./sign-up");
const { logInRouter } = require("./log-in");
const { messagesRouter } = require("./messages");
const { groupRouter } = require("./group");

const passport = require("passport");
const jwtStratety = require("../auth/jwt-strategy");

const request = require("supertest");
const express = require("express");
const { initDatabase, endPool, delay } = require("./test-helpers");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use("/sign-up", signUpRouter);
app.use("/log-in", logInRouter);
app.use("/messages", messagesRouter);
app.use("/groups", groupRouter);

passport.use(jwtStratety);

describe("test messages routes", function () {
  const logins = [];
  let accessToken;
  beforeAll(async () => {
    await initDatabase();

    for (let i = 1; i < 5; i++) {
      await request(app)
        .post("/sign-up")
        .type("form")
        .send({
          username: `user${i}`,
          password: `password${i}`,
          "confirm-password": `password${i}`,
        });

      const loginResponse = await request(app)
        .post("/log-in")
        .type("form")
        .send({
          username: `user${i}`,
          password: `password${i}`,
        });

      if (i == 1) {
        accessToken = loginResponse.body.accessToken;
      }

      logins.push(loginResponse.body);
    }
  });
  afterAll(endPool);

  describe("send private message", () => {
    test("missing token", () => {
      return request(app)
        .post(`/messages/${logins[1].id}`)
        .then((response) => {
          expect(response.status).toEqual(401);
          expect(response.body.errors[0]).toEqual("invalid token");
        });
    });

    test("invalid user id", () => {
      return request(app)
        .post(`/messages/111111`)
        .set("Authorization", `bearer ${accessToken}`)
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual("User not found");
        });
    });

    test("no message body", () => {
      return request(app)
        .post(`/messages/${logins[1].id}`)
        .set("Authorization", `bearer ${accessToken}`)
        .type("form")
        .send({})
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            "body is required as message content",
          );
        });
    });

    test("short message body", () => {
      return request(app)
        .post(`/messages/${logins[1].id}`)
        .set("Authorization", `bearer ${accessToken}`)
        .type("form")
        .send({ body: " " })
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            "body can't be empty and max length is 2000 characters",
          );
        });
    });

    test("long message body", () => {
      return request(app)
        .post(`/messages/${logins[1].id}`)
        .set("Authorization", `bearer ${accessToken}`)
        .type("form")
        .send({ body: "a".repeat(2001) })
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            "body can't be empty and max length is 2000 characters",
          );
        });
    });

    test("send message", () => {
      return request(app)
        .post(`/messages/${logins[1].id}`)
        .set("Authorization", `bearer ${accessToken}`)
        .type("form")
        .send({ body: "a".repeat(2000) })
        .then((response) => {
          expect(response.status).toEqual(200);
          expect(response.body.message).toEqual("success");
        });
    });
  });

  describe("get private messages", () => {
    beforeAll(async () => {
      await request(app)
        .post(`/messages/${logins[2].id}`)
        .set("Authorization", `bearer ${logins[1].accessToken}`)
        .type("form")
        .send({ body: "1" });
      await request(app)
        .post(`/messages/${logins[1].id}`)
        .set("Authorization", `bearer ${logins[2].accessToken}`)
        .type("form")
        .send({ body: "2" });
      await request(app)
        .post(`/messages/${logins[2].id}`)
        .set("Authorization", `bearer ${logins[1].accessToken}`)
        .type("form")
        .send({ body: "3" });
      await request(app)
        .post(`/messages/${logins[1].id}`)
        .set("Authorization", `bearer ${logins[2].accessToken}`)
        .type("form")
        .send({ body: "4" });
    });

    test("missing token", () => {
      return request(app)
        .get(`/messages/${logins[1].id}`)
        .then((response) => {
          expect(response.status).toEqual(401);
          expect(response.body.errors[0]).toEqual("invalid token");
        });
    });

    test("invalid user id", () => {
      return request(app)
        .get(`/messages/111111`)
        .set("Authorization", `bearer ${logins[1].accessToken}`)
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual("User not found");
        });
    });

    test("get private messages", () => {
      return request(app)
        .get(`/messages/${logins[2].id}`)
        .set("Authorization", `bearer ${logins[1].accessToken}`)
        .then((response) => {
          expect(response.status).toEqual(200);
          expect(response.body.messages).toBeDefined();
          expect(response.body.messages.length).toEqual(4);
          expect(response.body.messages[0].userId).toEqual(logins[1].id);
          expect(response.body.messages[0].body).toEqual("1");
          expect(response.body.messages[0].publicName).toEqual("user2");
          expect(response.body.messages[1].userId).toEqual(logins[2].id);
          expect(response.body.messages[1].body).toEqual("2");
          expect(response.body.messages[1].publicName).toEqual("user3");
          expect(response.body.messages[2].userId).toEqual(logins[1].id);
          expect(response.body.messages[2].body).toEqual("3");
          expect(response.body.messages[3].userId).toEqual(logins[2].id);
          expect(response.body.messages[3].body).toEqual("4");
        });
    });
  });

  describe("send group messages", () => {
    beforeAll(async () => {
      // Create 2 groups with user [0] and [1]
      // first group users: [0, 1, 2]
      // reference group users: [1]
      const a = await request(app)
        .post(`/groups/`)
        .set("Authorization", `bearer ${logins[0].accessToken}`)
        .type("form")
        .send({
          name: "the group",
          description: "the description",
        });

      await request(app)
        .post(`/groups/`)
        .set("Authorization", `bearer ${logins[1].accessToken}`)
        .type("form")
        .send({
          name: "reference group",
          description: "the description",
        });

      const TheGroupInfo = await request(app)
        .get(`/groups/1`)
        .set("Authorization", `bearer ${logins[0].accessToken}`);

      await request(app)
        .post(`/groups/join/${TheGroupInfo.body.group.inviteCode}`)
        .set("Authorization", `bearer ${logins[1].accessToken}`);
      await request(app)
        .post(`/groups/join/${TheGroupInfo.body.group.inviteCode}`)
        .set("Authorization", `bearer ${logins[2].accessToken}`);
    });

    test("missing token", () => {
      return request(app)
        .post(`/groups/1/messages`)
        .then((response) => {
          expect(response.status).toEqual(401);
          expect(response.body.errors[0]).toEqual("invalid token");
        });
    });

    test("invalid group id", () => {
      return request(app)
        .post(`/groups/11111/messages`)
        .set("Authorization", `bearer ${logins[0].accessToken}`)
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual("Group not found");
        });
    });

    test("no message body", () => {
      return request(app)
        .post(`/groups/1/messages`)
        .set("Authorization", `bearer ${logins[0].accessToken}`)
        .type("form")
        .send({})
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            "body is required as message content",
          );
        });
    });

    test("short message body", () => {
      return request(app)
        .post(`/groups/1/messages`)
        .set("Authorization", `bearer ${logins[0].accessToken}`)
        .type("form")
        .send({ body: " " })
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            "body can't be empty and max length is 2000 characters",
          );
        });
    });

    test("long message body", () => {
      return request(app)
        .post(`/groups/1/messages`)
        .set("Authorization", `bearer ${logins[0].accessToken}`)
        .type("form")
        .send({ body: "a".repeat(2001) })
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            "body can't be empty and max length is 2000 characters",
          );
        });
    });

    test("send message to a group you are not part of", () => {
      const name = "reference group";
      return request(app)
        .post(`/groups/2/messages`)
        .set("Authorization", `bearer ${logins[0].accessToken}`)
        .type("form")
        .send({ body: "a".repeat(2000) })
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            `You are not part of the group ${name}`,
          );
          expect(response.body.errors.length).toEqual(1);
        });
    });

    test("send private message", () => {
      return request(app)
        .post(`/groups/1/messages`)
        .set("Authorization", `bearer ${logins[0].accessToken}`)
        .type("form")
        .send({ body: "a".repeat(2000) })
        .then((response) => {
          expect(response.status).toEqual(200);
          expect(response.body.message).toEqual("success");
        });
    });
  });

  describe("get group messages", () => {
    beforeAll(async () => {
      await request(app)
        .post(`/groups/1/messages`)
        .set("Authorization", `bearer ${logins[0].accessToken}`)
        .type("form")
        .send({ body: "1" });

      await delay(100);
      await request(app)
        .post(`/groups/1/messages`)
        .set("Authorization", `bearer ${logins[1].accessToken}`)
        .type("form")
        .send({ body: "2" });

      await delay(100);
      await request(app)
        .post(`/groups/1/messages`)
        .set("Authorization", `bearer ${logins[2].accessToken}`)
        .type("form")
        .send({ body: "3" });

      await delay(100);
    });

    test("missing token", () => {
      return request(app)
        .get(`/groups/1/messages`)
        .then((response) => {
          expect(response.status).toEqual(401);
          expect(response.body.errors[0]).toEqual("invalid token");
        });
    });

    test("invalid group id", () => {
      return request(app)
        .get(`/groups/11111/messages`)
        .set("Authorization", `bearer ${logins[0].accessToken}`)
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual("Group not found");
        });
    });

    test("get messages from a group you are not part of", () => {
      const name = "reference group";
      return request(app)
        .get(`/groups/2/messages`)
        .set("Authorization", `bearer ${logins[0].accessToken}`)
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            `You are not part of the group ${name}`,
          );
          expect(response.body.errors.length).toEqual(1);
        });
    });

    test("get group messages", async () => {
      const firstUserResponse = await request(app)
        .get(`/groups/1/messages`)
        .set("Authorization", `bearer ${logins[0].accessToken}`)
        .type("form");
      const secondUserResponse = await request(app)
        .get(`/groups/1/messages`)
        .set("Authorization", `bearer ${logins[1].accessToken}`)
        .type("form");
      const thirdUserResponse = await request(app)
        .get(`/groups/1/messages`)
        .set("Authorization", `bearer ${logins[2].accessToken}`)
        .type("form");

      expect(firstUserResponse.body).toEqual(secondUserResponse.body);
      expect(firstUserResponse.body).toEqual(thirdUserResponse.body);

      const referenceGroupResponse = await request(app)
        .get(`/groups/2/messages`)
        .set("Authorization", `bearer ${logins[1].accessToken}`)
        .type("form");

      expect(referenceGroupResponse.body.messages).toEqual([]);
    });
  });
});
