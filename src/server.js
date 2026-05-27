import express from 'express';
import helmet from 'helmet';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { env } from './config/env.js';
import { initDatabase } from './db/database.js';
import { authRoutes } from './routes/auth.routes.js';
import { productRoutes } from './routes/products.routes.js';
import { checkoutRoutes } from './routes/checkout.routes.js';
import { configRoutes } from './routes/config.routes.js';
import { webhookRoutes } from './routes/webhooks.routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.resolve(__dirname, '..');
const allowedStaticFiles = new Set(['index.html', 'profile.html', 'style.css', 'script.js', 'profile.js']);

const app = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use('/api', configRoutes);
app.use('/api', authRoutes);
app.use('/api', productRoutes);
app.use('/api', checkoutRoutes);
app.use('/api', webhookRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.get('/:fileName', (req, res, next) => {
  if (!allowedStaticFiles.has(req.params.fileName)) {
    next();
    return;
  }

  res.sendFile(path.join(publicDir, req.params.fileName));
});

app.use((req, res) => {
  res.status(404).json({ error: 'Rota nao encontrada.' });
});

app.use((error, req, res, next) => {
  console.error(error);
  res.status(error.status || 500).json({
    error: error.message || 'Erro interno do servidor.'
  });
});

await initDatabase();

app.listen(env.port, '0.0.0.0', () => {
  console.log(`Infotec Node server running on http://localhost:${env.port}`);
});
