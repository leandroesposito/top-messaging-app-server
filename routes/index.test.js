const { indexRouter } = require("./index");
const jwt = require("jsonwebtoken");
const request = require("supertest");
const express = require("express");
const app = express();

const { createClient } = require("../db/connection.js");
const { createTables } = require("../db/create-tables.js");
const pool = require("../db/pool.js");

app.use(express.urlencoded({ extended: true }));
app.use("/", indexRouter);

describe("test index route", function () {
  beforeAll(() => {
    console.log("Test database init...");
    createClient().then((client) => {
      createTables(client).then(() => {
        client.end();
      });
    });
  });

  afterAll(() => {
    return pool.end();
  });

  describe("sign-up route test", function () {
    test("sign up validate inputs", (done) => {
      request(app)
        .post("/sign-up")
        .send({ username: "razor11" })
        .expect(409, done);
    });

    test("sign up validate inputs", (done) => {
      request(app)
        .post("/sign-up")
        .send({ username: "razor11", password: "razor11" })
        .expect(409, done);
    });

    test("sign up validate inputs", (done) => {
      request(app)
        .post("/sign-up")
        .send({
          username: "razor",
          password: "razor11",
          "confirm-password": "razor11",
        })
        .expect(409, done);
    });

    test("sign up validate inputs", (done) => {
      request(app)
        .post("/sign-up")
        .send({
          username: "razor",
          password: "razor111",
          "confirm-password": "razor112",
        })
        .expect(409, done);
    });

    test("sign up works", (done) => {
      request(app)
        .post("/sign-up")
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
});
