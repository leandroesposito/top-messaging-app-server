const { Router } = require("express");
const groupController = require("../controllers/group");

const groupRouter = Router();

groupRouter.post("/join/:inviteCode", groupController.joinGroup);
groupRouter.get("/:groupId", groupController.getGroupInfo);
groupRouter.delete("/:groupId", groupController.deleteGroup);
groupRouter.post("/", groupController.createGroup);
groupRouter.get("/", groupController.getGroups);

module.exports = { groupRouter };
