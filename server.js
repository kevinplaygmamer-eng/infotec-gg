import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverPath = path.join(__dirname, 'src', 'server.js');

if (!fs.existsSync(serverPath)) {
  const files = fs.readdirSync(__dirname).join(', ');
  console.error(`Arquivo src/server.js nao encontrado em ${serverPath}.`);
  console.error(`Diretorio atual: ${process.cwd()}`);
  console.error(`Arquivos recebidos no deploy: ${files}`);
  console.error('Verifique no Render se o repositorio, a branch main e o Root Directory vazio/raiz estao configurados corretamente.');
  process.exit(1);
}

await import('./src/server.js');
