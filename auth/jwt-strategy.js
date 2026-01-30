require("dotenv").config();
const { Strategy, ExtractJwt } = require("passport-jwt");
const userDB = require("../db/user");

const opts = {};
opts.secretOrKey = process.env.JWT_SECRET;
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();

const jwtStratety = new Strategy(opts, async function (jwtPayload, done) {
  try {
    const user = await userDB.getUserById(jwtPayload.userId);

    if (!user) {
      return done(null, false);
    }

    return done(null, user);
  } catch (error) {
    return done(error, false);
  }
});

module.exports = jwtStratety;
