require("dotenv").config();
const { body } = require("express-validator");
const { authenticate } = require("../auth/authenticate");
const profileDB = require("../db/profile");
const { checkValidations, validateUserId } = require("./input-validations");

function validateProfile() {
  return [
    body("public-name")
      .exists()
      .withMessage("Public name is required in the profile")
      .trim()
      .isLength({ min: 4, max: 30 })
      .withMessage(
        "Public name must be between 4 and 30 characters both inclusive",
      ),
    body("description")
      .trim()
      .isLength({ max: 500 })
      .withMessage("Description can't have more than 500 characters"),
  ];
}

const modifyProfile = [
  authenticate,
  validateProfile(),
  checkValidations,
  async function (req, res) {
    const publicName = req.body["public-name"];
    const description = req.body.description || "";
    const userId = req.user.id;

    const modified = await profileDB.updateProfileByUserId(
      userId,
      publicName,
      description,
    );

    if (modified) {
      res.status(200).json({ message: "Profile updated succesfully" });
    }
  },
];

const getProfile = [
  validateUserId(),
  checkValidations,
  async function (req, res) {
    const profile = await profileDB.getProfileByUserId(req.locals.userId);

    res.status(200).json({
      userId: profile.user_id,
      publicName: profile.public_name,
      description: profile.description,
    });
  },
];

module.exports = { modifyProfile, getProfile };
