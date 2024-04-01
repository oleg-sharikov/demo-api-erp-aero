import logger from './logger.js';

function send(errorName, err, res, statusCode) {
  logger.error(`${errorName}:`, err?.message || err);
  res.status(statusCode || 500).send(errorName);
}

export default {
  send,
};
