const { Router } = require("express");
const logInController = require("../controllers/log-in");

const logInRouter = Router();

logInRouter.post("/", logInController.logIn);

module.exports = { logInRouter };
