const { Router } = require("express");
const friendsController = require("../controllers/friends");

const friendsRouter = Router();

friendsRouter.get("/", friendsController.getFriends);
friendsRouter.post("/:friendCode", friendsController.addFriend);
friendsRouter.delete("/:userId", friendsController.deleteFriend);

module.exports = { friendsRouter };
