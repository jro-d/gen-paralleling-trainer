import fs from 'node:fs';
import path from 'node:path';

const dir = 'C:/Users/johnr/OneDrive/Desktop/Project Ascend/Marine Power System/rea/Generator-Synchronization-rea';
const srcPath = path.join(dir, 'index.html');
const destPath = path.join(dir, 'Generator-Paralleling-Trainer-Standalone.html');

let content = fs.readFileSync(srcPath, 'utf8');

// Replace external Google Fonts with self-contained system font stack
const offlineBlock = `<!-- 100% OFFLINE STANDALONE EDITION: Zero external network dependencies, fonts, or CDNs -->
<style>
:root {
  --font-sans: system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial, sans-serif !important;
  --font-mono: ui-monospace, "Cascadia Code", "Segoe UI Mono", Consolas, "Courier New", monospace !important;
}
</style>`;

content = content.replace(
  /<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com" \/>\s*<link rel="preconnect" href="https:\/\/fonts\.gstatic\.com" crossorigin \/>\s*<link href="https:\/\/fonts\.googleapis\.com\/css2\?family=IBM\+Plex\+Mono:wght@400;500;600&family=IBM\+Plex\+Sans:wght@400;500;600&display=swap" rel="stylesheet" \/>/,
  offlineBlock
);

content = content.replace(
  '<title>Generator Paralleling Trainer – 4 × DG</title>',
  '<title>Generator Paralleling Trainer (Offline Standalone) – 4 × DG</title>'
);

fs.writeFileSync(destPath, content, 'utf8');
console.log('Successfully written Generator-Paralleling-Trainer-Standalone.html, length:', content.length);
