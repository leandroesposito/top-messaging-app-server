const { Router } = require("express");
const { signUpRouter } = require("./sign-up");
const { logInRouter } = require("./log-in");
const { refreshRouter } = require("./refresh");
const { logOutRouter } = require("./log-out");

const indexRouter = Router();

indexRouter.use("/sign-up", signUpRouter);
indexRouter.use("/log-in", logInRouter);
indexRouter.use("/refresh", refreshRouter);
indexRouter.use("/log-out", logOutRouter);

module.exports = { indexRouter };
