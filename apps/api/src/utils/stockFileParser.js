const path = require('path');
const { Readable } = require('stream');
const csvParser = require('csv-parser');
const XLSX = require('xlsx');
const { InvariantError } = require('../exceptions');

const REQUIRED_COLUMNS = ['tanggal', 'sku', 'jenis', 'qty'];

const normalizeHeader = (header) =>
  String(header || '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase();

const normalizeRowKeys = (rawRow) => {
  const normalized = {};
  Object.keys(rawRow || {}).forEach((key) => {
    const cleanKey = normalizeHeader(key);
    if (cleanKey !== '') {
      normalized[cleanKey] = rawRow[key];
    }
  });
  return normalized;
};

const formatExcelDate = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed && parsed.y && parsed.m && parsed.d) {
      const year = String(parsed.y).padStart(4, '0');
      const month = String(parsed.m).padStart(2, '0');
      const day = String(parsed.d).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
  }

  return String(value === undefined || value === null ? '' : value).trim();
};

const parseCsvBuffer = (buffer) =>
  new Promise((resolve, reject) => {
    const rows = [];
    let detectedHeaders = [];

    const stream = Readable.from(buffer);
    stream
      .pipe(
        csvParser({
          mapHeaders: ({ header }) => normalizeHeader(header),
        })
      )
      .on('headers', (headers) => {
        detectedHeaders = headers;
      })
      .on('data', (data) => {
        rows.push(data);
      })
      .on('end', () => {
        resolve({ headers: detectedHeaders, rows });
      })
      .on('error', (error) => {
        reject(
          new InvariantError(`Berkas CSV tidak dapat dibaca: ${error.message}`)
        );
      });
  });

const parseExcelBuffer = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new InvariantError('Berkas Excel tidak memiliki sheet');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rawRows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });
  const rows = rawRows.map(normalizeRowKeys);
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  return { headers, rows };
};

const parseStockImportFile = async (file) => {
  if (!file || !file.buffer) {
    throw new InvariantError('Berkas wajib diunggah pada field file');
  }

  const ext = path.extname(file.originalname || '').toLowerCase();
  const parsed =
    ext === '.csv'
      ? await parseCsvBuffer(file.buffer)
      : parseExcelBuffer(file.buffer);

  if (parsed.rows.length === 0) {
    throw new InvariantError('Berkas kosong atau tidak memiliki baris data');
  }

  const missingColumns = REQUIRED_COLUMNS.filter(
    (col) => !parsed.headers.includes(col)
  );
  if (missingColumns.length > 0) {
    throw new InvariantError(
      `Kolom wajib tidak ditemukan: ${missingColumns.join(', ')}`
    );
  }

  return parsed.rows.map((row, index) => ({
    rowNumber: index + 2,
    tanggal: formatExcelDate(row.tanggal),
    sku: String(
      row.sku === undefined || row.sku === null ? '' : row.sku
    ).trim(),
    jenis: String(
      row.jenis === undefined || row.jenis === null ? '' : row.jenis
    ).trim(),
    qty: row.qty,
    catatan: String(
      row.catatan !== undefined && row.catatan !== null
        ? row.catatan
        : row.keterangan || row.ref || ''
    ).trim(),
  }));
};

module.exports = {
  parseStockImportFile,
};
