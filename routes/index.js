const { Router } = require("express");
const { signUpRouter } = require("./sign-up");

const indexRouter = Router();

indexRouter.use("/sign-up", signUpRouter);

module.exports = { indexRouter };
