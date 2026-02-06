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

  describe("sign-up validate inputs", () => {
    test("missing password", (done) => {
      request(app)
        .post("/")
        .type("form")
        .send({ username: "razor11" })
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            "Password is required to sign up",
          );
          done();
        });
    });

    test("missing confirm-password", (done) => {
      request(app)
        .post("/")
        .type("form")
        .send({ username: "razor11", password: "razor111" })
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            "Password confirmation is required to sign up",
          );
          done();
        });
    });

    test("short password", (done) => {
      request(app)
        .post("/")
        .type("form")
        .send({
          username: "razor11",
          password: "razor11",
          "confirm-password": "razor11",
        })
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            "Password must be at least 8 characters!",
          );
          done();
        });
    });

    test("confirm-password don't match password", (done) => {
      request(app)
        .post("/")
        .type("form")
        .send({
          username: "razor11",
          password: "razor111",
          "confirm-password": "razor112",
        })
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            "Password must be equal to password confirmation!",
          );
          done();
        });
    });
  });
});
