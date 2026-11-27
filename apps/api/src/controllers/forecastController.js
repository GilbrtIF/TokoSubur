const forecastService = require('../services/forecastService');
const validators = require('../validators/forecastValidator');

const ok = (res, data, status = 200, extra = {}) =>
  res.status(status).json({ status: 'success', ...extra, data });

const getModels = async (req, res, next) => {
  try {
    return ok(res, await forecastService.getModels());
  } catch (error) {
    return next(error);
  }
};

const getForecasts = async (req, res, next) => {
  try {
    const result = await forecastService.getForecasts(
      validators.validateForecastQuery(req.query)
    );
    return ok(res, result.data, 200, { meta: result.meta });
  } catch (error) {
    return next(error);
  }
};

const getSkuForecastChart = async (req, res, next) => {
  try {
    const { sku, historyDays } = validators.validateSkuChartRequest(
      req.params,
      req.query
    );
    return ok(
      res,
      await forecastService.getSkuForecastChart(sku, { historyDays })
    );
  } catch (error) {
    return next(error);
  }
};

const getDemandChanges = async (req, res, next) => {
  try {
    const result = await forecastService.getDemandChanges(
      validators.validateDemandChangeQuery(req.query)
    );
    return ok(res, result.data, 200, { meta: result.meta });
  } catch (error) {
    return next(error);
  }
};

const getStockProjection = async (req, res, next) => {
  try {
    const result = await forecastService.getStockProjection(
      validators.validateProjectionQuery(req.query)
    );
    return ok(res, result.data, 200, { meta: result.meta });
  } catch (error) {
    return next(error);
  }
};

const createModelRun = async (req, res, next) => {
  try {
    const data = await forecastService.createModelRun(
      validators.validateCreateRunPayload(req.body)
    );
    return ok(res, data, 201, {
      message: `Model run ${data.model.runId} tersimpan`,
    });
  } catch (error) {
    return next(error);
  }
};

const appendForecasts = async (req, res, next) => {
  try {
    const { runId, forecasts } = validators.validateAppendForecastsPayload(
      req.params,
      req.body
    );
    const data = await forecastService.appendForecasts(runId, forecasts);
    return ok(res, data, 201, {
      message: `${data.insertedForecasts} prediksi ditambahkan`,
    });
  } catch (error) {
    return next(error);
  }
};

const activateModel = async (req, res, next) => {
  try {
    const data = await forecastService.activateModel(
      validators.validateRunIdParam(req.params)
    );
    return ok(res, data, 200, {
      message: `Model run ${data.runId} sekarang aktif`,
    });
  } catch (error) {
    return next(error);
  }
};

const exportTrainingDataset = async (req, res, next) => {
  try {
    const result = await forecastService.exportTrainingDataset(
      validators.validateTrainingDatasetQuery(req.query)
    );
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${result.fileName}"`
    );
    res.setHeader('X-Row-Count', String(result.rowCount));
    return res.status(200).send(result.buffer);
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getModels,
  getForecasts,
  getSkuForecastChart,
  getDemandChanges,
  getStockProjection,
  createModelRun,
  appendForecasts,
  activateModel,
  exportTrainingDataset,
};
