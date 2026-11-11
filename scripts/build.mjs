import { mkdir, copyFile, cp } from 'node:fs/promises';
await mkdir('dist', { recursive: true });
await Promise.all(['index.html', 'app.js'].map(file => copyFile(file, `dist/${file}`)));
await cp('public', 'dist/public', { recursive: true });
