const { Router } = require("express");
const groupController = require("../controllers/group");

const groupRouter = Router();

groupRouter.post("/", groupController.createGroup);
groupRouter.get("/", groupController.getGroups);

module.exports = { groupRouter };
