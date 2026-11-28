const XLSX = require('xlsx');

// Cegah CSV/formula injection: sel yang diawali karakter ini dieksekusi Excel sebagai rumus.
const FORMULA_PREFIX = /^[=+\-@\t\r]/;

const sanitizeCell = (value) => {
  if (typeof value === 'string' && FORMULA_PREFIX.test(value)) {
    return `'${value}`;
  }
  return value;
};

const escapeCsv = (value) => {
  if (value === null || value === undefined) {
    return '';
  }
  const text = String(sanitizeCell(value));
  return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/**
 * @param {Array<object>} rows
 * @param {Array<{key: string, header: string}>} columns
 * @returns {Buffer} CSV UTF-8 dengan BOM agar terbaca benar di Excel
 */
const buildCsv = (rows, columns, { bom = true } = {}) => {
  const lines = [columns.map((col) => escapeCsv(col.header)).join(',')];
  rows.forEach((row) => {
    lines.push(columns.map((col) => escapeCsv(row[col.key])).join(','));
  });
  return Buffer.from(`${bom ? '\uFEFF' : ''}${lines.join('\r\n')}\r\n`, 'utf8');
};

/**
 * @param {Array<{name: string, rows: object[], columns: Array<{key, header}>}>} sheets
 * @returns {Buffer} berkas .xlsx
 */
const buildXlsx = (sheets) => {
  const workbook = XLSX.utils.book_new();
  sheets.forEach((sheet) => {
    const aoa = [
      sheet.columns.map((col) => col.header),
      ...sheet.rows.map((row) =>
        sheet.columns.map((col) => sanitizeCell(row[col.key]))
      ),
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(aoa);
    worksheet['!cols'] = sheet.columns.map((col) => ({
      wch: Math.max(col.header.length + 2, 12),
    }));
    XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name.slice(0, 31));
  });
  return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
};

module.exports = {
  buildCsv,
  buildXlsx,
};
