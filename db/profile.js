const { runQuery } = require("./query");

async function createProfile(user_id, public_name, description) {
  const query = `
    INSERT INTO profiles (user_id, public_name, description) VALUES
      ($1, $2, $3)
    RETURNING id
  `;
  const params = [user_id, public_name, description];

  const newProfile = await runQuery(query, params);
  return newProfile[0].id;
}

async function getProfileByUserId(userId) {
  const query = `SELECT public_name, description FROM profiles WHERE user_id = $1`;
  const params = [userId];

  const res = await runQuery(query, params);
  return res[0];
}

module.exports = {
  createProfile,
  getProfileByUserId,
};
