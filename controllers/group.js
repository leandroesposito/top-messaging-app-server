const { authenticate } = require("../auth/authenticate");
const { validateGroupName, checkValidations } = require("./input-validations");
const groupDB = require("../db/group");

const createGroup = [
  authenticate,
  validateGroupName(),
  checkValidations,
  async function (req, res) {
    const { name, description } = req.body;

    const groupId = await groupDB.createGroup(name, description);

    if (groupId) {
      await groupDB.joinGroup(req.user.id, groupId, true);
      res.status(200).json({ message: `Group ${name} created successfuly` });
    } else {
      res.status(500).json({ errors: ["Error creating group"] });
    }
  },
];

module.exports = { createGroup };
