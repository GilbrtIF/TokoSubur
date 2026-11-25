const path = require('path');
const multer = require('multer');
const { InvariantError } = require('../exceptions');

const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = ['.csv', '.xlsx', '.xls'];

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new InvariantError('Format berkas harus berupa .csv, .xlsx, atau .xls')
    );
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1,
  },
  fileFilter,
});

const uploadSingleStockFile = (req, res, next) => {
  const handler = upload.single('file');
  handler(req, res, (err) => {
    if (!err) {
      return next();
    }

    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return next(new InvariantError('Ukuran berkas maksimal 10 MB'));
      }
      return next(
        new InvariantError(`Gagal mengunggah berkas: ${err.message}`)
      );
    }

    return next(err);
  });
};

module.exports = {
  uploadSingleStockFile,
};
