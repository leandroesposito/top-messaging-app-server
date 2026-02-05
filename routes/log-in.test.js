const { logInRouter } = require("./log-in");
const { signUpRouter } = require("./sign-up");
const request = require("supertest");
const express = require("express");
const { initDatabase, endPool } = require("./test-helpers");
const jwt = require("jsonwebtoken");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use("/log-in", logInRouter);
app.use("/sign-up", signUpRouter);

describe("test log-in route", function () {
  beforeAll(async () => {
    await initDatabase();
    return request(app).post("/sign-up").type("form").send({
      username: "razor",
      password: "razor111",
      "confirm-password": "razor111",
    });
  });
  afterAll(endPool);

  test("log-in validate inputs", (done) => {
    request(app)
      .post("/log-in")
      .send({ username: "razor11" })
      .expect(409, done);
  });

  test("log-in validate inputs", (done) => {
    request(app)
      .post("/log-in")
      .send({
        password: "razor11",
      })
      .expect(409, done);
  });

  test("log-in works", (done) => {
    request(app)
      .post("/log-in")
      .type("form")
      .send({
        username: "razor",
        password: "razor111",
      })
      .then((response) => {
        expect(response.status).toEqual(200);
        expect(response.body.username).toBeDefined();
        expect(response.body.accessToken).toBeDefined();
        expect(response.body.refreshToken).toBeDefined();

        const accessTokenData = jwt.verify(
          response.body.accessToken,
          process.env.JWT_SECRET,
        );
        const refreshTokenData = jwt.verify(
          response.body.refreshToken,
          process.env.JWT_SECRET,
        );

        expect(accessTokenData.userId).toBeDefined();
        expect(refreshTokenData.userId).toBeDefined();

        done();
      });
  });
});
