// apps/api/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');

// Import routes
const authRoutes = require('./src/routes/auth');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Gunakan Routes
app.use(authRoutes);

// Route dasar untuk tes
app.get('/', (req, res) => {
  res.send('API Toko Subur Berjalan!');
});

// ✅ Ekspor app, JANGAN jalankan app.listen di sini
module.exports = app;