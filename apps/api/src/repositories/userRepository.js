
/**
 * User Repository
 * Bertanggung jawab untuk seluruh query database terkait users.
 */

const pool = require('../config/db');

/**
 * Mencari pengguna berdasarkan username.
 *
 * @param {string} username
 * @returns {Promise<Object|null>}
 */
const findByUsername = async (username) => {
  const query = `
    SELECT
      id,
      username,
      password_hash,
      name,
      role
    FROM users
    WHERE username = $1
    LIMIT 1
  `;

  const result = await pool.query(query, [username]);

  return result.rows[0] || null;
};

module.exports = {
  findByUsername,
};
