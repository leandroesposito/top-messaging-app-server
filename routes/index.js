const { Router } = require("express");
const { signUpRouter } = require("./sign-up");
const { logInRouter } = require("./log-in");
const { refreshRouter } = require("./refresh");

const indexRouter = Router();

indexRouter.use("/sign-up", signUpRouter);
indexRouter.use("/log-in", logInRouter);
indexRouter.use("/refresh", refreshRouter);

module.exports = { indexRouter };
