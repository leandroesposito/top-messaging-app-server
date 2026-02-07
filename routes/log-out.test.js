const { signUpRouter } = require("./sign-up");
const { logInRouter } = require("./log-in");
const { refreshRouter } = require("./refresh");
const { logOutRouter } = require("./log-out");

const request = require("supertest");
const express = require("express");
const { initDatabase, endPool, delay } = require("./test-helpers");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use("/sign-up", signUpRouter);
app.use("/log-in", logInRouter);
app.use("/refresh", refreshRouter);
app.use("/log-out", logOutRouter);

describe("test log out route", function () {
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
        .post("/log-out")
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
        .post("/log-out")
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
        .post("/log-out")
        .type("form")
        .send({ refreshToken: accessToken });

      expect(incorrectTokenResponse.status).toEqual(409);
      expect(incorrectTokenResponse.body.errors[0]).toEqual(
        "Invalid token type, must be 'refresh' type",
      );
    });
  });

  test("log-out works", async () => {
    const login = await request(app).post("/log-in").type("form").send({
      username: "user2",
      password: "password2",
    });

    const { refreshToken } = login.body;

    const correctResponse = await request(app)
      .post("/log-out")
      .type("form")
      .send({ refreshToken: refreshToken });

    expect(correctResponse.status).toEqual(200);
    expect(correctResponse.body.message).toEqual("You log out successfuly!");
  });

  test("refresh doesn't work after log out", async () => {
    // delays added to generate different tokens
    const login1 = await request(app).post("/log-in").type("form").send({
      username: "user3",
      password: "password3",
    });

    await delay(1000);

    const login2 = await request(app).post("/log-in").type("form").send({
      username: "user3",
      password: "password3",
    });

    const refreshToken1 = login1.body.refreshToken;
    const refreshToken2 = login2.body.refreshToken;

    const logOutResponse = await request(app)
      .post("/log-out")
      .type("form")
      .send({ refreshToken: refreshToken1 });
    expect(logOutResponse.status).toEqual(200);

    const correctRefreshResponse = await request(app)
      .post("/refresh")
      .type("form")
      .send({ refreshToken: refreshToken2 });

    expect(correctRefreshResponse.status).toEqual(200);

    const incorrectRefreshResponse = await request(app)
      .post("/refresh")
      .type("form")
      .send({ refreshToken: refreshToken1 });

    expect(incorrectRefreshResponse.status).toEqual(409);
    expect(incorrectRefreshResponse.body.errors[0]).toEqual(
      "Refresh token not found, may have been already used in other device, session closed for security reasons!",
    );
  });
});
