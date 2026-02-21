const { authenticate } = require("../auth/authenticate");
const {
  validateGroupName,
  checkValidations,
  validateGroupId,
  validateGroupOwnership,
  validateInviteCode,
  validateUserIsNotInGroup,
  validateUserIsInGroup,
  validateUserIsMember,
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

    res.status(200).json({
      groups: groups.map((group) => ({
        id: group.id,
        name: group.name,
        inviteCode: group.invite_code,
        newMessages: group.new_messages,
        lastMessageTime: group.last_message_time,
      })),
    });
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

const deleteGroup = [
  authenticate,
  validateGroupId(),
  validateGroupOwnership(),
  checkValidations,
  async function (req, res) {
    const success = await groupDB.deleteGroup(req.params.groupId);
    if (success) {
      res.status(200).json({
        message: `${req.locals.group.name} group was deleted successfuly`,
      });
    } else {
      res.status(500).json({ errors: ["Error deleting group"] });
    }
  },
];

const joinGroup = [
  authenticate,
  validateInviteCode(),
  validateUserIsNotInGroup(),
  checkValidations,
  async function (req, res) {
    const success = await groupDB.joinGroup(req.user.id, req.locals.group.id);

    if (success) {
      res.status(200).json({
        message: `Welcome to ${req.locals.group.name} group`,
      });
    } else {
      res.status(500).json({ errors: ["Error joining group"] });
    }
  },
];

const leaveGroup = [
  authenticate,
  validateGroupId(),
  validateUserIsInGroup(),
  checkValidations,
  async function (req, res) {
    const success = await groupDB.deleteUserFromGroup(
      req.user.id,
      req.locals.group.id,
    );

    if (success) {
      res.status(200).json({
        message: `You are not part of the group ${req.locals.group.name} anymore`,
      });
    } else {
      res.status(500).json({ errors: ["Error leaving group"] });
    }
  },
];

const getMembers = [
  authenticate,
  validateGroupId(),
  validateUserIsInGroup(),
  checkValidations,
  async function (req, res) {
    const members = await groupDB.getGroupMembersById(req.locals.group.id);

    res.status(200).json({
      members: members.map((member) => ({
        id: member.id,
        publicName: member.public_name,
        isOnline: member.is_online,
      })),
    });
  },
];

const banUser = [
  authenticate,
  validateGroupId(),
  validateGroupOwnership(),
  validateUserIsMember(),
  checkValidations,
  async function (req, res) {
    const success = groupDB.deleteUserFromGroup(
      req.locals.memberId,
      req.locals.group.id,
    );

    if (success) {
      res.status(200).json({
        message: `User removed from group ${req.locals.group.name}`,
      });
    } else {
      res.status(500).json({ errors: ["Error removing user from group"] });
    }
  },
];

module.exports = {
  createGroup,
  getGroups,
  getGroupInfo,
  deleteGroup,
  joinGroup,
  leaveGroup,
  getMembers,
  banUser,
};
