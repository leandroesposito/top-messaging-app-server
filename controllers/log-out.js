require("dotenv").config();
const { authenticate } = require("../auth/authenticate");
const refreshTokenDB = require("../db/refresh-token");
const userDB = require("../db/user");
const { checkValidations } = require("./input-validations");

const { validateRefreshToken } = require("./refresh");

const logOut = [
  authenticate,
  validateRefreshToken(),
  checkValidations,
  async function (req, res) {
    const oldToken = req.body.refreshToken;

    await refreshTokenDB.deleteRefreshToken(oldToken);
    await userDB.setOnlineStatus(req.user.id, false);

    res
      .status(200)
      .json({ message: "You log out successfuly!", success: true });
  },
];

module.exports = { logOut };
