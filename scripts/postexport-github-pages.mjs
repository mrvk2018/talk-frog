import fs from 'node:fs';
import path from 'node:path';

const distDir = path.join(process.cwd(), 'dist');
const indexHtml = path.join(distDir, 'index.html');

if (!fs.existsSync(indexHtml)) {
  console.error('postexport-github-pages: dist/index.html not found. Run expo export --platform web first.');
  process.exit(1);
}

fs.copyFileSync(indexHtml, path.join(distDir, '404.html'));
fs.writeFileSync(path.join(distDir, '.nojekyll'), '');
console.log('postexport-github-pages: created 404.html and .nojekyll');