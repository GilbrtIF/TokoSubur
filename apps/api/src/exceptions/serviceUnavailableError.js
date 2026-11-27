const ClientError = require('./clientError');

/**
 * Layanan eksternal (mis. ML/AI service) tidak tersedia atau gagal merespons.
 * statusCode 503 (tidak tersedia) atau 502 (respons tidak valid).
 */
class ServiceUnavailableError extends ClientError {
  constructor(message, statusCode = 503) {
    super(message, statusCode);
    this.name = 'ServiceUnavailableError';
  }
}

module.exports = ServiceUnavailableError;
