const { signUpRouter } = require("./sign-up");
const { logInRouter } = require("./log-in");
const { refreshRouter } = require("./refresh");

const request = require("supertest");
const express = require("express");
const { initDatabase, endPool, delay } = require("./test-helpers");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use("/sign-up", signUpRouter);
app.use("/log-in", logInRouter);
app.use("/refresh", refreshRouter);

describe("test refresh route", function () {
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
    await request(app).post("/sign-up").type("form").send({
      username: "user3",
      password: "password3",
      "confirm-password": "password3",
    });
  });
  afterAll(endPool);

  describe("validate inputs", () => {
    test("missing refresh token", (done) => {
      request(app)
        .post("/refresh")
        .type("form")
        .send({})
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            "refreshToken must be provided!",
          );
          done();
        });
    });

    test("empty refresh token", (done) => {
      request(app)
        .post("/refresh")
        .type("form")
        .send({
          refreshToken: "",
        })
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            "refreshToken must be provided!",
          );
        });
      done();
    });

    test("incorrect token type", async () => {
      const login = await request(app).post("/log-in").type("form").send({
        username: "user1",
        password: "password1",
      });

      const { accessToken } = login.body;

      const incorrectTokenResponse = await request(app)
        .post("/refresh")
        .type("form")
        .send({ refreshToken: accessToken });

      expect(incorrectTokenResponse.status).toEqual(409);
      expect(incorrectTokenResponse.body.errors[0]).toEqual(
        "Invalid token type, must be 'refresh' type",
      );
    });
  });

  test("refresh works", async () => {
    const login = await request(app).post("/log-in").type("form").send({
      username: "user2",
      password: "password2",
    });

    const { refreshToken } = login.body;

    const correctResponse = await request(app)
      .post("/refresh")
      .type("form")
      .send({ refreshToken: refreshToken });

    expect(correctResponse.status).toEqual(200);
    expect(correctResponse.body.refreshToken).toBeDefined();
    expect(correctResponse.body.accessToken).toBeDefined();
  });

  test("refresh can only be used once", async () => {
    // delays added to generate different tokens
    const user1login1 = await request(app).post("/log-in").type("form").send({
      username: "user3",
      password: "password3",
    });

    await delay(1000);

    // same user
    const user1login2 = await request(app).post("/log-in").type("form").send({
      username: "user3",
      password: "password3",
    });

    // different user
    const user2login = await request(app).post("/log-in").type("form").send({
      username: "user2",
      password: "password2",
    });

    await delay(1000);
    // first refresh
    await request(app)
      .post("/refresh")
      .type("form")
      .send({ refreshToken: user1login1.body.refreshToken });

    // second refresh same token as first refresh
    const dupliateTokenResponse = await request(app)
      .post("/refresh")
      .type("form")
      .send({ refreshToken: user1login1.body.refreshToken });

    // expect error for duplicate token request
    expect(dupliateTokenResponse.status).toEqual(409);
    expect(dupliateTokenResponse.body.errors[0]).toEqual(
      "Refresh token not found, may have been already used in other device, session closed for security reasons!",
    );

    // test same user unused token
    const unusedTokenSameUserResponse = await request(app)
      .post("/refresh")
      .type("form")
      .send({ refreshToken: user1login2.body.refreshToken });

    // must be deleted for security reasons
    expect(unusedTokenSameUserResponse.status).toEqual(409);
    expect(unusedTokenSameUserResponse.body.errors[0]).toEqual(
      "Refresh token not found, may have been already used in other device, session closed for security reasons!",
    );

    // user2 first refresh
    const user2RefreshResponse = await request(app)
      .post("/refresh")
      .type("form")
      .send({ refreshToken: user2login.body.refreshToken });

    // must work as normal
    expect(user2RefreshResponse.status).toEqual(200);
  });
});
