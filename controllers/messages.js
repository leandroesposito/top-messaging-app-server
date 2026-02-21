const { authenticate } = require("../auth/authenticate");
const {
  validateUserId,
  checkValidations,
  validateMessage,
  validateGroupId,
  validateUserIsInGroup,
} = require("./input-validations");
const messagesDB = require("../db/messages");
const groupDB = require("../db/group");

const sendPrivateMessage = [
  authenticate,
  validateUserId(),
  validateMessage(),
  checkValidations,
  async function (req, res) {
    const messageId = await messagesDB.sendPrivateMessage(
      req.user.id,
      req.locals.userId,
      new Date(),
      req.body.body,
    );

    await messagesDB.updatePrivateChatLastSeen(
      req.user.id,
      req.locals.userId,
      new Date(),
    );

    if (messageId) {
      res.status(200).json({ message: "success" });
    } else {
      res.status(500).json({ errors: ["Error sending message"] });
    }
  },
];

const sendGroupMessage = [
  authenticate,
  validateGroupId(),
  validateUserIsInGroup(),
  validateMessage(),
  checkValidations,
  async function (req, res) {
    const messageId = await messagesDB.sendGroupMessage(
      req.user.id,
      req.locals.group.id,
      new Date(),
      req.body.body,
    );

    await groupDB.updateUserGroupLastSeen(
      req.user.id,
      req.locals.group.id,
      new Date(),
    );

    if (messageId) {
      res.status(200).json({ message: "success" });
    } else {
      res.status(500).json({ errors: ["Error sending message"] });
    }
  },
];

const getPrivateChat = [
  authenticate,
  validateUserId(),
  checkValidations,
  async function (req, res) {
    const messages = await messagesDB.getPrivateChat(
      req.user.id,
      req.locals.userId,
    );

    await messagesDB.updatePrivateChatLastSeen(
      req.user.id,
      req.locals.userId,
      new Date(),
    );

    res.status(200).json({
      messages: messages.map((message) => ({
        id: message.id,
        userId: message.sender_user_id,
        publicName: message.public_name,
        body: message.body,
        createdAt: message.created_at,
      })),
    });
  },
];

const getGroupChat = [
  authenticate,
  validateGroupId(),
  validateUserIsInGroup(),
  checkValidations,
  async function (req, res) {
    const messages = await messagesDB.getGroupChat(req.locals.group.id);
    await groupDB.updateUserGroupLastSeen(
      req.user.id,
      req.locals.group.id,
      new Date(),
    );
    res.status(200).json({
      messages: messages.map((message) => ({
        id: message.id,
        userId: message.sender_user_id,
        publicName: message.public_name,
        body: message.body,
        createdAt: message.created_at,
      })),
    });
  },
];

const getPrivateChats = [
  authenticate,
  async function (req, res) {
    const privateChats = await messagesDB.getPrivateChats(req.user.id);
    res.status(200).json({
      privateChats: privateChats.map((pc) => ({
        id: pc.id,
        publicName: pc.public_name,
        isOnline: pc.is_online,
        lastMessageTime: pc.last_message_time,
        unreadCount: pc.unread_count,
      })),
    });
  },
];

module.exports = {
  sendPrivateMessage,
  sendGroupMessage,
  getPrivateChat,
  getGroupChat,
  getPrivateChats,
};
