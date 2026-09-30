// Nettoyage global du lexique, après une fusion de plusieurs thèmes.
//
//   bun dedupe-lexicon.ts --dry-run   → ce qui serait retiré
//   bun dedupe-lexicon.ts             → réécrit les fichiers de thème
//
// `merge-lexicon-draft.ts` ne voit que les thèmes publiés AU MOMENT où il démarre : fusionner
// seize thèmes d'un coup laisse donc passer les doublons entre eux. Cette passe raisonne sur
// l'ensemble et tranche, selon trois règles :
//
//  1. Un mot en double DANS un thème : on garde la première occurrence.
//  2. Un mot présent dans PLUSIEURS thèmes : on le garde dans celui qui vient en premier dans le
//     plan (`THEME_PLAN`) et on l'écarte ailleurs. Arbitrage arbitraire mais DÉTERMINISTE — le
//     relancer donne le même résultat, et l'ordre du plan va du plus quotidien au plus spécialisé.
//  3. Une fiche dont l'exemple n'emploie pas le mot : on l'écarte. On ne peut pas la réparer
//     automatiquement, et une fiche dont l'exemple n'illustre rien ne vaut pas d'être publiée.
import { existsSync, writeFileSync } from 'node:fs';
import { THEME_PLAN } from './src/data/lexicon/themes';
import { THEMES } from './src/data/lexicon';
import { formsOf, type WordEntry } from './src/lib/lexicon';

const dry = process.argv.includes('--dry-run');
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
const CONST = (k: string) => `THEME_${k.toUpperCase().replace(/[^A-Z0-9]/g, '_')}`;

/** L'exemple emploie-t-il vraiment le mot, sous une forme ou une autre ? */
function illustrates(e: WordEntry): boolean {
  return formsOf(e).some((f) => new RegExp(`\\b${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(e.ex.en));
}

const order = new Map(THEME_PLAN.map((p, i) => [p.key, i]));
const sorted = [...THEMES].sort((a, b) => (order.get(a.key) ?? 99) - (order.get(b.key) ?? 99));

const owner = new Map<string, string>(); // mot → thème qui le garde
const stats = { dupIntra: 0, dupCross: 0, noExample: 0, kept: 0 };
const keep = new Map<string, WordEntry[]>();

for (const theme of sorted) {
  const local = new Set<string>();
  const list: WordEntry[] = [];
  for (const e of theme.words) {
    const k = e.w.toLowerCase();
    if (local.has(k)) {
      stats.dupIntra++;
      continue;
    }
    if (owner.has(k)) {
      stats.dupCross++;
      if (dry) console.log(`  − ${theme.key}/${e.w} → gardé dans « ${owner.get(k)} »`);
      continue;
    }
    if (!illustrates(e)) {
      stats.noExample++;
      if (dry) console.log(`  − ${theme.key}/${e.w} → l’exemple ne l’emploie pas`);
      continue;
    }
    local.add(k);
    owner.set(k, theme.key);
    list.push(e);
    stats.kept++;
  }
  keep.set(theme.key, list);
}

function render(e: WordEntry): string {
  return (
    `    { w: '${esc(e.w)}', pos: '${e.pos}', fr: '${esc(e.fr)}', cefr: '${e.cefr}',` +
    (e.also?.length ? ` also: [${e.also.map((f) => `'${esc(f)}'`).join(', ')}],` : '') +
    ` ex: { en: '${esc(e.ex.en)}', fr: '${esc(e.ex.fr)}' }` +
    (e.note ? `, note: '${esc(e.note)}'` : '') +
    ' },'
  );
}

if (!dry) {
  for (const theme of THEMES) {
    const words = keep.get(theme.key) ?? [];
    const path = `src/data/lexicon/${theme.key}.ts`;
    if (!words.length || !existsSync(path)) continue;
    writeFileSync(
      path,
      [
        `// ${theme.label} — ${words.length} mots.`,
        `// Dédoublonné par \`bun dedupe-lexicon.ts\` : un mot ne vit que dans un seul thème.`,
        `import type { Theme } from '../../lib/lexicon';`,
        ``,
        `export const ${CONST(theme.key)}: Theme = {`,
        `  key: '${esc(theme.key)}',`,
        `  domain: '${esc(theme.domain)}',`,
        `  label: '${esc(theme.label)}',`,
        `  blurb: '${esc(theme.blurb)}',`,
        `  target: ${theme.target},`,
        `  words: [`,
        ...words.map(render),
        `  ],`,
        `};`,
        ``,
      ].join('\n'),
    );
  }
}

console.log(
  `${dry ? '[à blanc] ' : ''}${stats.kept} mots gardés · ${stats.dupIntra} doublons internes · ` +
    `${stats.dupCross} doublons entre thèmes · ${stats.noExample} exemples qui n’illustrent pas`,
);
