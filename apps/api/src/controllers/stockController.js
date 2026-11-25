const { validateStockQuery } = require('../validators/stockValidator');
const stockService = require('../services/stockService');

const getStocks = async (req, res, next) => {
  try {
    const validatedQuery = validateStockQuery(req.query);
    const { data, meta } = await stockService.getStocks(validatedQuery);

    return res.status(200).json({
      status: 'success',
      data,
      meta,
    });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getStocks,
};
