const { InvariantError } = require('../exceptions');
const { ensureObject, parseText, parseBoolean } = require('./common');

const MAX_MESSAGE_LENGTH = 2000;
const MAX_HISTORY = 20;

const validateChatPayload = (rawBody) => {
  const body = ensureObject(rawBody);
  const message = parseText(body.message, 'message', {
    required: true,
    maxLength: MAX_MESSAGE_LENGTH,
  });

  let history = [];
  if (body.history !== undefined && body.history !== null) {
    if (!Array.isArray(body.history)) {
      throw new InvariantError('history harus berupa array');
    }
    history = body.history.slice(-MAX_HISTORY).map((item, index) => {
      ensureObject(item, `history[${index}]`);
      if (!['user', 'assistant'].includes(item.role)) {
        throw new InvariantError(
          `history[${index}].role harus user atau assistant`
        );
      }
      return {
        role: item.role,
        content: parseText(item.content, `history[${index}].content`, {
          required: true,
          maxLength: 8000,
        }),
      };
    });
  }

  const includeContext = parseBoolean(body.includeContext, 'includeContext');
  return {
    message,
    history,
    includeContext: includeContext === null ? true : includeContext,
  };
};

module.exports = { validateChatPayload };
