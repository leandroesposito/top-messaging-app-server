const { Router } = require("express");
const { signUpRouter } = require("./sign-up");
const { logInRouter } = require("./log-in");
const { refreshRouter } = require("./refresh");
const { logOutRouter } = require("./log-out");

const authRouter = Router();

authRouter.use("/sign-up", signUpRouter);
authRouter.use("/log-in", logInRouter);
authRouter.use("/refresh", refreshRouter);
authRouter.use("/log-out", logOutRouter);

module.exports = { authRouter };
