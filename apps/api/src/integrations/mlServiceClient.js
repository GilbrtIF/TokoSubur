/**
 * Klien HTTP ke Python ML/AI Service (FastAPI).
 * Kontrak endpoint didokumentasikan di apps/api/docs/api-contract.md (bagian Integrasi ML Service).
 */
const { mlServiceUrl, mlServiceTimeoutMs } = require('../config/env');
const { ServiceUnavailableError } = require('../exceptions');

const isConfigured = () => Boolean(mlServiceUrl);

const parseJson = (text) => {
  if (!text) {
    return null;
  }
  try {
    return JSON.parse(text);
    // eslint-disable-next-line no-unused-vars
  } catch (error) {
    return null; // bukan JSON valid
  }
};

const request = async (
  method,
  path,
  body,
  { timeoutMs = mlServiceTimeoutMs } = {}
) => {
  if (!isConfigured()) {
    throw new ServiceUnavailableError(
      'Layanan AI belum dikonfigurasi (ML_SERVICE_URL kosong)'
    );
  }

  let response;
  try {
    response = await fetch(`${mlServiceUrl}${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
  } catch (error) {
    const timedOut =
      error.name === 'TimeoutError' || error.name === 'AbortError';
    throw new ServiceUnavailableError(
      timedOut
        ? `Layanan AI tidak merespons dalam ${Math.round(timeoutMs / 1000)} detik`
        : 'Layanan AI tidak dapat dihubungi'
    );
  }

  const payload = parseJson(await response.text());

  if (!response.ok) {
    const detail = payload && (payload.detail || payload.message);
    throw new ServiceUnavailableError(
      `Layanan AI mengembalikan error ${response.status}${detail ? `: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}` : ''}`,
      502
    );
  }
  if (payload === null) {
    throw new ServiceUnavailableError(
      'Respons layanan AI bukan JSON yang valid',
      502
    );
  }
  return payload;
};

/**
 * POST {ML_SERVICE_URL}/api/ai/chat
 * Request : { message, history: [{ role, content }], user: { username, role }, context }
 * Response: { reply: string, sources?: any[], model?: string }
 */
const chat = (payload) => request('POST', '/api/ai/chat', payload);

const health = async () => {
  if (!isConfigured()) {
    return { configured: false, available: false };
  }
  try {
    await request('GET', '/', undefined, { timeoutMs: 5000 });
    return { configured: true, available: true };
  } catch (error) {
    return { configured: true, available: false, message: error.message };
  }
};

module.exports = {
  isConfigured,
  chat,
  health,
};
