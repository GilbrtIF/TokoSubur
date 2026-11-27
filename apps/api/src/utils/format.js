/** Konversi kolom NUMERIC (string dari pg) menjadi number, null tetap null. */
const toNumberOrNull = (value) =>
  value === null || value === undefined ? null : Number(value);

const toNumber = (value) =>
  value === null || value === undefined ? 0 : Number(value);

const round2 = (value) => Math.round(Number(value) * 100) / 100;

/** Memotong teks agar muat di kolom VARCHAR. */
const clipText = (value, maxLength) => {
  if (value === null || value === undefined) {
    return value;
  }
  const text = String(value);
  return text.length > maxLength ? `${text.slice(0, maxLength - 3)}...` : text;
};

const escapeLikePattern = (value) => value.replace(/[\\%_]/g, '\\$&');

module.exports = {
  toNumberOrNull,
  toNumber,
  round2,
  clipText,
  escapeLikePattern,
};
