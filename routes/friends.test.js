const { signUpRouter } = require("./sign-up");
const { logInRouter } = require("./log-in");
const { friendsRouter } = require("./friends");

const passport = require("passport");
const jwtStratety = require("../auth/jwt-strategy");

const request = require("supertest");
const express = require("express");
const { initDatabase, endPool, delay } = require("./test-helpers");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use("/sign-up", signUpRouter);
app.use("/log-in", logInRouter);
app.use("/friends", friendsRouter);
passport.use(jwtStratety);

describe("test friends route", function () {
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

  describe("Add friend", () => {
    test("missing token", () => {
      return request(app)
        .post(`/friends/${logins[1].friendCode}`)
        .then((response) => {
          expect(response.status).toEqual(401);
          expect(response.body.errors[0]).toEqual("invalid token");
        });
    });

    test("invalid friend code", () => {
      return request(app)
        .post(`/friends/11111111111111111111111111111111111111111111111`)
        .set("Authorization", `bearer ${accessToken}`)
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual("User not found");
        });
    });

    test("add yourself as friend", () => {
      return request(app)
        .post(`/friends/${logins[0].friendCode}`)
        .set("Authorization", `bearer ${accessToken}`)
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            "You can't add yourself as a friend",
          );
        });
    });

    test("add friend", async () => {
      await request(app)
        .post(`/friends/${logins[1].friendCode}`)
        .set("Authorization", `bearer ${accessToken}`)
        .then((response) => {
          expect(response.status).toEqual(200);
          expect(response.body.message).toEqual(
            `${logins[1].publicName} added as a friend succesfully.`,
          );
        });

      await request(app)
        .post(`/friends/${logins[2].friendCode}`)
        .set("Authorization", `bearer ${accessToken}`)
        .then((response) => {
          expect(response.status).toEqual(200);
          expect(response.body.message).toEqual(
            `${logins[2].publicName} added as a friend succesfully.`,
          );
        });
    });

    test("add friend as a friend", async () => {
      const user2PublicName = logins[1].publicName;

      return request(app)
        .post(`/friends/${logins[1].friendCode}`)
        .set("Authorization", `bearer ${accessToken}`)
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            `You are already friend with ${user2PublicName}`,
          );
        });
    });
  });

  describe("get friends", function () {
    test("missing token", () => {
      return request(app)
        .get(`/friends/`)
        .then((response) => {
          expect(response.status).toEqual(401);
          expect(response.body.errors[0]).toEqual("invalid token");
        });
    });

    test("get friends", () => {
      return request(app)
        .get(`/friends/`)
        .set("Authorization", `bearer ${accessToken}`)
        .then((response) => {
          expect(response.status).toEqual(200);
          expect(response.body.friends).toBeDefined();
          expect(response.body.friends.length).toEqual(2);
          expect(response.body.friends[0].publicName).toEqual(
            logins[1].publicName,
          );
          expect(response.body.friends[0].id).toBeDefined();
          expect(response.body.friends[0].isOnline).toBeDefined();
        });
    });
  });

  describe("delete friend", () => {
    test("missing token", () => {
      return request(app)
        .delete(`/friends/${logins[1].id}`)
        .then((response) => {
          expect(response.status).toEqual(401);
          expect(response.body.errors[0]).toEqual("invalid token");
        });
    });

    test("invalid user id", () => {
      return request(app)
        .delete(`/friends/99`)
        .set("Authorization", `bearer ${accessToken}`)
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual("User not found");
        });
    });

    test("user exists but is not a friend", () => {
      return request(app)
        .delete(`/friends/${logins[3].id}`)
        .set("Authorization", `bearer ${accessToken}`)
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            "You don't have a friend with that id.",
          );
        });
    });

    test("delete friend", async () => {
      const deleteResponse = await request(app)
        .delete(`/friends/${logins[1].id}`)
        .set("Authorization", `bearer ${accessToken}`);

      expect(deleteResponse.status).toEqual(200);
      expect(deleteResponse.body.message).toEqual(
        `${logins[1].publicName} was deleted from your friends list.`,
      );

      return request(app)
        .get(`/friends/`)
        .set("Authorization", `bearer ${accessToken}`)
        .then((response) => {
          expect(response.status).toEqual(200);
          expect(response.body.friends).toBeDefined();
          expect(response.body.friends.length).toEqual(1);
          expect(response.body.friends[0].publicName).toEqual(
            logins[2].publicName,
          );
        });
    });
  });
});
