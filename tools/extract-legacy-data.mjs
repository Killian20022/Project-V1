import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = await readFile(resolve(root, 'index.html'), 'utf8');
const outputDir = resolve(root, 'apps/web/src/data');
await mkdir(outputDir, { recursive: true });

function extract(start, end) {
  const from = source.indexOf(start);
  const to = source.indexOf(end, from);
  if (from < 0 || to < 0) throw new Error(`Bloc introuvable: ${start}`);
  return source.slice(from, to).trim();
}

const sentences = extract('const SENTENCES =', 'const VOCAB=')
  .replace(/^const SENTENCES\s*=/, 'export const SENTENCES =')
  .replace(/;\s*$/, ' as const;');

const curriculum = extract('const CURRICULUM=', 'const LESSONS_PER_LEVEL=')
  .replace(/^const CURRICULUM=/, 'export const CURRICULUM =')
  .replace(/;\s*$/, ' as const;');

const cssStart = source.indexOf('<style>') + '<style>'.length;
const cssEnd = source.indexOf('</style>', cssStart);
if (cssStart < '<style>'.length || cssEnd < 0) throw new Error('CSS introuvable');

await writeFile(resolve(outputDir, 'sentences.ts'), `${sentences}\n`, 'utf8');
await writeFile(resolve(outputDir, 'curriculum.ts'), `${curriculum}\n`, 'utf8');
await writeFile(resolve(root, 'apps/web/src/legacy.css'), source.slice(cssStart, cssEnd).trim() + '\n', 'utf8');
console.log('Données et styles historiques extraits.');
