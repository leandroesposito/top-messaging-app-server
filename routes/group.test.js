const { signUpRouter } = require("./sign-up");
const { logInRouter } = require("./log-in");
const { groupRouter } = require("./group");

const request = require("supertest");
const passport = require("passport");
const jwtStratety = require("../auth/jwt-strategy");

const express = require("express");
const { initDatabase, endPool, delay } = require("./test-helpers");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use("/sign-up", signUpRouter);
app.use("/log-in", logInRouter);
app.use("/groups", groupRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
passport.use(jwtStratety);

describe("test group route", function () {
  let token;
  beforeAll(async () => {
    await initDatabase();
    await request(app).post("/sign-up").type("form").send({
      username: "user1",
      password: "password1",
      "confirm-password": "password1",
    });
    await request(app).post("/sign-up").type("form").send({
      username: "user2",
      password: "password2",
      "confirm-password": "password2",
    });

    const login = await request(app).post("/log-in").type("form").send({
      username: "user1",
      password: "password1",
    });

    token = "bearer " + login.body.accessToken;
  });
  afterAll(endPool);

  describe("create group", () => {
    test("missing token", () => {
      return request(app)
        .post(`/groups/`)
        .type("form")
        .send({
          name: "the name",
          description: "the description",
        })
        .then((response) => {
          expect(response.status).toEqual(401);
          expect(response.body.errors[0]).toEqual("invalid token");
        });
    });

    test("missing name", () => {
      return request(app)
        .post(`/groups/`)
        .set("Authorization", token)
        .type("form")
        .send({
          description: "the description",
        })
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual("Group name is required");
        });
    });

    test("short name", () => {
      return request(app)
        .post(`/groups/`)
        .set("Authorization", token)
        .type("form")
        .send({
          name: "n",
          description: "the description",
        })
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            "Group name must be between 4 and 50 characters both inclusive",
          );
        });
    });

    test("long name", () => {
      return request(app)
        .post(`/groups/`)
        .set("Authorization", token)
        .type("form")
        .send({
          name: "n".repeat(51),
          description: "the description",
        })
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            "Group name must be between 4 and 50 characters both inclusive",
          );
        });
    });

    test("create group", () => {
      const name = "the name";
      return request(app)
        .post(`/groups/`)
        .set("Authorization", token)
        .type("form")
        .send({
          name,
          description: "the description",
        })
        .then((response) => {
          expect(response.status).toEqual(200);
          expect(response.body.message).toEqual(
            `Group ${name} created successfuly`,
          );
        });
    });
  });

  describe("get groups", () => {
    test("missing token", () => {
      return request(app)
        .post(`/groups/`)
        .type("form")
        .send({
          name: "the name",
          description: "the description",
        })
        .then((response) => {
          expect(response.status).toEqual(401);
          expect(response.body.errors[0]).toEqual("invalid token");
        });
    });

    test("get groups", () => {
      return request(app)
        .get(`/groups/`)
        .set("Authorization", token)
        .then((response) => {
          expect(response.status).toEqual(200);
          expect(response.body.groups).toBeDefined();
          expect(response.body.groups.length).toEqual(1);
          expect(response.body.groups[0].name).toEqual("the name");
        });
    });
  });

  describe("get group info", () => {
    test("missing token", () => {
      return request(app)
        .get(`/groups/1`)
        .then((response) => {
          expect(response.status).toEqual(401);
          expect(response.body.errors[0]).toEqual("invalid token");
        });
    });

    test("non existent group id", () => {
      return request(app)
        .get(`/groups/10`)
        .set("Authorization", token)
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual("Group not found");
        });
    });

    test("get groups", () => {
      return request(app)
        .get(`/groups/1`)
        .set("Authorization", token)
        .then((response) => {
          expect(response.status).toEqual(200);
          expect(response.body.group).toBeDefined();
          expect(response.body.group.name).toEqual("the name");
          expect(response.body.group.id).toBeDefined();
          expect(response.body.group.inviteCode).toBeDefined();
          expect(response.body.group.description).toBeDefined();
        });
    });
  });
});
