# Tokosubu - Front-End Setup (React + Vite)

Selamat datang di divisi Front-End! Panduan ini adalah acuan wajib untuk melakukan *setup* lingkungan pengembangan (*development environment*) di laptop masing-masing.

> **Prasyarat:** Pastikan kamu sudah menginstall **Node.js (v24 LTS)** dan menggunakan terminal **Git Bash**.

---

## 🛠️ Langkah 1: Inisialisasi Project (Jika Folder Masih Kosong)

Jika folder `apps/web` masih kosong (belum ada file `package.json`), buka terminal di dalam folder ini dan jalankan *scaffolding* React menggunakan Vite:

```bash
npm create vite@latest . -- --template react
```

> *(Jika muncul pertanyaan di terminal, pilih `y` atau ketik `Yes` untuk melanjutkan di folder saat ini).*

---

## 📦 Langkah 2: Instalasi Packages yang Dibutuhkan

Kita tidak hanya butuh React dasar. Kita perlu library tambahan untuk routing, desain, HTTP request, dan grafik. Jalankan perintah ini satu per satu:

```bash
# 1. Library Utama untuk Routing & HTTP Request
# - react-router-dom: Untuk berpindah halaman (Dashboard, Inventory, dll)
# - axios: Untuk memanggil API dari Back-End (Express)
npm install react-router-dom axios

# 2. Library UI & Ikon
# - lucide-react: Ikon modern (sesuai desain mockup UI kita)
npm install lucide-react

# 3. Library Grafik (Untuk halaman Dashboard & Sales Analytics)
# - recharts: Library grafik berbasis SVG yang sangat mudah dikustomisasi
npm install recharts

# 4. Library Styling (Tailwind CSS)
npm install -D tailwindcss @tailwindcss/vite
npx tailwindcss init -p

#5. Icon 
npm install react-icons
npm install lucide-react  

```

---

## ⚙️ Langkah 3: Konfigurasi Styling (Tailwind CSS)

Setelah Tailwind terinstall, kita harus mengonfigurasinya.

1. Buka file `tailwind.config.js` yang baru terbentuk, lalu ganti isinya menjadi:

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Sesuaikan dengan warna desain UI (Hijau & Kuning)
        primary: '#22c55e',
        secondary: '#f59e0b',
      },
    },
  },
  plugins: [],
};
```

2. Buka file `src/index.css`, hapus semua isinya, dan ganti dengan:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 🔑 Langkah 4: Konfigurasi Environment (.env)

Kita perlu memberi tahu React di mana letak API Back-End berjalan. Buat file `.env` di dalam folder `apps/web/` dan isi dengan:

```env
VITE_API_URL=http://localhost:3000/api
```

> **Catatan:** Jangan lupa buat juga file `.env.example` dengan isi yang sama, agar template-nya masuk ke GitHub.

---

## 🚀 Langkah 5: Jalankan Aplikasi

Sekarang lingkungan pengembanganmu sudah siap! Jalankan:

```bash
npm run dev
```

Buka `http://localhost:5173` di browser.

---

## 📂 Struktur Folder Wajib

Agar kode tidak berantakan, patuhi struktur folder di dalam `src/` berikut:

```text
src/
├── components/   # Komponen reusable (Button, Card, Table, Modal)
├── contexts/     # State global (AuthContext untuk status login)
├── hooks/        # Custom hooks (useAuth, useFetch)
├── pages/        # Halaman utama (Login, Dashboard, Inventory, dll)
├── services/     # Konfigurasi Axios (api.js)
├── styles/       # File CSS global atau custom styling
├── utils/        # Fungsi bantuan (format tanggal, format rupiah)
└── main.jsx      # Entry point React
```

---

## 💡 Panduan Pemanggilan API (Axios)

Karena kita sering memanggil API, buat satu file konfigurasi di `src/services/api.js`:

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// Otomatis menyisipkan token JWT jika user sudah login
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export default api;
```

**Cara pakainya di halaman (`pages/`):**

```javascript
import api from '../services/api';

const fetchProducts = async () => {
  try {
    const res = await api.get('/products');
    console.log(res.data);
  } catch (err) {
    alert('Gagal mengambil data');
  }
};
```