const { authenticate } = require("../auth/authenticate");
const userDB = require("../db/user");
const friendsDB = require("../db/friends");
const {
  validateFriendCode,
  validateFriendsPairDontExist,
  checkValidations,
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

module.exports = { getFriends, addFriend };
