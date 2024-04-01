import { validationResult, oneOf, body, param, query, check } from 'express-validator';

import config from './config.js';

export default async function createValidator() {
  const validate = validations => {
    return async (req, res, next) => {
      await Promise.all(validations.map(validation => validation.run(req)));

      const errors = validationResult(req);
      if (errors.isEmpty()) {
        return next();
      }

      res.status(400).send(errors.array());
    };
  };

  const schema = {
    // TODO emailOrPhone 2 options
    signIn: [body('emailOrPhone').isString().notEmpty(), body('password').isString().notEmpty()],
    signUp: [
      oneOf([body('phone').isMobilePhone(), body('email').isEmail()], {
        message: 'At least one valid contact method must be provided',
      }),
      body('password').isStrongPassword(config.validator.userPassword),
    ],
    listFiles: [
      query('page').isInt({ gt: 0 }).optional(),
      query('listSize').isInt({ min: 1, max: config.maxFilesList }),
    ],
    createFile: [
      check('userFile').custom((value, { req }) =>
        config.acceptableMimeTypes.includes(req.file.mimetype),
      ),
    ],
    getFile: [
      param('fileId').isAlphanumeric().isLength({
        min: config.security.defaultRandomIdLength,
        max: config.security.defaultRandomIdLength,
      }),
      query('download').isInt({ min: 0, max: 1 }).optional(),
    ],
    updateFile: [
      param('fileId').isAlphanumeric().isLength({
        min: config.security.defaultRandomIdLength,
        max: config.security.defaultRandomIdLength,
      }),
      check('userFile').custom((value, { req }) =>
        config.acceptableMimeTypes.includes(req.file.mimetype),
      ),
    ],
    deleteFile: [
      param('fileId').isAlphanumeric().isLength({
        min: config.security.defaultRandomIdLength,
        max: config.security.defaultRandomIdLength,
      }),
    ],
  };

  return {
    validate,
    schema,
  };
}
