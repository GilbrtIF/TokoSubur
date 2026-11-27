const settingsService = require('../services/settingsService');
const {
  validateReorderListQuery,
  validateSingleReorderPayload,
  validateBulkReorderPayload,
} = require('../validators/settingsValidator');

const getReorderSettings = async (req, res, next) => {
  try {
    const result = await settingsService.getReorderSettings(
      validateReorderListQuery(req.query)
    );
    return res
      .status(200)
      .json({ status: 'success', data: result.data, meta: result.meta });
  } catch (error) {
    return next(error);
  }
};

const updateReorderSetting = async (req, res, next) => {
  try {
    const items = validateSingleReorderPayload(req.params, req.body);
    const [data] = await settingsService.updateReorderSettings(items);
    return res.status(200).json({
      status: 'success',
      message: 'Pengaturan stok minimum diperbarui',
      data,
    });
  } catch (error) {
    return next(error);
  }
};

const updateReorderSettingsBulk = async (req, res, next) => {
  try {
    const items = validateBulkReorderPayload(req.body);
    const data = await settingsService.updateReorderSettings(items);
    return res.status(200).json({
      status: 'success',
      message: `${data.length} pengaturan stok minimum diperbarui`,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getReorderSettings,
  updateReorderSetting,
  updateReorderSettingsBulk,
};
