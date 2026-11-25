require('./config/env');

const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/auth');
const stockRoutes = require('./routes/stockRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.status(200).json({
    message: 'API Toko Subur berjalan',
  });
});

app.use('/api/stocks', stockRoutes);
app.use('/api', authRoutes);

app.use(errorHandler);

module.exports = app;
