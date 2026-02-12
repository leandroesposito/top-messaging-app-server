const { runQuery } = require("./query");

async function addFriendsPair(uid1, uid2) {
  const [lower, higher] = uid1 < uid2 ? [uid1, uid2] : [uid2, uid1];

  const query = `INSERT INTO friends (uid1, uid2) VALUES ($1, $2);`;
  const params = [lower, higher];

  await runQuery(query, params);
  return true;
}

async function deleteFriendsPair(uid1, uid2) {
  const [lower, higher] =
    parseInt(uid1) < parseInt(uid2) ? [uid1, uid2] : [uid2, uid1];

  const query = `DELETE FROM friends WHERE uid1 = $1 AND uid2 = $2`;
  const params = [lower, higher];

  await runQuery(query, params);
  return true;
}

async function friendsPairExist(uid1, uid2) {
  const [lower, higher] = uid1 < uid2 ? [uid1, uid2] : [uid2, uid1];

  const query = `
    SELECT *
    FROM friends
    WHERE uid1 = $1
      AND uid2 = $2;`;
  const params = [lower, higher];

  const res = await runQuery(query, params);

  return res.length > 0 && res[0].uid1 == lower && res[0].uid2 == higher;
}

module.exports = {
  addFriendsPair,
  friendsPairExist,
  deleteFriendsPair,
};
