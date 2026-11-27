const dataQualityService = require('../services/dataQualityService');
const validators = require('../validators/dataQualityValidator');

const sendList = (res, result) =>
  res
    .status(200)
    .json({ status: 'success', data: result.data, meta: result.meta });

const getStatus = async (req, res, next) => {
  try {
    const data = await dataQualityService.getStatus();
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    return next(error);
  }
};

const getImportBatches = async (req, res, next) => {
  try {
    return sendList(
      res,
      await dataQualityService.getImportBatches(
        validators.validateImportBatchQuery(req.query)
      )
    );
  } catch (error) {
    return next(error);
  }
};

const getRejectedRows = async (req, res, next) => {
  try {
    return sendList(
      res,
      await dataQualityService.getRejectedRows(
        validators.validateRejectedQuery(req.query)
      )
    );
  } catch (error) {
    return next(error);
  }
};

const getAmbiguousSales = async (req, res, next) => {
  try {
    return sendList(
      res,
      await dataQualityService.getAmbiguousSales(
        validators.validateAmbiguousQuery(req.query)
      )
    );
  } catch (error) {
    return next(error);
  }
};

const getProductMappings = async (req, res, next) => {
  try {
    return sendList(
      res,
      await dataQualityService.getProductMappings(
        validators.validateMappingQuery(req.query)
      )
    );
  } catch (error) {
    return next(error);
  }
};

const saveProductMapping = async (req, res, next) => {
  try {
    const payload = validators.validateMappingPayload(req.body);
    const { created, mapping } =
      await dataQualityService.saveProductMapping(payload);
    return res.status(created ? 201 : 200).json({
      status: 'success',
      message: created
        ? 'Mapping produk baru disimpan'
        : 'Mapping produk diperbarui',
      data: mapping,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getStatus,
  getImportBatches,
  getRejectedRows,
  getAmbiguousSales,
  getProductMappings,
  saveProductMapping,
};
