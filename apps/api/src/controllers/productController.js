const productService = require('../services/productService');
const {
  validateCreateProductPayload,
  validateUpdateProductPayload,
  validateProductListQuery,
  validateSkuParam,
} = require('../validators/productValidator');

const getProducts = async (req, res, next) => {
  try {
    const filter = validateProductListQuery(req.query);
    const result = await productService.getProducts(filter);
    return res
      .status(200)
      .json({ status: 'success', data: result.data, meta: result.meta });
  } catch (error) {
    return next(error);
  }
};

const getCategories = async (req, res, next) => {
  try {
    const data = await productService.getCategories();
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    return next(error);
  }
};

const getProductBySku = async (req, res, next) => {
  try {
    const sku = validateSkuParam(req.params);
    const data = await productService.getProductBySku(sku);
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    return next(error);
  }
};

const createProduct = async (req, res, next) => {
  try {
    const payload = validateCreateProductPayload(req.body);
    const data = await productService.createProduct(payload);
    return res.status(201).json({
      status: 'success',
      message: `Produk ${data.sku} berhasil ditambahkan`,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

const updateProduct = async (req, res, next) => {
  try {
    const sku = validateSkuParam(req.params);
    const payload = validateUpdateProductPayload(req.body);
    const data = await productService.updateProduct(sku, payload);
    return res.status(200).json({
      status: 'success',
      message: `Produk ${sku} berhasil diperbarui`,
      data,
    });
  } catch (error) {
    return next(error);
  }
};

const deleteProduct = async (req, res, next) => {
  try {
    const sku = validateSkuParam(req.params);
    const data = await productService.deleteProduct(sku);
    return res
      .status(200)
      .json({ status: 'success', message: data.message, data });
  } catch (error) {
    return next(error);
  }
};

module.exports = {
  getProducts,
  getCategories,
  getProductBySku,
  createProduct,
  updateProduct,
  deleteProduct,
};
