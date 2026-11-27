require('./config/env');

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stockRoutes');
const productRoutes = require('./routes/productRoutes');
const masterRoutes = require('./routes/masterRoutes');
const transactionRoutes = require('./routes/transactionRoutes');
const analyticsRoutes = require('./routes/analyticsRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const dataQualityRoutes = require('./routes/dataQualityRoutes');
const forecastRoutes = require('./routes/forecastRoutes');
const aiRoutes = require('./routes/aiRoutes');
const { authGuard } = require('./middleware/authMiddleware');
const errorHandler = require('./middleware/errorHandler');
const { notFoundHandler } = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'API Toko Subur berjalan',
  });
});

// Route publik
app.use('/api', authRoutes);

// Route terlindungi (wajib header Authorization: Bearer <token>)
app.use('/api/stocks', authGuard, stockRoutes);
app.use('/api/products', authGuard, productRoutes);
app.use('/api/transactions', authGuard, transactionRoutes);
app.use('/api', masterRoutes);
app.use('/api', analyticsRoutes);
app.use('/api', dataQualityRoutes);
app.use('/api/settings', authGuard, settingsRoutes);
app.use('/api/forecasts', forecastRoutes);
app.use('/api/ai', authGuard, aiRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
