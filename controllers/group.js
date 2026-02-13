const { authenticate } = require("../auth/authenticate");
const {
  validateGroupName,
  checkValidations,
  validateGroupId,
} = require("./input-validations");
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

const getGroups = [
  authenticate,
  async function (req, res) {
    const groups = await groupDB.getUserGroups(req.user.id);
    res.status(200).json({ groups });
  },
];

const getGroupInfo = [
  authenticate,
  validateGroupId(),
  checkValidations,
  async function (req, res) {
    const group = {
      id: req.locals.group.id,
      inviteCode: req.locals.group.invite_code,
      name: req.locals.group.name,
      description: req.locals.group.description,
    };
    res.status(200).json({ group });
  },
];

module.exports = { createGroup, getGroups, getGroupInfo };
