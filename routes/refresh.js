const { Router } = require("express");
const refreshController = require("../controllers/refresh");

const refreshRouter = Router();

refreshRouter.post("/", refreshController.refresh);

module.exports = { refreshRouter };
