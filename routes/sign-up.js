const { Router } = require("express");
const signUpController = require("../controllers/sign-up");

const signUpRouter = Router();

signUpRouter.post("/", signUpController.signUp);

module.exports = { signUpRouter };
