const { signUpRouter } = require("./sign-up");
const request = require("supertest");
const express = require("express");
const { initDatabase, endPool } = require("./test-helpers");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use("/", signUpRouter);

describe("test sign-up route", function () {
  beforeAll(initDatabase);
  afterAll(endPool);

  test("sign up validate inputs", (done) => {
    request(app).post("/").send({ username: "razor11" }).expect(409, done);
  });

  test("sign-up validate inputs", (done) => {
    request(app)
      .post("/")
      .send({ username: "razor11", password: "razor11" })
      .expect(409, done);
  });

  test("sign-up validate inputs", (done) => {
    request(app)
      .post("/")
      .send({
        username: "razor",
        password: "razor11",
        "confirm-password": "razor11",
      })
      .expect(409, done);
  });

  test("sign-up validate inputs", (done) => {
    request(app)
      .post("/")
      .send({
        username: "razor",
        password: "razor111",
        "confirm-password": "razor112",
      })
      .expect(409, done);
  });

  test("sign-up works", (done) => {
    request(app)
      .post("/")
      .type("form")
      .send({
        username: "razor",
        password: "razor111",
        "confirm-password": "razor111",
      })
      .then((response) => {
        expect(response.status).toEqual(200);
        expect(response.body.message).toEqual("User created succesfuly");
        done();
      });
  });
});
