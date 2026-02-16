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
  let token, token2;
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

    const login2 = await request(app).post("/log-in").type("form").send({
      username: "user2",
      password: "password2",
    });

    token = "bearer " + login.body.accessToken;
    token2 = "bearer " + login2.body.accessToken;
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

  describe("delete group", () => {
    test("missing token", () => {
      return request(app)
        .delete(`/groups/1`)
        .then((response) => {
          expect(response.status).toEqual(401);
          expect(response.body.errors[0]).toEqual("invalid token");
        });
    });

    test("non existent group id", () => {
      return request(app)
        .delete(`/groups/10`)
        .set("Authorization", token)
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual("Group not found");
        });
    });

    test("delete other user group", async () => {
      await request(app)
        .post(`/groups/`)
        .set("Authorization", token2)
        .type("form")
        .send({
          name: "second group",
          description: "the description",
        });

      return request(app)
        .delete(`/groups/2`)
        .set("Authorization", token)
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual(
            "You have to be the owner to complete the operation.",
          );
        });
    });

    test("delete group", async () => {
      const name = "the name";
      await request(app)
        .delete(`/groups/1`)
        .set("Authorization", token)
        .then((response) => {
          expect(response.status).toEqual(200);
          expect(response.body.message).toEqual(
            `${name} group was deleted successfuly`,
          );
        });

      return request(app)
        .get(`/groups/`)
        .set("Authorization", token)
        .then((response) => {
          expect(response.body.groups.length).toEqual(0);
        });
    });
  });

  describe("join group", () => {
    let inviteCode;
    test("missing token", () => {
      return request(app)
        .post(`/groups/join/1`)
        .then((response) => {
          expect(response.status).toEqual(401);
          expect(response.body.errors[0]).toEqual("invalid token");
        });
    });

    test("non existent group invite code", () => {
      return request(app)
        .post(`/groups/join/10`)
        .set("Authorization", token2)
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual("Group not found");
        });
    });

    test("join group you are already in", async () => {
      const groupsResponse = await request(app)
        .get(`/groups/`)
        .set("Authorization", token2);

      inviteCode = groupsResponse.body.groups[0].inviteCode;

      const name = "second group";
      return request(app)
        .post(`/groups/join/${inviteCode}`)
        .set("Authorization", token2)
        .then((response) => {
          expect(response.body.errors[0]).toEqual(
            `You are already in the group ${name}`,
          );
        });
    });

    test("join group", async () => {
      const name = "second group";
      const joinResponse = await request(app)
        .post(`/groups/join/${inviteCode}`)
        .set("Authorization", token);

      expect(joinResponse.body.message).toEqual(`Welcome to ${name} group`);

      return request(app)
        .get(`/groups/`)
        .set("Authorization", token)
        .then((response) => {
          expect(response.body.groups.length).toEqual(1);
          expect(response.body.groups[0].name).toEqual(name);
        });
    });
  });

  describe("leave group", () => {
    test("missing token", () => {
      return request(app)
        .delete(`/groups/1/leave`)
        .then((response) => {
          expect(response.status).toEqual(401);
          expect(response.body.errors[0]).toEqual("invalid token");
        });
    });

    test("leave non existent group", () => {
      return request(app)
        .delete(`/groups/10/leave`)
        .set("Authorization", token)
        .then((response) => {
          expect(response.status).toEqual(409);
          expect(response.body.errors[0]).toEqual("Group not found");
        });
    });

    test("leave group you are not part of", async () => {
      const name = "third group";
      await request(app)
        .post(`/groups/`)
        .set("Authorization", token)
        .type("form")
        .send({
          name,
          description: "the description",
        });

      return request(app)
        .delete(`/groups/3/leave`)
        .set("Authorization", token2)
        .then((response) => {
          expect(response.body.errors[0]).toEqual(
            `You are not part of the group ${name}`,
          );
        });
    });

    test("leave group", async () => {
      const name = "second group";

      const leaveResponse = await request(app)
        .delete(`/groups/2/leave`)
        .set("Authorization", token);

      expect(leaveResponse.body.message).toEqual(
        `You are not part of the group ${name} anymore`,
      );

      return request(app)
        .get(`/groups/`)
        .set("Authorization", token)
        .then((response) => {
          expect(response.body.groups.length).toEqual(1);
        });
    });
  });

  describe("members", () => {
    beforeAll(async () => {
      const user1Groups = await request(app)
        .get(`/groups/`)
        .set("Authorization", token);

      inviteCode = user1Groups.body.groups[0].inviteCode;
    });

    describe("get members", () => {
      test("missing token", () => {
        return request(app)
          .get(`/groups/1/members`)
          .then((response) => {
            expect(response.status).toEqual(401);
            expect(response.body.errors[0]).toEqual("invalid token");
          });
      });

      test("get members of non existing group", () => {
        return request(app)
          .get(`/groups/10/members`)
          .set("Authorization", token)
          .then((response) => {
            expect(response.status).toEqual(409);
            expect(response.body.errors[0]).toEqual("Group not found");
          });
      });

      test("get members of group you are not part of", async () => {
        const name = "third group";

        return request(app)
          .get(`/groups/3/members`)
          .set("Authorization", token2)
          .then((response) => {
            expect(response.body.errors[0]).toEqual(
              `You are not part of the group ${name}`,
            );
          });
      });

      test("get members", async () => {
        await request(app)
          .post(`/groups/join/${inviteCode}`)
          .set("Authorization", token2);

        return request(app)
          .get(`/groups/3/members`)
          .set("Authorization", token)
          .then((response) => {
            expect(response.body.members.length).toEqual(2);
            expect(response.body.members[0].id).toBeDefined();
            expect(response.body.members[0].publicName).toBeDefined();
            expect(response.body.members[0].isOnline).toBeDefined();
            expect(response.body.members[1].id).toBeDefined();
            expect(response.body.members[1].publicName).toBeDefined();
            expect(response.body.members[1].isOnline).toBeDefined();
          });
      });
    });

    describe("ban member", () => {
      test("missing token", () => {
        return request(app)
          .delete(`/groups/3/members/1`)
          .then((response) => {
            expect(response.status).toEqual(401);
            expect(response.body.errors[0]).toEqual("invalid token");
          });
      });

      test("ban user from non existent group", () => {
        return request(app)
          .delete(`/groups/10/members/1`)
          .set("Authorization", token2)
          .then((response) => {
            expect(response.status).toEqual(409);
            expect(response.body.errors[0]).toEqual("Group not found");
          });
      });

      test("ban user from group you don't own", () => {
        return request(app)
          .delete(`/groups/3/members/1`)
          .set("Authorization", token2)
          .then((response) => {
            expect(response.body.errors[0]).toEqual(
              `You have to be the owner to complete the operation.`,
            );
          });
      });

      test("ban user that is not part of the group", () => {
        const name = "second group";
        return request(app)
          .delete(`/groups/2/members/1`)
          .set("Authorization", token2)
          .then((response) => {
            expect(response.body.errors[0]).toEqual(
              `User is not part of the group ${name}`,
            );
          });
      });

      test("ban user that doesn't exist", () => {
        const name = "second group";
        return request(app)
          .delete(`/groups/2/members/10`)
          .set("Authorization", token2)
          .then((response) => {
            expect(response.body.errors[0]).toEqual(
              `User is not part of the group ${name}`,
            );
          });
      });

      test("ban user", async () => {
        const name = "third group";
        const banResponse = await request(app)
          .delete(`/groups/3/members/2`)
          .set("Authorization", token);

        expect(banResponse.body.message).toEqual(
          `User removed from group ${name}`,
        );

        return request(app)
          .get(`/groups/3/members`)
          .set("Authorization", token)
          .then((response) => {
            expect(response.body.members.length).toEqual(1);
          });
      });
    });
  });
});
