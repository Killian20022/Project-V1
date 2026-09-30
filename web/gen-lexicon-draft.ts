// Brouillon d'entrées de lexique, à partir de sources LIBRES et sans clé.
//
//   bun gen-lexicon-draft.ts <clé-du-thème> <mot> <mot> …
//   bun gen-lexicon-draft.ts sante --file /tmp/mots.txt
//
// Écrit `src/data/lexicon/<thème>.draft.ts`. Ce fichier n'est PAS du contenu publiable : c'est un
// brouillon que je relis mot par mot avant de le renommer sans « .draft ». Trois sources :
//
//   · Datamuse      — nature du mot, fréquence (par million), définitions anglaises par sens.
//                     Gratuit, sans clé. C'est déjà l'API du Grimoire.
//   · MyMemory      — traductions françaises CANDIDATES, avec un score. Gratuit, sans clé,
//                     ~1 000 requêtes/jour par adresse IP.
//   · Tatoeba       — phrases anglaises AVEC leur traduction française (CC BY 2.0 FR, la même
//                     licence que les 3 000 déjà embarquées), et l'indication d'un enregistrement
//                     par un locuteur natif quand il existe.
//
// Ce qui reste HUMAIN, et qu'aucune de ces sources ne sait faire : choisir la bonne traduction
// parmi les candidates selon le thème, et signaler le piège. Le brouillon laisse donc `fr` à
// « TODO » avec les candidates en commentaire.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const CACHE = '.lexicon-cache';
const PAUSE_MS = 350; // on ne martèle pas des services gratuits

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Requête mise en cache sur disque : relancer le script ne refait aucun appel déjà fait. */
async function cached(kind: string, key: string, url: string): Promise<unknown | null> {
  mkdirSync(`${CACHE}/${kind}`, { recursive: true });
  const file = `${CACHE}/${kind}/${key.replace(/[^a-z0-9]+/gi, '_')}.json`;
  if (existsSync(file)) return JSON.parse(readFileSync(file, 'utf8'));
  await sleep(PAUSE_MS);
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) return null;
    const data = await res.json();
    writeFileSync(file, JSON.stringify(data));
    return data;
  } catch {
    return null;
  }
}

// ---------- Nature, fréquence, sens ----------
type DatamuseHit = { word: string; tags?: string[]; defs?: string[] };
const POS_FROM_TAG: Record<string, string> = { n: 'n', v: 'v', adj: 'adj', adv: 'adv' };

async function lookup(word: string) {
  const hits = (await cached('datamuse', word, `https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=pfd&max=1`)) as
    | DatamuseHit[]
    | null;
  const hit = hits?.[0];
  const tags = hit?.tags ?? [];
  const freq = Number(tags.find((t) => t.startsWith('f:'))?.slice(2) ?? 0);
  // Un mot à particule (« hand in ») n'est dans aucun dictionnaire de formes : on le marque comme
  // locution plutôt que de le laisser sans nature.
  const pos = word.includes(' ') ? 'phr' : (tags.map((t) => POS_FROM_TAG[t]).find(Boolean) ?? '?');
  return { pos, freq, defs: (hit?.defs ?? []).slice(0, 3) };
}

/**
 * Niveau CEFR estimé d'après la fréquence. C'est un REPÈRE À CORRIGER, pas une vérité.
 *
 * Mesuré (`--calibrate`) contre les 93 mots du thème « travail » notés à la main :
 * **37 % de niveau exact, 84 % à un niveau près.** Les erreurs sont systématiques, donc
 * prévisibles :
 *   · SOUS-ESTIME les mots courants d'un domaine — « email », « desk », « boss » sont du
 *     quotidien professionnel mais rares dans un corpus général ;
 *   · SUR-ESTIME les mots polysémiques — « experience », « notice », « achieve » sont fréquents
 *     à cause de leurs AUTRES sens, pas de celui qu'on enseigne.
 * À utiliser comme point de départ de relecture. La CEFR-J Wordlist, qui porte un vrai niveau
 * par mot, devra prendre le relais dès qu'on l'aura intégrée.
 */
function cefrFromFreq(freq: number): string {
  if (freq >= 100) return 'A1';
  if (freq >= 30) return 'A2';
  if (freq >= 8) return 'B1';
  if (freq >= 2) return 'B2';
  if (freq >= 0.5) return 'C1';
  return 'C2';
}

// ---------- Traductions candidates ----------
async function translations(word: string): Promise<string[]> {
  const data = (await cached('mymemory', word, `https://api.mymemory.translated.net/get?q=${encodeURIComponent(word)}&langpair=en|fr`)) as
    | { matches?: { translation: string; quality: string }[] }
    | null;
  const seen = new Set<string>();
  const out: string[] = [];
  for (const m of data?.matches ?? []) {
    // MyMemory est une mémoire de traduction alimentée par des humains : à côté des bonnes
    // réponses on y trouve des fragments de phrases entières (« voyage missionnaire. »,
    // « avec moodle. »). On écarte ce qui ne ressemble pas à une entrée de dictionnaire.
    const t = m.translation
      ?.trim()
      .toLowerCase()
      .replace(/[.;:!?]+$/, '')
      .trim();
    if (!t || t === word.toLowerCase() || seen.has(t)) continue;
    if (t.length > 30 || t.split(/\s+/).length > 3 || /[0-9@/()]/.test(t)) continue;
    seen.add(t);
    out.push(t);
    if (out.length >= 5) break;
  }
  return out;
}

/**
 * Choisit l'exemple qui illustre LE BON SENS du mot.
 *
 * Sans ça, on prenait la première phrase venue : « trip » sortait « He tripped » (trébucher)
 * dans un thème sur le voyage. L'astuce est de croiser deux sources indépendantes — on garde la
 * phrase dont la traduction FRANÇAISE contient l'une des traductions candidates du mot. Si les
 * deux se recoupent, c'est le bon sens ; sinon on retombe sur la première phrase.
 */
function pickExample<T extends { en: string; fr: string }>(examples: T[], candidates: string[]): T | undefined {
  if (!examples.length) return undefined;
  const stems = candidates.map((c) => c.split(/\s+/)[0]).filter((s) => s.length >= 4);
  if (!stems.length) return examples[0];
  const scored = examples.map((e) => ({ e, hit: stems.some((s) => e.fr.toLowerCase().includes(s)) }));
  return (scored.find((s) => s.hit) ?? scored[0]).e;
}

// ---------- Exemples ----------
type TatoebaResult = {
  text: string;
  translations?: { text: string; lang: string; audios?: unknown[] }[][];
  audios?: unknown[];
};

async function examples(word: string): Promise<{ en: string; fr: string; audio: boolean }[]> {
  const data = (await cached(
    'tatoeba',
    word,
    `https://tatoeba.org/en/api_v0/search?from=eng&to=fra&query=${encodeURIComponent(word)}&trans_filter=limit&sort=relevance`,
  )) as { results?: TatoebaResult[] } | null;
  const out: { en: string; fr: string; audio: boolean }[] = [];
  for (const r of data?.results ?? []) {
    const fr = (r.translations ?? []).flat().find((t) => t?.lang === 'fra');
    if (!fr) continue;
    // Une phrase courte illustre mieux qu'une tirade : on écarte les plus longues.
    if (r.text.length > 90) continue;
    out.push({ en: r.text, fr: fr.text, audio: (r.audios?.length ?? 0) > 0 });
    if (out.length >= 3) break;
  }
  return out;
}

// ---------- Contrôle du calage CEFR ----------
// Compare l'estimation par fréquence aux niveaux que j'ai attribués à la main sur le thème
// « travail ». Sans ce contrôle, on ne saurait pas si l'heuristique vaut mieux que rien.
async function calibrate() {
  const { THEME_TRAVAIL } = await import('./src/data/lexicon/travail');
  const ORDER = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  let exact = 0;
  let within1 = 0;
  const off: string[] = [];
  for (const e of THEME_TRAVAIL.words) {
    const { freq } = await lookup(e.w);
    const guess = cefrFromFreq(freq);
    const gap = Math.abs(ORDER.indexOf(guess) - ORDER.indexOf(e.cefr));
    if (gap === 0) exact++;
    if (gap <= 1) within1++;
    else off.push(`${e.w} : à la main ${e.cefr}, estimé ${guess} (f=${freq})`);
  }
  const n = THEME_TRAVAIL.words.length;
  console.log(`Calage sur ${n} mots notés à la main :`);
  console.log(`  niveau exact          : ${exact} (${Math.round((exact / n) * 100)} %)`);
  console.log(`  à un niveau près      : ${within1} (${Math.round((within1 / n) * 100)} %)`);
  console.log(`  écart de 2 niveaux ou plus (${off.length}) :`);
  for (const l of off.slice(0, 15)) console.log('    ' + l);
}

// ---------- Génération ----------
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

async function draft(themeKey: string, words: string[]) {
  const lines: string[] = [];
  lines.push(`// BROUILLON — relire chaque entrée avant de retirer « .draft » du nom de fichier.`);
  lines.push(`// Généré par : bun gen-lexicon-draft.ts ${themeKey}`);
  lines.push(`// Sources : Datamuse (nature, fréquence, sens) · MyMemory (traductions candidates)`);
  lines.push(`//           Tatoeba (exemples en/fr, CC BY 2.0 FR).`);
  lines.push(`// À FAIRE pour chaque entrée : choisir 'fr', vérifier le niveau, garder UN exemple,`);
  lines.push(`// ajouter 'note' s'il y a un piège, compléter 'also' (formes fléchies).`);
  lines.push(`import type { Theme } from '../../lib/lexicon';`);
  lines.push('');
  lines.push(`export const THEME_${themeKey.toUpperCase().replace(/[^A-Z0-9]/g, '_')}: Theme = {`);
  lines.push(`  key: '${esc(themeKey)}',`);
  lines.push(`  label: 'TODO',`);
  lines.push(`  blurb: 'TODO',`);
  lines.push('  words: [');

  let done = 0;
  for (const w of words) {
    const { pos, freq, defs } = await lookup(w);
    const fr = await translations(w);
    const ex = await examples(w);
    const first = pickExample(ex, fr);
    lines.push('');
    for (const d of defs) lines.push(`    // ${d.replace(/\s+/g, ' ').trim()}`);
    if (fr.length) lines.push(`    // candidates fr : ${fr.join(' | ')}`);
    for (const e of ex) {
      if (e === first) continue;
      lines.push(`    // autre exemple : ${e.en} — ${e.fr}${e.audio ? '  [audio natif]' : ''}`);
    }
    lines.push(
      `    { w: '${esc(w)}', pos: '${pos}', fr: 'TODO${fr[0] ? ` — ${esc(fr[0])} ?` : ''}', cefr: '${cefrFromFreq(freq)}',` +
        ` ex: { en: '${esc(first?.en ?? 'TODO')}', fr: '${esc(first?.fr ?? 'TODO')}' } },` +
        ` // f=${freq}${first?.audio ? ' [audio natif]' : ''}`,
    );
    done++;
    process.stdout.write(`\r  ${done}/${words.length} — ${w}${' '.repeat(20)}`);
  }
  lines.push('  ],');
  lines.push('};');

  const out = `src/data/lexicon/${themeKey}.draft.ts`;
  writeFileSync(out, lines.join('\n') + '\n');
  console.log(`\n✓ ${out} — ${words.length} entrée(s) à relire.`);
}

// ---------- Entrée ----------
const argv = process.argv.slice(2);
if (argv[0] === '--calibrate') {
  await calibrate();
} else {
  const themeKey = argv[0];
  const fileFlag = argv.indexOf('--file');
  const words =
    fileFlag > 0
      ? readFileSync(argv[fileFlag + 1], 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'))
      : argv.slice(1);
  if (!themeKey || !words.length) {
    console.error('usage : bun gen-lexicon-draft.ts <thème> <mot…>   |   <thème> --file <liste.txt>   |   --calibrate');
    process.exit(1);
  }
  await draft(themeKey, words);
}
