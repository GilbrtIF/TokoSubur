const { parseTabularFile, formatExcelDate } = require('./tabularFileParser');

const REQUIRED_COLUMNS = ['tanggal', 'sku', 'jenis', 'qty'];

const asTrimmedText = (value) =>
  String(value === undefined || value === null ? '' : value).trim();

const parseStockImportFile = async (file) => {
  const rows = await parseTabularFile(file, {
    requiredColumns: REQUIRED_COLUMNS,
    aliases: { catatan: ['keterangan', 'ref'] },
  });

  return rows.map((row) => ({
    rowNumber: row.rowNumber,
    tanggal: formatExcelDate(row.tanggal),
    sku: asTrimmedText(row.sku),
    jenis: asTrimmedText(row.jenis),
    qty: row.qty,
    catatan: asTrimmedText(row.catatan),
  }));
};

module.exports = {
  parseStockImportFile,
};
