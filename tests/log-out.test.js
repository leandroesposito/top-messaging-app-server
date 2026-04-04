const { signUpRouter } = require("../routes/sign-up");
const { logInRouter } = require("../routes/log-in");
const { refreshRouter } = require("../routes/refresh");
const { logOutRouter } = require("../routes/log-out");

const passport = require("passport");
const jwtStratety = require("../auth/jwt-strategy");

const request = require("supertest");
const express = require("express");
const { initDatabase, endPool, delay } = require("../routes/test-helpers");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use("/sign-up", signUpRouter);
app.use("/log-in", logInRouter);
app.use("/refresh", refreshRouter);
app.use("/log-out", logOutRouter);

passport.use(jwtStratety);

describe("test log out route", function () {
  const logins = [];
  beforeAll(async () => {
    await initDatabase();
    for (let i = 0; i < 3; i++) {
      await request(app)
        .post("/sign-up")
        .type("form")
        .send({
          username: `user${i}`,
          password: `password${i}`,
          "confirm-password": `password${i}`,
        });
    }

    for (let i = 0; i < 3; i++) {
      const loginresponse = await request(app)
        .post("/log-in")
        .type("form")
        .send({
          username: `user${i}`,
          password: `password${i}`,
          "confirm-password": `password${i}`,
        });

      logins.push(loginresponse.body);
    }
  });
  afterAll(endPool);

  describe("validate inputs", () => {
    test("missing refresh token", (done) => {
      request(app)
        .post("/log-out")
        .set("Authorization", `Bearer ${logins[0].accessToken}`)
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
        .set("Authorization", `Bearer ${logins[0].accessToken}`)
        .type("form")
        .send({
          refreshToken: "",
        })
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            "refreshToken must be provided!",
          );
          done();
        });
    });

    test("incorrect token type", async () => {
      const incorrectTokenResponse = await request(app)
        .post("/log-out")
        .set("Authorization", `Bearer ${logins[0].accessToken}`)
        .type("form")
        .send({ refreshToken: logins[0].accessToken });

      expect(incorrectTokenResponse.status).toEqual(409);
      expect(incorrectTokenResponse.body.errors[0]).toEqual(
        "Invalid token type, must be 'refresh' type",
      );
    });
  });

  test("log-out works", async () => {
    const correctResponse = await request(app)
      .post("/log-out")
      .set("Authorization", `Bearer ${logins[1].accessToken}`)
      .type("form")
      .send({ refreshToken: logins[1].refreshToken });

    expect(correctResponse.status).toEqual(200);
    expect(correctResponse.body.message).toEqual("You log out successfuly!");
  });

  test("refresh doesn't work after log out", async () => {
    // delays added to generate different tokens
    await delay(1000);
    const login1 = await request(app).post("/log-in").type("form").send({
      username: "user2",
      password: "password2",
    });

    await delay(1000);

    const login2 = await request(app).post("/log-in").type("form").send({
      username: "user2",
      password: "password2",
    });

    const refreshToken1 = login1.body.refreshToken;
    const refreshToken2 = login2.body.refreshToken;

    const logOutResponse = await request(app)
      .post("/log-out")
      .set("Authorization", `Bearer ${login1.body.accessToken}`)
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
