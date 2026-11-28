const aiService = require('../services/aiService');
const { validateChatPayload } = require('../validators/aiValidator');

const chat = async (req, res, next) => {
  try {
    const payload = validateChatPayload(req.body);
    const data = await aiService.chat(payload, req.user);
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    return next(error);
  }
};

const health = async (req, res, next) => {
  try {
    const data = await aiService.health();
    return res.status(200).json({ status: 'success', data });
  } catch (error) {
    return next(error);
  }
};

module.exports = { chat, health };
