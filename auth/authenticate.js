const passport = require("passport");

function authenticate() {
  return passport.authenticate("jwt", { session: false });
}

module.exports = { authenticate };
