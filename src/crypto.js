import crypto from 'crypto';
import argon2 from 'argon2';

import config from './config.js';

export default {
  createRandomId: randomIdLength =>
    crypto.randomBytes(randomIdLength || config.security.defaultRandomIdLength / 2).toString('hex'),
  verifyString: (hash, stringToVerify) => argon2.verify(hash, stringToVerify),
  hashPassword: password => argon2.hash(password),
};
