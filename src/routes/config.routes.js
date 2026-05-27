import { Router } from 'express';
import { env } from '../config/env.js';

export const configRoutes = Router();

configRoutes.get('/config', (req, res) => {
  res.json({
    mercadoPagoPublicKey: env.mercadoPagoPublicKey,
    mercadoPagoReady: Boolean(env.mercadoPagoAccessToken && env.mercadoPagoPublicKey)
  });
});

configRoutes.get('/health', (req, res) => {
  res.json({ status: 'ok', runtime: 'node' });
});
