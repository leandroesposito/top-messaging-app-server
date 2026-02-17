const { authenticate } = require("../auth/authenticate");
const {
  validateUserId,
  checkValidations,
  validateMessage,
} = require("./input-validations");
const messagesDB = require("../db/messages");

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

module.exports = {
  sendPrivateMessage,
  getPrivateChat,
};
