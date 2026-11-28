const { ClientError } = require('../exceptions');

// Pemetaan kode error PostgreSQL yang disebabkan oleh input client.
// Kode lain (koneksi putus, permission, dsb.) tetap dianggap error server.
const PG_CLIENT_ERRORS = {
  23505: { statusCode: 409, message: 'Data yang sama sudah tercatat' },
  23503: {
    statusCode: 400,
    message: 'Data rujukan tidak ditemukan atau masih dipakai data lain',
  },
  23502: { statusCode: 400, message: 'Ada kolom wajib yang belum diisi' },
  23514: {
    statusCode: 400,
    message: 'Data tidak memenuhi aturan validasi database',
  },
  22001: { statusCode: 400, message: 'Teks melebihi panjang maksimal kolom' },
  '22P02': { statusCode: 400, message: 'Format data tidak valid' },
  22003: {
    statusCode: 400,
    message: 'Nilai angka di luar batas yang diizinkan',
  },
  22007: { statusCode: 400, message: 'Format tanggal tidak valid' },
  22008: { statusCode: 400, message: 'Tanggal di luar rentang yang valid' },
};

const sendFail = (res, statusCode, message) =>
  res.status(statusCode).json({
    status: 'fail',
    message,
  });

// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (err instanceof ClientError) {
    return sendFail(res, err.statusCode, err.message);
  }

  // Error dari body-parser (express.json)
  if (err && err.type === 'entity.parse.failed') {
    return sendFail(res, 400, 'Body request bukan JSON yang valid');
  }

  if (err && err.type === 'entity.too.large') {
    return sendFail(res, 413, 'Ukuran body request terlalu besar');
  }

  // Error dari PostgreSQL yang disebabkan input client
  if (err && typeof err.code === 'string' && PG_CLIENT_ERRORS[err.code]) {
    const mapped = PG_CLIENT_ERRORS[err.code];
    return sendFail(res, mapped.statusCode, mapped.message);
  }

  console.error('[Unhandled Error]', err);

  return res.status(500).json({
    status: 'error',
    message: 'Terjadi kesalahan pada server',
  });
};

const notFoundHandler = (req, res) =>
  sendFail(
    res,
    404,
    `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan`
  );

module.exports = errorHandler;
module.exports.notFoundHandler = notFoundHandler;
