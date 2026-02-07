const { Router } = require("express");
const logOutController = require("../controllers/log-out");

const logOutRouter = Router();

logOutRouter.post("/", logOutController.logOut);

module.exports = { logOutRouter };
