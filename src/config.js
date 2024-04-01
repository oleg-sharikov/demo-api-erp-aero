const { env } = process;

import { TEN_MEGABYTES_IN_BYTES } from './constants.js';

export default {
  serviceName: 'api',
  servicePort: parseInt(env.API_SERVICE_PORT, 10) || 3355,
  acceptableMimeTypes: env.ACCEPTABLE_MIME_TYPES
    ? JSON.parse(env.ACCEPTABLE_MIME_TYPES)
    : ['image/jpeg', 'application/msword', 'application/zip'],
  usersFilesPath: env.USERS_IMAGES_PATH || '../users_files',
  multer: {
    limits: {
      fileSize: parseInt(env.FILE_SIZE_LIMIT_BYTES, 10) || TEN_MEGABYTES_IN_BYTES,
      files: 1,
    },
  },
  maxFilesList: parseInt(env.MAX_FILES_LIST, 10) || 100,
  db: {
    dialect: env.CLIENT_DB_DIALECT || 'mysql',
    host: env.CLIENT_DB_HOST || 'localhost',
    port: env.CLIENT_DB_PORT || '3306',
    username: env.CLIENT_DB_USER || 'root',
    password: env.CLIENT_DB_PASS || 'root',
    database: env.CLIENT_DB_NAME || 'erpaero',
  },
  validator: {
    userPassword: {
      minLength: parseInt(env.USER_PASSWORD_MIN_LENGTH, 10) || 8,
      minLowercase: parseInt(env.USER_PASSWORD_MIN_LOWERCASE, 10) || 1,
      minUppercase: parseInt(env.USER_PASSWORD_MIN_UPPERCASE, 10) || 1,
      minNumbers: parseInt(env.USER_PASSWORD_MIN_NUMBERS, 10) || 0,
      minSymbols: parseInt(env.USER_PASSWORD_MIN_SYMBOLS, 10) || 0,
    },
  },
  security: {
    accessTokenSecret: env.ACCESS_TOKEN_SECRET || 'abc',
    accessTokenExpiry: env.ACCESS_TOKEN_EXPIRY || '10m',
    refreshTokenSecret: env.REFRESH_TOKEN_SECRET || 'abc',
    refreshTokenCookieName: env.REFRESH_TOKEN_COOKIE_NAME || 'refreshToken',
    defaultRandomIdLength: parseInt(env.DEFAULT_RANDOM_ID_LENGTH, 10) || 64,
  },
  cookies: { secure: true, httpOnly: true },
};
