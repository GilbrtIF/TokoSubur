import axios from 'axios';

// 1. Buat Instance Axios
// Gunakan environment variable (VITE_API_URL) jika nanti sudah deploy ke production
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000', // Sesuaikan dengan URL backend Anda
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // Batas waktu request (10 detik)
});

// 2. Request Interceptor
// Fungsi ini akan dijalankan SEBELUM request dikirim ke server
api.interceptors.request.use(
  (config) => {
    // Ambil token dari localStorage
    const token = localStorage.getItem('accessToken');
    
    // Jika token ada, sisipkan ke header Authorization
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 3. Response Interceptor (Opsional tapi Sangat Direkomendasikan)
// Fungsi ini akan dijalankan SETELAH response diterima dari server
api.interceptors.response.use(
  (response) => {
    // Jika request sukses, langsung kembalikan datanya
    return response;
  },
  (error) => {
    // Jika server merespons dengan status 401 (Unauthorized / Token Expired)
    if (error.response && error.response.status === 401) {
      // Hapus token yang sudah tidak valid
      localStorage.removeItem('accessToken');
      
      // Redirect paksa ke halaman login
      window.location.href = '/login';
    }
    
    return Promise.reject(error);
  }
);

export default api;