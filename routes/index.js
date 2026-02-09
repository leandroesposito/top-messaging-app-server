const { Router } = require("express");
const { authRouter } = require("./auth");
const { userRouter } = require("./user");

const indexRouter = Router();

indexRouter.use("/auth", authRouter);
indexRouter.use("/users", userRouter);

module.exports = { indexRouter };
