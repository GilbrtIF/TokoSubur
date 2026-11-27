/**
 * Authentication Controller
 * Bertanggung jawab menangani HTTP request dan response.
 */

const authService = require('../services/authService');
const { InvariantError } = require('../exceptions');

/**
 * POST /api/authentications
 *
 * Login pengguna.
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    if (
      typeof username !== 'string' ||
      username.trim().length === 0 ||
      typeof password !== 'string' ||
      password.length === 0
    ) {
      throw new InvariantError('Username dan password wajib diisi');
    }

    const data = await authService.login(username.trim(), password);

    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (error) {
    return next(error);
  }
};

const MIN_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 72; // batas efektif bcrypt

/**
 * GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    const user = await authService.getMe(req.user.id);
    return res.status(200).json({ status: 'success', data: user });
  } catch (error) {
    return next(error);
  }
};

/**
 * PUT /api/auth/password
 * Body: { oldPassword, newPassword }
 */
const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body || {};

    if (typeof oldPassword !== 'string' || oldPassword.length === 0) {
      throw new InvariantError('oldPassword wajib diisi');
    }
    if (typeof newPassword !== 'string' || newPassword.length === 0) {
      throw new InvariantError('newPassword wajib diisi');
    }
    if (
      newPassword.length < MIN_PASSWORD_LENGTH ||
      newPassword.length > MAX_PASSWORD_LENGTH
    ) {
      throw new InvariantError(
        `newPassword harus ${MIN_PASSWORD_LENGTH}-${MAX_PASSWORD_LENGTH} karakter`
      );
    }
    if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      throw new InvariantError(
        'newPassword harus mengandung minimal satu huruf dan satu angka'
      );
    }

    await authService.changePassword(req.user.id, { oldPassword, newPassword });
    return res.status(200).json({
      status: 'success',
      message: 'Password berhasil diperbarui',
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  login,
  getMe,
  changePassword,
};
