import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverPath = path.join(__dirname, 'src', 'server.js');

if (!fs.existsSync(serverPath)) {
  console.error('Arquivo src/server.js nao encontrado. Verifique se a pasta src foi enviada no deploy.');
  process.exit(1);
}

await import('./src/server.js');
