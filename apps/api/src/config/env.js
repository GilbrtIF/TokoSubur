// apps/api/src/config/env.js

require('dotenv').config();

const requiredVariables = ['DATABASE_URL', 'JWT_SECRET'];

const missingVariables = requiredVariables.filter(
  (variable) => !process.env[variable]
);

if (missingVariables.length > 0) {
  throw new Error(
    `Environment variables belum dikonfigurasi: ${missingVariables.join(', ')}`
  );
}

module.exports = {
  databaseUrl: process.env.DATABASE_URL,
  port: Number(process.env.PORT) || 3000,
  nodeEnv: process.env.NODE_ENV || 'development',
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '1d',
  mlServiceUrl: process.env.ML_SERVICE_URL
    ? process.env.ML_SERVICE_URL.replace(/\/+$/, '')
    : null,
  mlServiceTimeoutMs: Number(process.env.ML_SERVICE_TIMEOUT_MS) || 30000,
  // Kunci rahasia untuk panggilan service-to-service (ML service -> API ini)
  serviceApiKey: process.env.SERVICE_API_KEY || null,
};
