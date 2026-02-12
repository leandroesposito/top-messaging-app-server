const { Router } = require("express");
const groupController = require("../controllers/group");

const groupRouter = Router();

groupRouter.post("/", groupController.createGroup);

module.exports = { groupRouter };
