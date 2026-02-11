const { Router } = require("express");
const profileController = require("../controllers/profile");
const { friendsRouter } = require("./friends");

const userRouter = Router();

userRouter.put("/profile", profileController.modifyProfile);
userRouter.get("/:userId/profile", profileController.getProfile);
userRouter.use("/friends", friendsRouter);

module.exports = { userRouter };
