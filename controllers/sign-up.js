const { body } = require("express-validator");
const bcrypt = require("bcryptjs");
const { usernameExists, createUser } = require("../db/user");
const { checkValidations } = require("./input-validations");
const userDB = require("../db/user");

const validateUser = [
  body("username")
    .exists()
    .withMessage("Username is required to sign up")
    .trim()
    .toLowerCase()
    .isLength({ min: 4, max: 10 })
    .withMessage("Username must be between 4 and 10 characters both inclusive")
    .custom(async (value) => {
      if (await usernameExists(value)) {
        throw new Error(`Username ${value} is used!`);
      }
      return true;
    }),
  body("password")
    .exists()
    .withMessage("Password is required to sign up")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters!"),
  body("confirm-password")
    .exists()
    .withMessage("Password confirmation is required to sign up")
    .custom((value, { req }) => {
      if (value !== req.body["password"]) {
        throw new Error("Password must be equal to password confirmation!");
      }
      return true;
    }),
];

const signUp = [
  validateUser,
  checkValidations,
  async function (req, res) {
    const { username, password } = req.body;
    const securePassword = await bcrypt.hash(password, 10);

    const newUserId = await userDB.createUser(username, securePassword);

    if (newUserId) {
      res.status(200).json({ message: "User created succesfuly" });
    } else {
      res.status(500).json({ errors: ["Error creating user"] });
    }
  },
];

module.exports = { signUp };
