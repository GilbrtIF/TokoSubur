const { ClientError } = require('../exceptions');

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof ClientError) {
    return res.status(err.statusCode).json({
      status: 'fail',
      message: err.message,
    });
  }

  console.error('[Unhandled Error]', err);

  return res.status(500).json({
    status: 'error',
    message: 'Terjadi kesalahan pada server',
  });
};

module.exports = errorHandler;
