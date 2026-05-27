import crypto from 'node:crypto';
import { env } from '../config/env.js';

function parseSignatureHeader(value) {
  return String(value || '').split(',').reduce((acc, part) => {
    const [key, signatureValue] = part.split('=');
    if (key && signatureValue) {
      acc[key.trim()] = signatureValue.trim();
    }
    return acc;
  }, {});
}

export function validateMercadoPagoSignature(req) {
  if (!env.mercadoPagoWebhookSecret) return true;

  const signature = parseSignatureHeader(req.headers['x-signature']);
  const requestId = req.headers['x-request-id'];
  const dataId = String(req.query['data.id'] || req.body?.data?.id || '').toLowerCase();

  if (!signature.ts || !signature.v1 || !requestId || !dataId) {
    return false;
  }

  const manifest = `id:${dataId};request-id:${requestId};ts:${signature.ts};`;
  const expected = crypto
    .createHmac('sha256', env.mercadoPagoWebhookSecret)
    .update(manifest)
    .digest('hex');

  const received = Buffer.from(signature.v1, 'hex');
  const calculated = Buffer.from(expected, 'hex');

  return received.length === calculated.length && crypto.timingSafeEqual(received, calculated);
}
