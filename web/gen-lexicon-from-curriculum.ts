// Récupère dans le curriculum les mots de vocabulaire déjà écrits, et les verse dans les thèmes.
//
//   bun gen-lexicon-from-curriculum.ts            → un brouillon par thème
//   bun gen-lexicon-from-curriculum.ts --report   → ce qu'on récupère, sans rien écrire
//
// Les leçons « V » du curriculum contiennent du vocabulaire écrit à la main, avec sa traduction
// ET six phrases d'exemple traduites. Ce contenu existe depuis toujours mais reste prisonnier des
// leçons : invisible depuis la partie Vocabulaire, jamais révisé au niveau du mot, impossible à
// compter. On le libère.
//
// ⚠ Les champs `forms` ne sont PAS des entrées de lexique : ce sont des rangées d'un tableau
// d'affichage. « mother / father » en contient deux, « apple / meat / fish » trois, « How are
// you? » aucune (c'est une formule). Et la leçon des nombres a ses colonnes INVERSÉES.
// D'où ce script : il découpe, écarte ce qui n'est pas un mot, et va chercher pour chacun
// l'exemple de la leçon qui l'emploie. Le résultat reste un BROUILLON à relire.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { CURRICULUM } from './src/data/curriculum';
import { THEME_PLAN } from './src/data/lexicon/themes';
import { CURRICULUM_FIXES } from './src/data/lexicon/curriculum-fixes';
import type { Lesson, Level } from './src/types';

const LEVELS: Level[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const CACHE = '.lexicon-cache';

/**
 * Où verser chaque leçon de vocabulaire. Déclaré, pas deviné — et `null` signifie « ce n'est pas
 * du vocabulaire » : les leçons d'idiomes, de registres et d'humour sont faites de TOURNURES,
 * elles relèvent de la section Formules, pas du lexique.
 */
const LESSON_THEME: Record<string, string | null> = {
  'Se présenter': null, // formules de politesse
  'La famille': 'famille',
  'Les couleurs et les objets du quotidien': 'maison',
  'Les nombres & l’âge': 'temps',
  "Les nombres & l'âge": 'temps',
  'Les nombres et l’heure': 'temps',
  'Nourriture & boissons': 'nourriture',
  'La routine quotidienne': 'routine',
  'Voyages & transports': 'voyage',
  'La météo & les saisons': 'meteo',
  'Au restaurant': 'hotel',
  'La ville et les directions': 'ville',
  'La maison': 'maison',
  'Le travail & les métiers': 'travail',
  'La technologie': 'numerique',
  'Émotions & sentiments': 'emotions',
  'La santé & le corps': 'corps',
  "L'environnement": 'nature',
  'Médias & actualité': 'medias',
  "L'éducation": 'ecole',
  "Les affaires & l'économie": 'entreprise',
  'Politique & société': 'politique',
  "L'art & la culture": 'art',
  'La science': 'sciences',
  'Le monde de l’entreprise': 'entreprise',
  'Les expressions idiomatiques': null, // tournures
  'Registres de langue': null, // tournures
  'Les idiomes natifs': null, // tournures
  'Le vocabulaire académique': 'ecole',
  'Les nuances de sens': null, // tournures
  'Humour & understatement': null, // tournures
  'La littérature et les arts': 'art',
};

const SPLIT = /\s*(?:\/|·|,)\s*/;

/** Une rangée est-elle une FORMULE plutôt qu'un mot ? Alors elle n'a rien à faire au lexique. */
function isPhrase(en: string): boolean {
  return /[?…]/.test(en) || en.split(/\s+/).length > 3 || /^(I|My|It|How|What|Nice)\b/.test(en);
}

/** Nettoie un mot : article indéfini, ponctuation, espaces. */
function clean(w: string): string {
  return w
    .replace(/^(?:a|an|the)\s+/i, '')
    .replace(/[.!?;:]+$/, '')
    .trim();
}

// ---------- Nature du mot (Datamuse, mis en cache) ----------
const POS_TAGS: Record<string, string> = { n: 'n', v: 'v', adj: 'adj', adv: 'adv' };

async function posOf(word: string): Promise<string> {
  if (word.includes(' ')) return 'phr';
  mkdirSync(`${CACHE}/datamuse`, { recursive: true });
  const file = `${CACHE}/datamuse/${word.replace(/[^a-z0-9]+/gi, '_')}.json`;
  let data: { tags?: string[] }[] | null = null;
  if (existsSync(file)) data = JSON.parse(readFileSync(file, 'utf8'));
  else {
    await new Promise((r) => setTimeout(r, 300));
    try {
      const res = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=pf&max=1`, {
        signal: AbortSignal.timeout(15000),
      });
      if (res.ok) {
        data = await res.json();
        writeFileSync(file, JSON.stringify(data));
      }
    } catch {
      /* hors ligne : on laissera '?' et je trancherai à la relecture */
    }
  }
  return (data?.[0]?.tags ?? []).map((t) => POS_TAGS[t]).find(Boolean) ?? '?';
}

// ---------- Extraction ----------
interface Draft {
  w: string;
  fr: string;
  cefr: Level;
  pos: string;
  ex?: { en: string; fr: string; form?: string };
  from: string;
}

/**
 * Exemple de la leçon qui emploie VRAIMENT ce mot.
 *
 * On exige le mot ENTIER, éventuellement fléchi. Un simple préfixe ne suffit pas : « bed »
 * trouvait « bedroom », « head » trouvait « headache », et l'exemple n'illustrait alors pas le
 * mot annoncé. Quand c'est une forme fléchie qui a servi, on la renvoie pour l'inscrire dans
 * `also` — c'est ce qui permettra plus tard de retrouver le mot dans le corpus de phrases.
 */
function findExample(word: string, lesson: Lesson): { en: string; fr: string; form?: string } | undefined {
  const esc = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const exact = new RegExp(`\\b${esc}\\b`, 'i');
  const bent = new RegExp(`\\b(${esc}(?:s|es|ed|ing|d))\\b`, 'i');
  const pool: { en: string; fr: string }[] = [
    ...(lesson.examples ?? []).map(([en, fr]) => ({ en, fr })),
    ...(lesson.practice ?? []).map((s) => ({ en: s.en, fr: s.fr })),
  ];
  for (const p of pool) if (exact.test(p.en)) return p;
  for (const p of pool) {
    const m = bent.exec(p.en);
    if (m) return { ...p, form: m[1].toLowerCase() };
  }
  return undefined;
}

async function collect() {
  const byTheme = new Map<string, Draft[]>();
  const skipped: string[] = [];
  let rows = 0;

  for (const level of LEVELS) {
    const lessons = (CURRICULUM as unknown as Record<Level, readonly Lesson[]>)[level] ?? [];
    for (const lesson of lessons) {
      if (lesson.t !== 'V' || !lesson.forms?.length) continue;
      const theme = LESSON_THEME[lesson.title];
      if (theme === null) {
        skipped.push(`${level} « ${lesson.title} » — tournures, pas du vocabulaire`);
        continue;
      }
      if (!theme) {
        skipped.push(`${level} « ${lesson.title} » — AUCUN thème déclaré (à ajouter à LESSON_THEME)`);
        continue;
      }
      for (const [rawEn, rawFr] of lesson.forms) {
        rows++;
        // Colonnes inversées : la leçon des nombres met les chiffres à gauche et l'anglais à droite.
        const swapped = /^[\d\s·,/]+$/.test(rawEn);
        const en = swapped ? rawFr : rawEn;
        const fr = swapped ? rawEn : rawFr;
        // On DÉCOUPE D'ABORD, on juge ensuite. Juger la rangée entière écartait « red / blue /
        // green » comme une phrase, alors qu'elle contient trois mots parfaitement valides.
        const ens = en.split(SPLIT).map(clean).filter(Boolean);
        const frs = fr.split(SPLIT).map((x) => x.trim()).filter(Boolean);
        // Une rangée ne se découpe que si les deux colonnes se répondent terme à terme ;
        // sinon on la garde entière et je trancherai à la relecture.
        const pairs: [string, string][] =
          ens.length > 1 && ens.length === frs.length ? ens.map((w, i) => [w, frs[i]]) : [[clean(en), fr]];
        for (const [w, f] of pairs) {
          if (!w || /[0-9]/.test(w)) continue;
          if (isPhrase(w)) {
            skipped.push(`${level} ${lesson.title} : « ${w} » — formule`);
            continue;
          }
          // Mes arbitrages de relecture, appliqués par-dessus l'extraction (voir
          // `curriculum-fixes.ts`) : exemple manquant, glose à nettoyer, doublon à écarter.
          const fix = CURRICULUM_FIXES[`${theme}:${w}`];
          if (fix?.drop) {
            skipped.push(`${level} ${lesson.title} : « ${w} » — écarté à la relecture`);
            continue;
          }
          const word = fix?.w ?? w;
          const list = byTheme.get(theme) ?? [];
          list.push({
            w: word,
            fr: fix?.fr ?? f,
            cefr: level,
            pos: fix?.pos ?? (await posOf(word)),
            ex: fix?.ex ?? findExample(word, lesson),
            from: lesson.title,
          });
          byTheme.set(theme, list);
        }
      }
    }
  }
  return { byTheme, skipped, rows };
}

// ---------- Sortie ----------
const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

const { byTheme, skipped, rows } = await collect();
const report = process.argv.includes('--report');

let written = 0;
for (const [themeKey, drafts] of [...byTheme.entries()].sort()) {
  const plan = THEME_PLAN.find((p) => p.key === themeKey);
  if (!plan) {
    console.warn(`⚠︎ thème inconnu : ${themeKey}`);
    continue;
  }
  // Un même mot peut venir de deux leçons (« travail » en B1 et « entreprise » en C1).
  const seen = new Set<string>();
  const uniq = drafts.filter((d) => (seen.has(d.w.toLowerCase()) ? false : seen.add(d.w.toLowerCase())));
  written += uniq.length;
  if (report) {
    console.log(`${themeKey.padEnd(12)} ${String(uniq.length).padStart(3)} mots · ${uniq.filter((d) => d.ex).length} avec exemple`);
    continue;
  }
  const out = [
    `// BROUILLON — repris du curriculum (leçons « V »), à relire avant de retirer « .draft ».`,
    `// Généré par : bun gen-lexicon-from-curriculum.ts`,
    `// Les traductions et les exemples viennent du curriculum : ils sont écrits à la main.`,
    `// À vérifier : la nature du mot, le niveau, les formes fléchies, et les exemples manquants.`,
    `import type { Theme } from '../../lib/lexicon';`,
    ``,
    `export const THEME_${themeKey.toUpperCase()}: Theme = {`,
    `  key: '${themeKey}',`,
    `  domain: '${plan.domain}',`,
    `  label: '${esc(plan.label)}',`,
    `  blurb: '${esc(plan.blurb)}',`,
    `  target: ${plan.target},`,
    `  words: [`,
  ];
  for (const d of uniq) {
    const ex = d.ex ?? { en: 'TODO', fr: 'TODO' };
    // La forme fléchie qui a servi à trouver l'exemple est conservée : c'est elle qui
    // permettra de retrouver le mot dans le corpus, et de bâtir un texte à trou cohérent.
    const also = d.ex?.form && d.ex.form !== d.w.toLowerCase() ? ` also: ['${esc(d.ex.form)}'],` : '';
    out.push(
      `    { w: '${esc(d.w)}', pos: '${d.pos}', fr: '${esc(d.fr)}', cefr: '${d.cefr}',${also}` +
        ` ex: { en: '${esc(ex.en)}', fr: '${esc(ex.fr)}' } },` +
        `${d.ex ? '' : ' // ⚠ exemple à écrire'} // ${d.from}`,
    );
  }
  out.push('  ],', '};', '');
  writeFileSync(`src/data/lexicon/${themeKey}.draft.ts`, out.join('\n'));
}

console.log(`\n${rows} rangées lues → ${written} mots dans ${byTheme.size} thèmes.`);
console.log(`${skipped.length} rangée(s)/leçon(s) écartée(s) :`);
for (const s of skipped.slice(0, 12)) console.log('  · ' + s);
if (skipped.length > 12) console.log(`  … et ${skipped.length - 12} autres`);
