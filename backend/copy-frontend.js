import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const srcDir = path.join(__dirname, '../frontend/out');
const destDir = path.join(__dirname, 'public');

if (!fs.existsSync(srcDir)) {
  console.log('⚠️ frontend/out directory does not exist yet. Run `npm run build` inside frontend folder first.');
  process.exit(0);
}

// Remove old destination public directory
if (fs.existsSync(destDir)) {
  fs.rmSync(destDir, { recursive: true, force: true });
}

// Copy recursively
fs.cpSync(srcDir, destDir, { recursive: true });
console.log('✅ Successfully copied frontend build (frontend/out) into backend/public!');
