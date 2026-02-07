const passport = require("passport");

function authenticate(req, res, next) {
  passport.authenticate("jwt", { session: false }, function (err, user, info) {
    if (err) {
      return next(err);
    }

    if (!user) {
      let error = "invalid token";
      if (info && info.name) {
        if (info.name == "TokenExpiredError") {
          error =
            "Access token expired, use refreshToken in /api/auth/refresh or log in to get new access token.";
        }
      }
      return res.status(401).json({ errors: [error] });
    }

    req.user = user;
    next();
  })(req, res, next);
}

module.exports = { authenticate };
