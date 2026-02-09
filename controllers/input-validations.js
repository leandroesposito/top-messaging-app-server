const { validationResult, param } = require("express-validator");
const userDB = require("../db/user");
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

module.exports = { checkValidations, validateUserId };
