require("dotenv").config();
const { body } = require("express-validator");
const bcrypt = require("bcryptjs");
const { checkValidations } = require("./input-validations");
const userDB = require("../db/user");
const {
  generateRefreshToken,
  generateAccessToken,
} = require("./token-generator");
const { createRefreshToken } = require("../db/refresh-token");

const validateUser = () => [
  body("username")
    .exists()
    .withMessage("Username is required to log in")
    .toLowerCase(),
  body("password").exists().withMessage("Password is required to log in"),
];

const logIn = [
  validateUser(),
  checkValidations,
  async function (req, res) {
    const { username, password } = req.body;
    const user = await userDB.getUserByUsername(username);

    if (!user) {
      return res
        .status(403)
        .json({ errors: ["Invalid username or password!"] });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(403)
        .json({ errors: ["Invalid username or password!"] });
    }

    const accessToken = generateAccessToken(user.id);

    const refreshToken = generateRefreshToken(user.id);
    await createRefreshToken(refreshToken, user.id);

    res.status(200).json({ username, accessToken, refreshToken });
  },
];

module.exports = { logIn };
