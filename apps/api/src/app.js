
// apps/api/src/app.js
// Load environment configuration sebelum mengimpor routes
require('./config/env');

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');

const app = express();

// Global middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api', authRoutes);

// Health check
app.get('/', (req, res) => {
  res.status(200).json({
    message: 'API Toko Subur berjalan',
  });
});

module.exports = app;
