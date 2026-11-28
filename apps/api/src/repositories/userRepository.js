/**
 * User Repository
 * Bertanggung jawab untuk seluruh query database terkait users.
 */

const pool = require('../config/db');

const findByUsername = async (username) => {
  const { rows } = await pool.query(
    `
      SELECT id, username, password_hash, name, role
      FROM users
      WHERE username = $1
      LIMIT 1
    `,
    [username]
  );
  return rows[0] || null;
};

const findById = async (id) => {
  const { rows } = await pool.query(
    `
      SELECT id, username, password_hash, name, role, created_at, updated_at
      FROM users
      WHERE id = $1
      LIMIT 1
    `,
    [id]
  );
  return rows[0] || null;
};

const updatePasswordHash = async (id, passwordHash) => {
  const { rowCount } = await pool.query(
    `
      UPDATE users
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `,
    [passwordHash, id]
  );
  return rowCount;
};

module.exports = {
  findByUsername,
  findById,
  updatePasswordHash,
};
