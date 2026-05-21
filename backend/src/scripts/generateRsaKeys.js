const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const logger = require('../config/logger');

// Generate RSA key pair
const { publicKey, privateKey } = crypto.generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'spki',
    format: 'pem'
  },
  privateKeyEncoding: {
    type: 'pkcs8',
    format: 'pem'
  }
});

const refreshTokenSecret = crypto.randomBytes(32).toString('hex');

// Save to .env file
const envPath = path.resolve(__dirname, '../../.env');
const envContent = fs.readFileSync(envPath, 'utf-8');

const updatedEnv = envContent + `

# JWT Configuration
JWT_PRIVATE_KEY="${privateKey.replace(/\n/g, '\\n')}"
JWT_PUBLIC_KEY="${publicKey.replace(/\n/g, '\\n')}"
JWT_ACCESS_TOKEN_EXPIRES_IN=15m
JWT_REFRESH_TOKEN_EXPIRES_IN=7d
JWT_REFRESH_TOKEN_SECRET=${refreshTokenSecret}
`;

fs.writeFileSync(envPath, updatedEnv);

logger.info('RSA keys generated and saved to .env', {
  privateKeyPreview: privateKey.substring(0, 100) + '...',
  publicKeyPreview: publicKey.substring(0, 100) + '...',
});
