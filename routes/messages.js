const { Router } = require("express");
const messagesController = require("../controllers/messages");

const messagesRouter = Router();

messagesRouter.post("/:userId", messagesController.sendPrivateMessage);
messagesRouter.get("/:userId", messagesController.getPrivateChat);
messagesRouter.get("/", messagesController.getPrivateChats);

module.exports = { messagesRouter };
