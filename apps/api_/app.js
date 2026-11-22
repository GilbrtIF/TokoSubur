// apps/api/app.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authRoutes = require('./src/routes/auth'); // ✅ Import dari folder src

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes); // ✅ Gunakan prefix /api agar rapi

app.get('/', (req, res) => {
  res.send('API Toko Subur Berjalan!');
});

module.exports = app;