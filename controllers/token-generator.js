const jwt = require("jsonwebtoken");

function generateAccessToken(userId) {
  return jwt.sign({ userId: userId, type: "access" }, process.env.JWT_SECRET, {
    expiresIn: "15m",
  });
}

function generateRefreshToken(userId) {
  const refreshToken = jwt.sign(
    { userId, type: "refresh" },
    process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    },
  );

  return refreshToken;
}

module.exports = { generateAccessToken, generateRefreshToken };
