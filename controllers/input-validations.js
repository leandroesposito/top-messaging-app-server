const { validationResult, param, body } = require("express-validator");
const userDB = require("../db/user");
const groupDB = require("../db/group");
const friendsDB = require("../db/friends");
const NotFoundError = require("../errors/NotFoundError");

function checkValidations(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(409).json({ errors: errors.array().map((e) => e.msg) });
  }
  next();
}

function validateUserId() {
  return param("userId").custom(async (value, { req }) => {
    const user = await userDB.getUserById(value);
    if (!user) {
      throw new NotFoundError("User not found");
    }

    req.locals = { userId: user.id };
    return true;
  });
}

function validateFriendCode() {
  return param("friendCode").custom(async (value, { req }) => {
    const friend = await userDB.getUserByFriendCode(value);
    if (!friend) {
      throw new NotFoundError("User not found");
    }
    if (friend.id == req.user.id) {
      throw new Error("You can't add yourself as a friend");
    }

    req.locals = { friend };
    return true;
  });
}

function validateFriendsPairDontExist() {
  return param("friendCode").custom(async (value, { req }) => {
    if (!req.locals || !req.locals.friend) {
      return false;
    }
    const friendsPairExist = await friendsDB.friendsPairExist(
      req.user.id,
      req.locals.friend.id,
    );
    if (friendsPairExist) {
      throw new Error(
        `You are already friend with ${req.locals.friend.public_name}`,
      );
    }
    return true;
  });
}

function validateFriendsPairExist() {
  return param("userId").custom(async (value, { req }) => {
    if (!req.locals || !req.locals.userId) {
      return false;
    }
    const friendsPairExist = await friendsDB.friendsPairExist(
      req.user.id,
      req.locals.userId,
    );

    if (!friendsPairExist) {
      throw new Error(`You don't have a friend with that id.`);
    }
    return true;
  });
}

function validateGroupName() {
  return body("name")
    .trim()
    .exists({ values: "falsy" })
    .withMessage("Group name is required")
    .isLength({ min: 4, max: 50 })
    .withMessage(
      "Group name must be between 4 and 50 characters both inclusive",
    );
}

function validateGroupId() {
  return param("groupId").custom(async (value, { req }) => {
    const group = await groupDB.getGroupInfo(value);
    if (!group) {
      throw new NotFoundError("Group not found");
    }

    req.locals = { group };
    return true;
  });
}

function validateGroupOwnership() {
  return param("groupId").custom(async (value, { req }) => {
    const isOwner = await groupDB.isOwner(req.user.id, value);
    if (!isOwner) {
      throw new Error("You can't delete a group that you don't own.");
    }

    return true;
  });
}

function validateInviteCode() {
  return param("inviteCode").custom(async (value, { req }) => {
    const group = await groupDB.getGroupByInviteCode(value);
    if (!group) {
      throw new NotFoundError("Group not found");
    }

    req.locals = { group };
    return true;
  });
}

function validateUserIsNotInGroup() {
  return param().custom(async (value, { req }) => {
    const isInGroup = await groupDB.userIsInGroup(
      req.user.id,
      req.locals.group.id,
    );
    if (isInGroup) {
      throw new Error(`You are already in the group ${req.locals.group.name}`);
    }

    return true;
  });
}

module.exports = {
  checkValidations,
  validateUserId,
  validateFriendCode,
  validateFriendsPairDontExist,
  validateFriendsPairExist,
  validateGroupName,
  validateGroupId,
  validateGroupOwnership,
  validateInviteCode,
  validateUserIsNotInGroup,
};
