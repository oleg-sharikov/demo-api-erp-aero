import { Sequelize } from 'sequelize';

import config from '../config.js';
import createCommonDbMethods from './methods-common.js';
import createSpecificDbMethods from './methods-specific.js';
import createDbModels from './models.js';
import logger from '../logger.js';

export default async function createDataBase() {
  try {
    const sequelize = new Sequelize({
      ...config.db,
      logging: process.env.DB_LOGGING ? msg => logger.log(msg) : false,
    });

    const models = await createDbModels(sequelize);

    if (process.env.DB_SYNC) {
      await sequelize.sync({ alter: true });
    }

    return {
      dbMethods: {
        file: {
          ...createCommonDbMethods(models.file),
          ...createSpecificDbMethods(sequelize, models).file,
        },
        user: {
          ...createCommonDbMethods(models.user),
          ...createSpecificDbMethods(sequelize, models).user,
        },
        refreshToken: {
          ...createCommonDbMethods(models.refreshToken),
          ...createSpecificDbMethods(sequelize, models).refreshToken,
        },
      },
      dbDisconnect: () => {
        return sequelize.close();
      },
      sequelize,
    };
  } catch (err) {
    logger.error('Sequelize_failed', err);
  }
}
