const { signUpRouter } = require("./sign-up");
const { logInRouter } = require("./log-in");
const { userRouter } = require("./user");

const passport = require("passport");
const jwtStratety = require("../auth/jwt-strategy");

const request = require("supertest");
const express = require("express");
const { initDatabase, endPool } = require("./test-helpers");
const app = express();

app.use(express.urlencoded({ extended: true }));
app.use("/sign-up", signUpRouter);
app.use("/log-in", logInRouter);
app.use("/users", userRouter);
passport.use(jwtStratety);

describe("test users route", function () {
  beforeAll(async () => {
    await initDatabase();
    await request(app).post("/sign-up").type("form").send({
      username: "user1",
      password: "password1",
      "confirm-password": "password1",
    });
  });
  afterAll(endPool);

  describe("test profile routes", () => {
    let accessToken;
    beforeAll(async () => {
      const loginResponse = await request(app)
        .post("/log-in")
        .type("form")
        .send({
          username: "user1",
          password: "password1",
        });

      accessToken = loginResponse.body.accessToken;
    });

    describe("validate inputs", () => {
      test("non existent user id", () => {
        return request(app)
          .get("/users/10/profile")
          .then((response) => {
            expect(response.status).toEqual(409);
            expect(response.body.errors[0]).toEqual("User not found");
          });
      });

      test("missing public name in profile", () => {
        return request(app)
          .put("/users/profile")
          .type("form")
          .send({})
          .set("Authorization", `bearer ${accessToken}`)
          .then((response) => {
            expect(response.status).toEqual(409);
            expect(response.body.errors[0]).toEqual(
              "Public name is required in the profile",
            );
          });
      });

      test("short public name in profile", () => {
        return request(app)
          .put("/users/profile")
          .type("form")
          .send({ "public-name": "1" })
          .set("Authorization", `bearer ${accessToken}`)
          .then((response) => {
            expect(response.status).toEqual(409);
            expect(response.body.errors[0]).toEqual(
              "Public name must be between 4 and 30 characters both inclusive",
            );
          });
      });

      test("long description in profile", () => {
        return request(app)
          .put("/users/profile")
          .type("form")
          .send({ "public-name": "123456", description: "1".repeat(501) })
          .set("Authorization", `bearer ${accessToken}`)
          .then((response) => {
            expect(response.status).toEqual(409);
            expect(response.body.errors[0]).toEqual(
              "Description can't have more than 500 characters",
            );
          });
      });
    });

    test("profile get", () => {
      return request(app)
        .get("/users/1/profile")
        .then((response) => {
          expect(response.status).toEqual(200);
          expect(response.body["user_id"]).toEqual(1);
          expect(response.body["public_name"]).toEqual("user1");
          expect(response.body.description).toEqual("");
        });
    });

    test("profile update", async () => {
      const correctResponse = await request(app)
        .put("/users/profile")
        .type("form")
        .send({ "public-name": "123456", description: "1".repeat(500) })
        .set("Authorization", `bearer ${accessToken}`);

      expect(correctResponse.status).toEqual(200);
      expect(correctResponse.body.message).toEqual(
        "Profile updated succesfully",
      );

      return request(app)
        .get("/users/1/profile")
        .then((response) => {
          expect(response.status).toEqual(200);
          expect(response.body["user_id"]).toEqual(1);
          expect(response.body["public_name"]).toEqual("123456");
          expect(response.body.description).toEqual("1".repeat(500));
        });
    });
  });
});
