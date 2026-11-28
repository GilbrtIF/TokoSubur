const mlServiceClient = require('../integrations/mlServiceClient');
const analyticsService = require('./analyticsService');
const { ServiceUnavailableError } = require('../exceptions');

/**
 * Ringkasan data bisnis terkini agar LLM di ML service dapat menjawab
 * tanpa akses langsung ke database. Sengaja ringkas (angka agregat saja).
 */
const buildBusinessContext = async () => {
  const summary = await analyticsService.getDashboardSummary({});
  return {
    periode: summary.periode,
    kpi: {
      omzet: summary.cards.omzet,
      jumlahTransaksi: summary.cards.jumlahTransaksi,
      qtyTerjual: summary.cards.qtyTerjual,
      skuKritis: summary.cards.skuKritis,
    },
    penjualanPerKanal: summary.charts.penjualanPerKanal,
    produkTerlaris: summary.lists.produkTerlaris,
    stokKritis: summary.lists.stokKritis,
    rekomendasiRestok: summary.lists.rekomendasiRestok,
  };
};

const chat = async ({ message, history, includeContext }, user) => {
  if (!mlServiceClient.isConfigured()) {
    throw new ServiceUnavailableError(
      'Layanan AI belum dikonfigurasi (ML_SERVICE_URL kosong)'
    );
  }

  const context = includeContext ? await buildBusinessContext() : null;
  const response = await mlServiceClient.chat({
    message,
    history,
    user: { username: user.username, role: user.role },
    context,
  });

  const reply = response.reply || response.answer || response.message;
  if (typeof reply !== 'string' || reply.trim() === '') {
    throw new ServiceUnavailableError(
      'Respons layanan AI tidak memiliki field reply',
      502
    );
  }

  return {
    reply,
    sources: Array.isArray(response.sources) ? response.sources : [],
    model: response.model || null,
    contextIncluded: Boolean(context),
  };
};

const health = () => mlServiceClient.health();

module.exports = { chat, health };
