const { Router } = require("express");
const { authRouter } = require("./auth");
const { userRouter } = require("./user");
const { groupRouter } = require("./group");
const { messagesRouter } = require("./messages");

const indexRouter = Router();

indexRouter.use("/auth", authRouter);
indexRouter.use("/users", userRouter);
indexRouter.use("/groups", groupRouter);
indexRouter.use("/messages", messagesRouter);

module.exports = { indexRouter };
