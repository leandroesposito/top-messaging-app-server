require("dotenv").config();
const { body } = require("express-validator");
const jwt = require("jsonwebtoken");
const refreshTokenDB = require("../db/refresh-token");
const { checkValidations } = require("./input-validations");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("./token-generator");

const refresh = [
  body("refreshToken")
    .exists()
    .withMessage("refreshToken must be provided!")
    .custom(async (value, { req }) => {
      const { userId, type } = jwt.verify(value, process.env.JWT_SECRET);
      if (type !== "refresh") {
        throw new Error("Invalid token type, must be 'refresh' type");
      }

      const tokenId = await refreshTokenDB.getRefreshTokenId(value);
      if (!tokenId) {
        refreshTokenDB.deleteALLRefreshTokensFromUser(userId);
        throw new Error(
          "Refresh token not found, may have been already used in other device, session closed for security reasons!",
        );
      }

      req.locals = { userId };
      return true;
    }),
  checkValidations,
  async function (req, res) {
    const oldToken = req.body.refreshToken;
    const { userId } = req.locals;

    await refreshTokenDB.deleteRefreshToken(oldToken);
    const refreshToken = generateRefreshToken(userId);
    await refreshTokenDB.createRefreshToken(refreshToken, userId);

    const accessToken = generateAccessToken(userId);

    res.status(200).json({ refreshToken, accessToken });
  },
];

module.exports = { refresh };
