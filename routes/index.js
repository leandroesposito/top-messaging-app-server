const { Router } = require("express");
const { signUpRouter } = require("./sign-up");
const { logInRouter } = require("./log-in");

const indexRouter = Router();

indexRouter.use("/sign-up", signUpRouter);
indexRouter.use("/log-in", logInRouter);

module.exports = { indexRouter };
