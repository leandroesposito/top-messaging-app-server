const { Router } = require("express");
const groupController = require("../controllers/group");

const groupRouter = Router();

groupRouter.post("/join/:inviteCode", groupController.joinGroup);
groupRouter.delete("/:groupId/leave", groupController.leaveGroup);
groupRouter.delete("/:groupId/members/:userId", groupController.banUser);
groupRouter.get("/:groupId/members", groupController.getMembers);
groupRouter.get("/:groupId", groupController.getGroupInfo);
groupRouter.delete("/:groupId", groupController.deleteGroup);
groupRouter.post("/", groupController.createGroup);
groupRouter.get("/", groupController.getGroups);

module.exports = { groupRouter };
