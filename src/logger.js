import config from './config.js';

const logger = (args, mode) => console[mode](new Date().toISOString(), config.serviceName, ...args);

export default {
  log: (...args) => logger(args, 'log'),
  error: (...args) => logger(args, 'error'),
};
