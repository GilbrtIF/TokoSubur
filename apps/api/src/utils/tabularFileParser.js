const path = require('path');
const { Readable } = require('stream');
const csvParser = require('csv-parser');
const XLSX = require('xlsx');
const { InvariantError } = require('../exceptions');

const normalizeHeader = (header) =>
  String(header || '')
    .replace(/^\uFEFF/, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');

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

/**
 * Mengubah nilai sel tanggal menjadi 'YYYY-MM-DD'.
 * Sel tanggal Excel dibaca sebagai serial number (cellDates: false) lalu
 * dikonversi tanpa zona waktu agar tidak bergeser di WIB.
 */
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

    Readable.from(buffer)
      .pipe(csvParser({ mapHeaders: ({ header }) => normalizeHeader(header) }))
      .on('headers', (headers) => {
        detectedHeaders = headers;
      })
      .on('data', (data) => rows.push(data))
      .on('end', () => resolve({ headers: detectedHeaders, rows }))
      .on('error', (error) =>
        reject(
          new InvariantError(`Berkas CSV tidak dapat dibaca: ${error.message}`)
        )
      );
  });

const parseExcelBuffer = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer', cellDates: false });
  const firstSheetName = workbook.SheetNames[0];

  if (!firstSheetName) {
    throw new InvariantError('Berkas Excel tidak memiliki sheet');
  }

  const worksheet = workbook.Sheets[firstSheetName];
  const rows = XLSX.utils
    .sheet_to_json(worksheet, { defval: '' })
    .map(normalizeRowKeys);
  const headers = rows.length > 0 ? Object.keys(rows[0]) : [];

  return { headers, rows };
};

/**
 * Membaca berkas CSV/XLSX hasil upload multer (memory storage).
 * @param {object} file req.file dari multer
 * @param {object} options
 * @param {string[]} options.requiredColumns kolom wajib (nama kanonik)
 * @param {Object<string,string[]>} options.aliases nama kanonik -> alternatif header
 * @returns {Promise<Array<object>>} baris dengan kunci kanonik + rowNumber (baris Excel)
 */
const parseTabularFile = async (
  file,
  { requiredColumns = [], aliases = {} } = {}
) => {
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

  const resolveColumn = (canonical) => {
    const candidates = [canonical, ...(aliases[canonical] || [])];
    return candidates.find((name) => parsed.headers.includes(name)) || null;
  };

  const missingColumns = requiredColumns.filter((col) => !resolveColumn(col));
  if (missingColumns.length > 0) {
    throw new InvariantError(
      `Kolom wajib tidak ditemukan: ${missingColumns.join(', ')}`
    );
  }

  const canonicalColumns = [
    ...new Set([...requiredColumns, ...Object.keys(aliases)]),
  ];
  const columnMap = canonicalColumns
    .map((canonical) => [canonical, resolveColumn(canonical)])
    .filter(([, source]) => source !== null);

  return parsed.rows.map((row, index) => {
    const result = { rowNumber: index + 2 };
    columnMap.forEach(([canonical, source]) => {
      result[canonical] = row[source];
    });
    return result;
  });
};

module.exports = {
  parseTabularFile,
  formatExcelDate,
};
