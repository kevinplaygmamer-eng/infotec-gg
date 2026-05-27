import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..', '..');

export const env = {
  rootDir,
  port: Number(process.env.PORT || 5000),
  databasePath: path.resolve(rootDir, process.env.DATABASE_PATH || 'meubanco.db'),
  mercadoPagoAccessToken: process.env.MERCADO_PAGO_ACCESS_TOKEN || '',
  mercadoPagoPublicKey: process.env.MERCADO_PAGO_PUBLIC_KEY || '',
  mercadoPagoWebhookSecret: process.env.MERCADO_PAGO_WEBHOOK_SECRET || '',
  publicBaseUrl: (process.env.PUBLIC_BASE_URL || '').replace(/\/$/, ''),
  nodeEnv: process.env.NODE_ENV || 'development'
};
