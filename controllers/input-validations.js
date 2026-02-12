const { validationResult, param, check } = require("express-validator");
const userDB = require("../db/user");
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

module.exports = {
  checkValidations,
  validateUserId,
  validateFriendCode,
  validateFriendsPairDontExist,
  validateFriendsPairExist,
};
