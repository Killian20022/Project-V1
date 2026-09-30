// Fusionne un brouillon relu dans le thème publié.
//
//   bun merge-lexicon-draft.ts corps [autre…]
//
// Un thème publié contient souvent déjà des mots — repris du curriculum, écrits à la main. Le
// brouillon vient PAR-DESSUS : en cas de doublon, l'entrée déjà publiée gagne (elle a été relue
// à partir de contenu humain, le brouillon vient d'un modèle). Écrase `<thème>.ts` et l'inscrit
// dans `index.ts` s'il n'y est pas.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { THEME_PLAN } from './src/data/lexicon/themes';
import { THEMES } from './src/data/lexicon';
import type { WordEntry } from './src/lib/lexicon';

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const CONST = (k: string) => `THEME_${k.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;

function render(entry: WordEntry): string {
  return (
    `    { w: '${esc(entry.w)}', pos: '${entry.pos}', fr: '${esc(entry.fr)}', cefr: '${entry.cefr}',` +
    (entry.also?.length ? ` also: [${entry.also.map((f) => `'${esc(f)}'`).join(', ')}],` : '') +
    ` ex: { en: '${esc(entry.ex.en)}', fr: '${esc(entry.ex.fr)}' }` +
    (entry.note ? `, note: '${esc(entry.note)}'` : '') +
    ' },'
  );
}

const keys = process.argv.slice(2).filter((a) => !a.startsWith('--'));
if (!keys.length) {
  console.error('usage : bun merge-lexicon-draft.ts <thème…>');
  process.exit(1);
}

for (const key of keys) {
  const plan = THEME_PLAN.find((p) => p.key === key);
  if (!plan) {
    console.error(`✗ thème inconnu : ${key}`);
    continue;
  }
  const draftPath = `src/data/lexicon/${key}.draft.ts`;
  if (!existsSync(draftPath)) {
    console.error(`✗ pas de brouillon : ${draftPath}`);
    continue;
  }

  const draft = (await import(`./${draftPath}`))[CONST(key)] as { words: readonly WordEntry[] };
  const publishedPath = `src/data/lexicon/${key}.ts`;
  const published: readonly WordEntry[] = existsSync(publishedPath)
    ? ((await import(`./${publishedPath}`))[CONST(key)] as { words: readonly WordEntry[] }).words
    : [];

  // Le publié d'abord : c'est lui qui gagne en cas de doublon. On écarte aussi tout mot déjà
  // publié dans un AUTRE thème — un mot ne vit que dans un seul, sinon deux cartes de révision
  // se disputeraient le même identifiant.
  const elsewhere = new Set(THEMES.filter((t) => t.key !== key).flatMap((t) => t.words.map((w) => w.w.toLowerCase())));
  const seen = new Set(published.map((w) => w.w.toLowerCase()));
  const dropped: string[] = [];
  const added = draft.words.filter((w) => {
    const k = w.w.toLowerCase();
    if (seen.has(k)) return false;
    if (elsewhere.has(k)) { dropped.push(w.w); return false; }
    return true;
  });
  if (dropped.length) console.log(`  – ${dropped.length} écarté(s), déjà dans un autre thème : ${dropped.slice(0, 8).join(', ')}${dropped.length > 8 ? '…' : ''}`);
  const all = [...published, ...added];

  const out = [
    `// ${plan.label} — ${all.length} mots.`,
    `// ${published.length} repris du curriculum, ${added.length} rédigés par l'API puis relus`,
    `// (vérification automatique + arbitrage des fiches signalées). Voir gen-lexicon-ai.ts.`,
    `import type { Theme } from '../../lib/lexicon';`,
    ``,
    `export const ${CONST(key)}: Theme = {`,
    `  key: '${esc(key)}',`,
    `  domain: '${esc(plan.domain)}',`,
    `  label: '${esc(plan.label)}',`,
    `  blurb: '${esc(plan.blurb)}',`,
    `  target: ${plan.target},`,
    `  words: [`,
    ...all.map(render),
    `  ],`,
    `};`,
    ``,
  ].join('\n');
  writeFileSync(publishedPath, out);

  // Inscription au registre, si elle manque.
  const idxPath = 'src/data/lexicon/index.ts';
  let idx = readFileSync(idxPath, 'utf8');
  if (!idx.includes(`from './${key}'`)) {
    idx = idx.replace(`import { THEME_TRAVAIL } from './travail';`, `import { THEME_TRAVAIL } from './travail';\nimport { ${CONST(key)} } from './${key}';`);
    idx = idx.replace(`  travail: THEME_TRAVAIL,`, `  travail: THEME_TRAVAIL,\n  ${key}: ${CONST(key)},`);
    writeFileSync(idxPath, idx);
    console.log(`  + inscrit au registre`);
  }
  console.log(`✓ ${key} : ${published.length} + ${added.length} = ${all.length} mots`);
}
