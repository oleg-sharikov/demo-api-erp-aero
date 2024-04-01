import fs from 'fs-extra';
import jwt from 'jsonwebtoken';
import multer from 'multer';

import config from './config.js';
import crypto from './crypto.js';
import error from './error.js';

export default async function createController({ dbMethods, sequelize }) {
  async function authenticateByToken(req, res, next) {
    try {
      const authHeader = req.header('Authorization');

      if (!authHeader?.startsWith('Bearer ')) {
        return error.send('authentication_failed', 'authorization_header_empty', res, 401);
      }

      const token = authHeader.split(' ')?.[1];

      if (!token) {
        return error.send('authentication_failed', 'token_empty', res, 401);
      }

      const { decoded, err } = jwt.verify(
        token,
        config.security.accessTokenSecret,
        (err, decoded) => {
          if (err) {
            return { err };
          }
          return { decoded };
        },
      );

      if (err) {
        return error.send('authentication_failed', 'jwt_verification_failed', res, 403);
      }

      req.userId = decoded.userId;

      next();
    } catch (err) {
      error.send('authentication_failed', err, res);
    }
  }

  function generateAccessToken(userId) {
    return jwt.sign({ userId }, config.security.accessTokenSecret, {
      expiresIn: config.security.accessTokenExpiry,
    });
  }

  async function generateRefreshToken(userId) {
    const token = jwt.sign({ userId }, config.security.refreshTokenSecret);

    await dbMethods.refreshToken.create({ userId, token });

    return token;
  }

  async function getNewAccessToken(req, res) {
    try {
      const refreshToken = req.cookies?.[config.security.refreshTokenCookieName];

      if (!refreshToken) {
        return error.send('get_new_access_token_failed', 'refresh_token_empty', res, 401);
      }

      const refreshTokenData = await dbMethods.refreshToken.getByToken(refreshToken);

      if (!refreshTokenData) {
        return error.send('get_new_access_token_failed', 'refresh_token_not_found', res, 401);
      }

      jwt.verify(refreshToken, config.security.refreshTokenSecret, (err, tokenData) => {
        if (err) {
          return error.send('get_new_access_token_failed', 'jwt_verification_failed', res, 403);
        }
        const accessToken = generateAccessToken(tokenData.userId);
        res.json({ accessToken });
      });
    } catch (err) {
      error.send('get_new_access_token_failed', err, res);
    }
  }

  async function signIn(req, res) {
    try {
      const { emailOrPhone, password } = req.body;

      const user = await dbMethods.user.getByEmailOrPhone(emailOrPhone);

      if (!user || !(await crypto.verifyString(user.passwordHash, password))) {
        return error.send('signin_failed', 'wrong_password_or_user_not_found', res, 403);
      }

      const accessToken = generateAccessToken(user.id);
      const refreshToken = await generateRefreshToken(user.id);

      res.cookie(config.security.refreshTokenCookieName, refreshToken, config.cookies);
      res.json({ accessToken });
    } catch (err) {
      error.send('signin_failed', err, res);
    }
  }

  async function signUp(req, res) {
    try {
      const { email, phone, password } = req.body;

      if (await dbMethods.user.getByEmailOrPhone(email || phone)) {
        return error.send('signup_failed', 'username_not_available', res);
      }

      const createdUser = await dbMethods.user.create({
        email,
        phone,
        passwordHash: await crypto.hashPassword(password),
      });

      const accessToken = generateAccessToken(createdUser.id);
      const refreshToken = await generateRefreshToken(createdUser.id);

      res.cookie(config.security.refreshTokenCookieName, refreshToken, config.cookies);
      res.json({ accessToken });
    } catch (err) {
      error.send('signup_failed', err, res);
    }
  }

  async function logOut(req, res) {
    try {
      const refreshToken = req.cookies?.[config.security.refreshTokenCookieName];

      res.clearCookie(config.security.refreshTokenCookieName);

      if (refreshToken && !(await dbMethods.refreshToken.invalidateOld(refreshToken))) {
        return error.send('logout_failed', 'refresh_token_not_found', res, 403);
      }

      return res.sendStatus(200);
    } catch (err) {
      error.send('logout_failed', err, res);
    }
  }

  async function getUserInfo(req, res) {
    try {
      const user = await dbMethods.user.getById(req.userId);

      if (!user) {
        return error.send('get_user_info_failed', 'user_not_found', res, 404);
      }

      res.json({ id: user.email || user.phone });
    } catch (err) {
      error.send('get_user_info_failed', err, res);
    }
  }

  const multerDiskStorage = {
    destination: async (req, file, cb) => {
      const userFilesPath = `${config.usersFilesPath}/${req.userId}`;
      await fs.ensureDir(userFilesPath);
      cb(null, userFilesPath);
    },
    filename: (req, file, cb) => {
      const newFileName = crypto.createRandomId();
      const fileExtension = file.originalname.split('.').at(-1);
      req.fileExtension = fileExtension;
      req.newFileName = newFileName;
      cb(null, newFileName);
    },
  };

  const fileUpload = multer({ storage: multer.diskStorage(multerDiskStorage), ...config.multer });

  // TODO Read stream
  async function getFile(req, res) {
    try {
      const fileData = await dbMethods.file.getBySystemName(req.params.fileId);

      if (!fileData) {
        return error.send('get_file_failed', 'file_not_found', res, 404);
      }

      const { path, systemName, originalName, sizeBytes, mime, extension, userId } = fileData;

      if (!!Number(req.query.download)) {
        const file = await fs.readFile(`${config.usersFilesPath}/${path}`);

        res.set('Content-Type', mime);
        return res.send(file);
      }

      res.json({ systemName, originalName, sizeBytes, mime, extension, userId });
    } catch (err) {
      error.send('get_file_failed', err, res);
    }
  }

  async function listFiles(req, res) {
    try {
      let page = req.query.page || 1;

      const filesData = await dbMethods.file.find({
        offset: (page - 1) * req.query.listSize,
        limit: Number(req.query.listSize),
      });

      res.json(
        filesData.map(({ systemName, originalName, sizeBytes, mime, extension, userId }) => {
          return { systemName, originalName, sizeBytes, mime, extension, userId };
        }),
      );
    } catch (err) {
      error.send('list_files_failed', err, res);
    }
  }

  async function createFile(req, res) {
    try {
      const {
        file: { size, mimetype, originalname },
        newFileName,
        fileExtension,
        userId,
      } = req;

      const destinationPath = `${userId}/${newFileName}`;

      await dbMethods.file.create({
        path: destinationPath,
        systemName: newFileName,
        originalName: originalname,
        sizeBytes: size,
        mime: mimetype,
        extension: fileExtension,
        userId,
      });

      res.json({ sizeBytes: size, name: newFileName });
    } catch (err) {
      error.send('create_file_failed', err, res);
    }
  }

  async function deleteFile(req, res) {
    try {
      const filePath = `${config.usersFilesPath}/${req.userId}/${req.params.fileId}`;

      if (!(await dbMethods.file.deleteBySystemName(req.params.fileId))) {
        return error.send('delete_file_failed', 'file_not_found', res, 404);
      }

      await fs.unlink(filePath);

      return res.sendStatus(200);
    } catch (err) {
      error.send('delete_file_failed', err, res);
    }
  }

  async function updateFile(req, res) {
    try {
      const {
        file: { size, mimetype, originalname },
        newFileName,
        fileExtension,
        userId,
      } = req;

      const originalFileData = await dbMethods.file.getBySystemName(req.params.fileId);

      if (!originalFileData) {
        await fs.unlink(`${config.usersFilesPath}/${userId}/${newFileName}`);
        return error.send('update_file_failed', 'file_not_found', res, 404);
      }

      const destinationPath = `${userId}/${newFileName}`;

      await dbMethods.file.updateById(originalFileData.id, {
        path: destinationPath,
        systemName: newFileName,
        originalName: originalname,
        sizeBytes: size,
        mime: mimetype,
        extension: fileExtension,
        userId,
      });

      await fs.unlink(`${config.usersFilesPath}/${originalFileData.path}`);

      res.json({ sizeBytes: size, name: newFileName });
    } catch (err) {
      error.send('update_file_failed', err, res);
    }
  }

  return {
    authenticateByToken,
    signIn,
    signUp,
    logOut,
    getUserInfo,
    getNewAccessToken,
    fileUpload,
    getFile,
    listFiles,
    createFile,
    deleteFile,
    updateFile,
  };
}
