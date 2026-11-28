const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { jwtSecret, serviceApiKey } = require('../config/env');
const { AuthenticationError, AuthorizationError } = require('../exceptions');

/**
 * Memastikan request membawa header `Authorization: Bearer <token>` yang valid.
 * Payload token disimpan di `req.user` ({ id, username, role }).
 */
const authGuard = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AuthenticationError('Token autentikasi tidak ditemukan'));
  }

  try {
    const payload = jwt.verify(token, jwtSecret);
    req.user = {
      id: payload.id,
      username: payload.username || null,
      role: payload.role,
    };
    return next();
  } catch (error) {
    const message =
      error.name === 'TokenExpiredError'
        ? 'Token autentikasi sudah kedaluwarsa, silakan login ulang'
        : 'Token autentikasi tidak valid';
    return next(new AuthenticationError(message));
  }
};

/**
 * Membatasi akses hanya untuk role tertentu. Dipasang SETELAH authGuard.
 * Contoh: router.delete('/:sku', requireRole('admin', 'owner'), handler)
 */
const requireRole =
  (...allowedRoles) =>
  (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(
        new AuthorizationError('Anda tidak memiliki akses untuk aksi ini')
      );
    }
    return next();
  };

const safeEqual = (a, b) => {
  const bufA = Buffer.from(String(a));
  const bufB = Buffer.from(String(b));
  return bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);
};

/**
 * Untuk endpoint yang dipanggil ML service: terima header `X-Service-Key`
 * (bila SERVICE_API_KEY diatur) ATAU token JWT dengan role yang diizinkan.
 */
const serviceKeyOrRole =
  (...allowedRoles) =>
  (req, res, next) => {
    const providedKey = req.headers['x-service-key'];
    if (providedKey) {
      if (serviceApiKey && safeEqual(providedKey, serviceApiKey)) {
        req.user = { id: null, username: 'ml-service', role: 'service' };
        return next();
      }
      return next(new AuthenticationError('X-Service-Key tidak valid'));
    }

    return authGuard(req, res, (error) => {
      if (error) {
        return next(error);
      }
      return requireRole(...allowedRoles)(req, res, next);
    });
  };

module.exports = {
  authGuard,
  requireRole,
  serviceKeyOrRole,
};
