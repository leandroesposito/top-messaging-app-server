const { runQuery } = require("./query");
const crypto = require("node:crypto");

async function generateInviteCode() {
  const query = "SELECT invite_code FROM groups WHERE invite_code = $1;";
  while (true) {
    const inviteCode = crypto.randomBytes(5).toString("hex");

    const duplicates = await runQuery(query, [inviteCode]);

    if (duplicates.length == 0) {
      return inviteCode;
    }
  }
}

async function createGroup(name, description = "") {
  let inviteCode = await generateInviteCode();
  const query = `
    INSERT INTO groups (invite_code, name, description) VALUES
      ($1, $2, $3)
    RETURNING id
  `;
  const params = [inviteCode, name, description];

  const newGroup = await runQuery(query, params);
  return newGroup[0].id;
}

async function joinGroup(uid, gid, isOwner = false) {
  const query = `
    INSERT
    INTO users_groups (user_id, group_id, is_owner)
    VALUES ($1, $2, $3);`;
  const params = [uid, gid, isOwner];

  await runQuery(query, params);
  return true;
}

async function userIsInGroup(uid, gid) {
  const query = `
    SELECT *
    FROM users_groups
    WHERE user_id = $1
      AND group_id = $2;`;
  const params = [uid, gid];

  const res = await runQuery(query, params);

  return res.length > 0;
}

async function getUserGroups(uid) {
  const query = `
    SELECT g.*
    FROM groups g
    JOIN users_groups ug
    ON g.id = ug.group_id
    WHERE ug.user_id = $1`;
  const params = [uid];

  const res = await runQuery(query, params);
  return res;
}

async function getGroupInfo(gid) {
  const query = `
    SELECT *
    FROM groups
    WHERE id = $1`;
  const params = [gid];

  const res = await runQuery(query, params);
  return res[0];
}

async function deleteUserFromGroup(uid, gid) {
  const query = `
    DELETE
    FROM users_groups
    WHERE user_id = $1
      AND group_id = $2;`;
  const params = [uid, gid];

  const res = await runQuery(query, params);

  return res.length > 0;
}

async function isOwner(uid, gid) {
  const query = `
    SELECT is_owner
    FROM users_groups
    WHERE user_id = $1
      AND group_id = $2;`;
  const params = [uid, gid];

  const res = await runQuery(query, params);

  return res.length > 0 && res[0].is_owner == true;
}

async function getGroupMembersById(id) {
  const query = `
    SELECT u.id, p.public_name, u.is_online
    FROM users_groups ug
    JOIN users u
      ON ug.user_id = u.id
    JOIN profiles p
      ON u.id = p.user_id
    WHERE ug.group_id = $1;
    `;
  const params = [id];

  const res = await runQuery(query, params);
  return res;
}

module.exports = {
  createGroup,
  joinGroup,
  userIsInGroup,
  getUserGroups,
  getGroupInfo,
  deleteUserFromGroup,
  isOwner,
  getGroupMembersById,
};
