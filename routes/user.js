const { Router } = require("express");
const profileController = require("../controllers/profile");

const userRouter = Router();

userRouter.put("/profile", profileController.modifyProfile);
userRouter.get("/:userId/profile", profileController.getProfile);

module.exports = { userRouter };
