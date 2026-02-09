require("dotenv").config();
const refreshTokenDB = require("../db/refresh-token");
const { checkValidations } = require("./input-validations");

const { validateRefreshToken } = require("./refresh");

const logOut = [
  validateRefreshToken(),
  checkValidations,
  async function (req, res) {
    const oldToken = req.body.refreshToken;

    await refreshTokenDB.deleteRefreshToken(oldToken);

    res.status(200).json({ message: "You log out successfuly!" });
  },
];

module.exports = { logOut };
