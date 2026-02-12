const { Router } = require("express");
const { authRouter } = require("./auth");
const { userRouter } = require("./user");
const { groupRouter } = require("./group");

const indexRouter = Router();

indexRouter.use("/auth", authRouter);
indexRouter.use("/users", userRouter);
indexRouter.use("/groups", groupRouter);

module.exports = { indexRouter };
