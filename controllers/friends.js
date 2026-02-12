const { authenticate } = require("../auth/authenticate");
const userDB = require("../db/user");
const friendsDB = require("../db/friends");
const {
  validateFriendCode,
  validateFriendsPairDontExist,
  checkValidations,
  validateFriendsPairExist,
  validateUserId,
} = require("./input-validations");

const addFriend = [
  authenticate,
  validateFriendCode(),
  validateFriendsPairDontExist(),
  checkValidations,
  async function (req, res) {
    friendsDB.addFriendsPair(req.user.id, req.locals.friend.id);

    res.status(200).json({
      message: `${req.locals.friend.public_name} added as a friend succesfully.`,
    });
  },
];

const deleteFriend = [
  authenticate,
  validateUserId(),
  validateFriendsPairExist(),
  checkValidations,
  async function (req, res) {
    const deletedFriend = await userDB.getUserById(req.params.userId);
    await friendsDB.deleteFriendsPair(req.user.id, req.params.userId);

    res.status(200).json({
      message: `${deletedFriend.public_name} was deleted from your friends list.`,
    });
  },
];

const getFriends = [
  authenticate,
  async function (req, res) {
    const friends = await userDB.getUserFriendsById(req.user.id);

    return res.status(200).json({
      friends: friends.map((f) => ({
        id: f.id,
        publicName: f.public_name,
        isOnline: f.is_online,
      })),
    });
  },
];

module.exports = { getFriends, addFriend, deleteFriend };
