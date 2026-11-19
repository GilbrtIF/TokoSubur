// apps/api/server.js
require('dotenv').config();
const app = require('./app'); // Import setup Express dari app.js

const PORT = process.env.PORT || 3000;

// ✅ Jalankan server HANYA di file ini
app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});