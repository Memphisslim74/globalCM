import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dist = path.join(root, 'dist');
const partial = fs.readFileSync(path.join(root, 'partials', 'sitewide-contact.html'), 'utf8');
const skip = new Set(['dist', 'node_modules', '.git', 'scripts', 'partials', 'functions', 'package.json', 'README.md', '.htmlvalidate.json', '.pages.yml']);

if (fs.existsSync(dist)) fs.rmSync(dist, { recursive: true, force: true });
fs.mkdirSync(dist, { recursive: true });

for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
  if (skip.has(entry.name)) continue;
  fs.cpSync(path.join(root, entry.name), path.join(dist, entry.name), { recursive: true });
}

function inject(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) inject(file);
    if (!entry.isFile() || !entry.name.endsWith('.html')) continue;
    const html = fs.readFileSync(file, 'utf8');
    fs.writeFileSync(file, html.replace('<!-- SITEWIDE_CONTACT -->', partial));
  }
}

inject(dist);
console.log('The Global Co-Mission site built to dist');
