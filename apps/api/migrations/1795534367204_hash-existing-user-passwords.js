/**
 * Hash Existing User Passwords
 *
 * Mengonversi password plaintext yang sudah tersimpan
 * menjadi bcrypt hash.
 *
 * Migration ini tidak mengubah struktur tabel.
 */

const bcrypt = require('bcryptjs');

const BCRYPT_PATTERN = /^\$2[aby]\$\d{2}\$/;

exports.up = async (pgm) => {
  // 1. Ambil seluruh data pengguna
  const result = await pgm.db.query(`
    SELECT id, username, password_hash
    FROM users
    ORDER BY id
  `);

  // 2. Proses setiap password
  for (const user of result.rows) {
    // Lewati jika password sudah menggunakan bcrypt
    if (BCRYPT_PATTERN.test(user.password_hash)) {
      continue;
    }

    // 3. Hash password menggunakan bcrypt
    const hashedPassword = await bcrypt.hash(user.password_hash, 12);

    // 4. Update password_hash di database
    const updateResult = await pgm.db.query(
      `
        UPDATE users
        SET
          password_hash = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
          AND password_hash = $3
      `,
      [hashedPassword, user.id, user.password_hash]
    );

    // Pastikan data berhasil diperbarui
    if (updateResult.rowCount !== 1) {
      throw new Error(`Gagal memperbarui password user ID ${user.id}`);
    }
  }
};

// Password hashing bersifat satu arah.
// Jangan mengembalikan password ke plaintext saat rollback.
exports.down = async () => {
  // Password bcrypt tidak dikembalikan menjadi plaintext.
  // Hash tetap dipertahankan untuk menjaga keamanan.
};
