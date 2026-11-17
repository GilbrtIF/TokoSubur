// src/services/authService.js
import { mockUsers } from '../utils/mockUsers';

export const loginService = async ({ username, password }) => {
  // Simulasi delay jaringan (1 detik) agar loading spinner terlihat
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // 1. Cari user berdasarkan username
      const user = mockUsers.find((u) => u.username === username);

      // 2. Validasi: Apakah user ada?
      if (!user) {
        return reject(new Error('Username tidak ditemukan.'));
      }

      // 3. Validasi: Apakah password cocok?
      if (user.password !== password) {
        return reject(new Error('Password salah. Silakan coba lagi.'));
      }

      // 4. Jika sukses, buat token palsu (JWT simulation)
      const fakeToken = `mock-jwt-token-${user.id}-${Date.now()}`;
      
      // 5. Kembalikan data (biasanya nanti bentuknya mirip response backend asli)
      resolve({
        accessToken: fakeToken,
        user: {
          id: user.id,
          username: user.username,
          name: user.name,
          role: user.role
        }
      });
    }, 1000);
  });
};