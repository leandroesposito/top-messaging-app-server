const { runQuery } = require("./query");

async function createRefreshToken(token, userId) {
  const query = `
    INSERT INTO refresh_tokens (token, user_id)
      VALUES ($1, $2)
    RETURNING id;`;
  const params = [token, userId];

  const newRefreshTokenId = await runQuery(query, params);
  return newRefreshTokenId;
}

async function getRefreshTokenId(token) {
  const query = `SELECT id FROM refresh_tokens WHERE token = $1`;
  const params = [token];

  const res = await runQuery(query, params);

  return res[0]?.id;
}

async function deleteALLRefreshTokensFromUser(userId) {
  const query = `DELETE FROM refresh_tokens WHERE user_id = $1`;
  const params = [userId];

  await runQuery(query, params);
}

async function deleteRefreshToken(token) {
  const query = "DELETE FROM refresh_tokens WHERE token = $1";
  const params = [token];

  await runQuery(query, params);
}

module.exports = {
  createRefreshToken,
  getRefreshTokenId,
  deleteALLRefreshTokensFromUser,
  deleteRefreshToken,
};
