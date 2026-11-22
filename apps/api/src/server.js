// apps/api/server.js
require('dotenv').config();
const app = require('./app'); // ✅ Gunakan './app'

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`🚀 Server berjalan di http://localhost:${PORT}`);
});