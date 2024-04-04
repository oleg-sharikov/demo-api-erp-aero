import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';

import logger from './logger.js';
import config from './config.js';
import createController from './controller.js';
import createValidator from './validator.js';
import createRouter from './router.js';
import createDataBase from './db/index.js';

const server = express();

async function init() {
  try {
    server.use(cors());
    server.use(express.json());
    server.use(express.urlencoded({ extended: false }));
    server.use(cookieParser());

    const { dbMethods, dbDisconnect, sequelize } = await createDataBase();

    const controller = await createController({
      dbMethods,
      sequelize,
    });

    const validator = await createValidator();

    await createRouter({ server, controller, validator });

    server.listen(config.servicePort, () => {
      logger.log(`listening on port ${config.servicePort}`);
    });

    async function exit() {
      logger.log('Terminating DB connection...');
      await dbDisconnect();
      process.exit(0);
    }
    process.on('SIGINT', exit).on('SIGTERM', exit);
  } catch (err) {
    logger.error(err.message || err);
    process.exit(1);
  }
}

init();
