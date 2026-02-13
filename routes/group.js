const { Router } = require("express");
const groupController = require("../controllers/group");

const groupRouter = Router();

groupRouter.post("/", groupController.createGroup);
groupRouter.get("/", groupController.getGroups);
groupRouter.get("/:groupId", groupController.getGroupInfo);

module.exports = { groupRouter };
