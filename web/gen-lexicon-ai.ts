// Génération d'un thème de vocabulaire par l'API Claude, en trois passes.
//
//   bun gen-lexicon-ai.ts corps --dry-run        → estime le coût, ne dépense RIEN
//   bun gen-lexicon-ai.ts corps                  → génère le thème « corps »
//   bun gen-lexicon-ai.ts --all --max-spend 8    → tous les thèmes vides, plafond 8 $
//
// Écrit `src/data/lexicon/<thème>.draft.ts`, ignoré par git : un brouillon n'est pas du contenu.
//
// ── Pourquoi trois passes ───────────────────────────────────────────────────
//  1. INVENTAIRE  — quels mots ce thème doit contenir, au bon niveau, sans doublon.
//  2. RÉDACTION   — la fiche complète de chaque mot, par lots, avec mes 92 mots écrits à la main
//                   comme exemple de style (mis en cache : il est renvoyé à chaque lot).
//  3. VÉRIFICATION— un second modèle relit chaque fiche contre une grille et signale les
//                   douteuses. Je ne relis alors que ce qui est signalé — c'est ce qui rend la
//                   génération en masse acceptable.
//
// ── Choix des modèles ───────────────────────────────────────────────────────
// Sonnet 5 pour écrire, Haiku 4.5 pour vérifier. Ce n'est PAS un arbitrage de ma part : le budget
// de 10 $ a été fixé par l'utilisateur, et ce couple est celui sur lequel l'estimation de ~9 $ a
// été validée. `--model` permet de le changer.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { z } from 'zod';
import { THEME_PLAN } from './src/data/lexicon/themes';
import { THEMES, allWords } from './src/data/lexicon';
import { THEME_TRAVAIL } from './src/data/lexicon/travail';

// ── Tarifs (dollars par million de tokens) ─────────────────────────────────
// Sert UNIQUEMENT à l'estimation affichée et au plafond. À revérifier sur
// anthropic.com/pricing : un tarif périmé ici fausserait le garde-fou, pas la facture.
const PRICING: Record<string, { in: number; out: number }> = {
  'claude-sonnet-5': { in: 2, out: 10 },
  'claude-haiku-4-5': { in: 1, out: 5 },
  'claude-opus-5': { in: 5, out: 25 },
};

const WRITER = process.env.LEX_WRITER ?? 'claude-sonnet-5';
const CHECKER = process.env.LEX_CHECKER ?? 'claude-haiku-4-5';
const BATCH = 25; // mots par appel de rédaction
const PARALLEL = 4; // lots simultanés — assez pour aller vite, assez peu pour ne pas se faire limiter

const CACHE = '.lexicon-cache/ai';

// ── Suivi de la dépense ────────────────────────────────────────────────────
let spentUsd = 0;
let maxSpend = 8;
const usage = { in: 0, out: 0, cacheRead: 0, cacheWrite: 0, calls: 0 };

function account(model: string, u: { input_tokens: number; output_tokens: number; cache_read_input_tokens?: number | null; cache_creation_input_tokens?: number | null }) {
  const p = PRICING[model] ?? { in: 3, out: 15 };
  const read = u.cache_read_input_tokens ?? 0;
  const write = u.cache_creation_input_tokens ?? 0;
  // Lecture de cache ≈ 0,1× le tarif d'entrée, écriture ≈ 1,25×.
  spentUsd += (u.input_tokens * p.in + read * p.in * 0.1 + write * p.in * 1.25 + u.output_tokens * p.out) / 1e6;
  usage.in += u.input_tokens;
  usage.out += u.output_tokens;
  usage.cacheRead += read;
  usage.cacheWrite += write;
  usage.calls++;
}

function checkBudget() {
  if (spentUsd >= maxSpend) throw new Error(`plafond atteint : ${spentUsd.toFixed(2)} $ ≥ ${maxSpend} $ — arrêt`);
}

// ── Exemple de style : mes mots écrits à la main ────────────────────────────
// Douze entrées suffisent à transmettre le format, le ton des traductions et la façon de signaler
// un piège. Elles sont mises en cache côté serveur, donc leur coût n'est payé qu'une fois.
const EXEMPLAR = THEME_TRAVAIL.words
  .filter((w) => w.note)
  .slice(0, 12)
  .map((w) => JSON.stringify({ w: w.w, pos: w.pos, fr: w.fr, cefr: w.cefr, also: w.also, ex: w.ex, note: w.note }))
  .join('\n');

const RULES = `Tu rédiges des fiches de vocabulaire anglais→français pour un site d'apprentissage destiné à des francophones qui préparent le TOEIC.

Règles absolues :
- \`fr\` : UNE traduction, la plus courante DANS LE THÈME demandé. Jamais une liste d'acceptions, jamais d'article ("chien", pas "le chien").
- \`ex\` : une phrase anglaise courte (5 à 14 mots) qui emploie VRAIMENT le mot vedette, et sa traduction française naturelle. Contexte crédible et concret.
- \`pos\` : 'n' | 'v' | 'adj' | 'adv' | 'phr' ('phr' pour une locution ou un verbe à particule).
- \`cefr\` : 'A1'|'A2'|'B1'|'B2'|'C1'|'C2', selon la difficulté réelle pour un francophone.
- \`also\` : les formes fléchies utiles (pluriel, conjugaison) si elles existent. Omets sinon.
- \`note\` : SEULEMENT s'il y a un vrai piège — faux ami, construction inattendue, confusion fréquente, indénombrable. Sinon omets. Une note inutile est pire que pas de note.
- Français irréprochable : orthographe, accents, apostrophes typographiques (') et guillemets français.

Exemples de fiches conformes :
${EXEMPLAR}`;

// ⚠ `ANTHROPIC_BASE_URL` est exporté par l'environnement Claude Code (passerelle d'entreprise) :
// sans cette adresse en dur, le SDK y enverrait la clé personnelle, qui serait rejetée (401).
const client = new Anthropic({ baseURL: 'https://api.anthropic.com' });

// ── Schémas de sortie ──────────────────────────────────────────────────────
// ⚠ `pos` et `cefr` sont des `z.string()` et NON des `z.enum()`, volontairement. Avec l'énumération,
// une seule fiche portant un `pos` hors liste (« prep », « n/v »…) faisait échouer la validation du
// lot ENTIER : 25 fiches payées, 25 fiches perdues. Trois thèmes y sont passés. On accepte donc
// n'importe quelle chaîne, puis `normalize()` la ramène dans l'énumération — et n'écarte que la
// fiche réellement fautive.
const InventorySchema = z.object({
  words: z.array(z.object({ w: z.string(), cefr: z.string() })),
});

const RawEntrySchema = z.object({
  w: z.string(),
  pos: z.string(),
  fr: z.string(),
  cefr: z.string(),
  also: z.array(z.string()).optional(),
  note: z.string().optional(),
  ex: z.object({ en: z.string(), fr: z.string() }),
});
const EntriesSchema = z.object({ entries: z.array(RawEntrySchema) });
type RawEntry = z.infer<typeof RawEntrySchema>;
type Entry = Omit<RawEntry, 'pos' | 'cefr'> & { pos: Pos; cefr: Cefr };

type Pos = 'n' | 'v' | 'adj' | 'adv' | 'phr';
type Cefr = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

// Tout ce qu'un modèle écrit à la place des cinq natures attendues. Les natures que le site ne
// connaît pas (préposition, conjonction, déterminant) tombent dans `phr` : ce sont des mots-outils,
// ils s'apprennent dans un bout de phrase, pas isolés — c'est exactement ce que `phr` désigne ici.
const POS_ALIAS: Record<string, Pos> = {
  n: 'n', noun: 'n', nom: 'n', substantif: 'n', 'proper noun': 'n',
  v: 'v', verb: 'v', verbe: 'v', 'phrasal verb': 'phr', 'verbe à particule': 'phr',
  adj: 'adj', adjective: 'adj', adjectif: 'adj',
  adv: 'adv', adverb: 'adv', adverbe: 'adv',
  phr: 'phr', phrase: 'phr', phrasal: 'phr', expr: 'phr', expression: 'phr',
  idiom: 'phr', idiome: 'phr', locution: 'phr', 'locution nominale': 'n', collocation: 'phr',
  prep: 'phr', preposition: 'phr', préposition: 'phr',
  conj: 'phr', conjunction: 'phr', conjonction: 'phr',
  det: 'phr', determiner: 'phr', pron: 'phr', pronoun: 'phr', pronom: 'phr',
  num: 'adj', number: 'adj', numeral: 'adj', interj: 'phr', interjection: 'phr',
};

const CEFR_SET = new Set<string>(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);

/** `'Noun'`, `'n.'`, `'n/v'` → `'n'`. `null` si vraiment rien de reconnaissable. */
function toPos(raw: string): Pos | null {
  const k = raw.trim().toLowerCase().replace(/\.$/, '');
  // `n/v`, `adj (n)` : le modèle hésite entre deux natures — on prend la première, c'est celle
  // qu'il a jugée dominante.
  const first = k.split(/[\/,(|]/)[0].trim();
  return POS_ALIAS[k] ?? POS_ALIAS[first] ?? null;
}

const toCefr = (raw: string): Cefr | null => {
  const k = raw.trim().toUpperCase().replace(/\s+/g, '');
  return CEFR_SET.has(k) ? (k as Cefr) : null;
};

/**
 * Ramène un lot brut dans les énumérations du site. Une fiche irrécupérable est écartée SEULE,
 * avec son motif — c'est tout l'intérêt de la manœuvre par rapport à l'énumération zod.
 */
function normalize(raw: RawEntry[], drops: string[]): Entry[] {
  const out: Entry[] = [];
  for (const e of raw) {
    const pos = toPos(e.pos);
    const cefr = toCefr(e.cefr);
    if (!e.w?.trim() || !e.fr?.trim() || !e.ex?.en?.trim()) {
      drops.push(`${e.w || '?'} (fiche incomplète)`);
      continue;
    }
    if (!pos) {
      drops.push(`${e.w} (nature « ${e.pos} » inconnue)`);
      continue;
    }
    // Un niveau illisible ne justifie pas de jeter une fiche correcte : B1 est le milieu du
    // barème, et `check-content.ts` repassera dessus.
    if (!cefr) drops.push(`${e.w} (niveau « ${e.cefr} » → B1)`);
    // `also` ne sert QU'À retrouver le mot dans le corpus de phrases, et `formsOf` y ajoute déjà la
    // vedette : y répéter la vedette (fréquent sur les invariables — hurt, cost, shrimp) est du
    // poids mort. On dédoublonne ici plutôt que de le signaler 13 fois à la relecture.
    const also = [...new Set((e.also ?? []).map((f) => f.trim()).filter(Boolean))].filter(
      (f) => f.toLowerCase() !== e.w.trim().toLowerCase(),
    );
    out.push({ ...e, pos, cefr: cefr ?? 'B1', ...(also.length ? { also } : { also: undefined }) });
  }
  return out;
}

const ChecksSchema = z.object({
  checks: z.array(z.object({ w: z.string(), ok: z.boolean(), probleme: z.string().optional() })),
});

/**
 * Un appel, avec mise en cache du système et comptabilité de la dépense.
 *
 * Deux tentatives, pas plus. La première perte de lot venait d'une sortie TRONQUÉE
 * (`stop_reason: 'max_tokens'`) : le JSON s'arrêtait au milieu, zod rejetait tout, et l'appel était
 * payé pour rien. Le réessai double le plafond de jetons — c'est la seule cause de troncature, et
 * la même requête relancée à l'identique échouerait pareil. Un troisième essai ne rattraperait
 * qu'un incident réseau tout en risquant de tripler la facture d'un lot : on s'arrête à deux.
 */
// Plafond dur du SDK : `_calculateNonstreamingTimeout` refuse tout appel non diffusé dont
// `max_tokens` dépasse 128 000 / 6 ≈ 21 333 (« Streaming is required… »), AVANT même d'émettre la
// requête. Le réessai doit donc rester sous cette barre : passer en diffusion juste pour doubler un
// plafond que 21 000 couvre déjà largement (un lot de 25 fiches en consomme ~3 000) ne vaut pas la
// réécriture de `messages.parse` en flux.
const MAX_NONSTREAMING_TOKENS = 21000;

async function ask<T>(model: string, system: string, prompt: string, schema: z.ZodType<T>, maxTokens: number): Promise<T | null> {
  for (let attempt = 1; attempt <= 2; attempt++) {
    checkBudget();
    const budget = attempt === 1 ? maxTokens : Math.min(maxTokens * 2, MAX_NONSTREAMING_TOKENS);
    // try/catch et NON `.catch()` : les garde-fous du SDK (plafond de jetons, options invalides)
    // lèvent de façon SYNCHRONE, avant qu'une promesse existe — un `.catch()` les laissait remonter
    // jusqu'à la boucle principale et faisait tomber le run entier au lieu de perdre un lot.
    let res: unknown = null;
    try {
      res = await client.messages.parse({
        model,
        max_tokens: budget,
        // Le système est identique à chaque appel : mis en cache, il n'est facturé plein tarif qu'une fois.
        system: [{ type: 'text', text: system, cache_control: { type: 'ephemeral' } }],
        messages: [{ role: 'user', content: prompt }],
        // `effort: low` est le levier de coût documenté ; Haiku 4.5 ne l'accepte pas.
        output_config: { format: zodOutputFormat(schema as never), ...(model.includes('haiku') ? {} : { effort: 'low' as const }) },
      } as never);
    } catch (e: unknown) {
      const msg = String(e instanceof Error ? e.message : e).split('\n')[0];
      console.warn(`  ⚠ appel ${attempt}/2 en erreur (${model}) : ${msg.slice(0, 120)}`);
      // Une clé refusée ne se répare pas en réessayant, et chaque thème relancerait 2 appels par
      // lot pour rien : on remonte tout de suite.
      if (/authentication_error|invalid x-api-key|API key is invalid|permission_error/i.test(msg)) {
        throw new Error(`clé API refusée (401) — vérifie ANTHROPIC_API_KEY dans web/.env`);
      }
    }
    // Erreur réseau ou refus : la réponse n'existe pas, donc rien à facturer.
    if (!res) continue;

    const r = res as { usage: never; stop_reason?: string | null; parsed_output: T | null };
    account(model, r.usage);
    if (r.stop_reason === 'max_tokens') {
      console.warn(`  ⚠ sortie tronquée à ${budget} jetons (${model})${attempt === 1 ? ' — réessai au double' : ' — LOT PERDU'}`);
      continue;
    }
    if (!r.parsed_output) {
      console.warn(`  ⚠ sortie illisible (${model})${attempt === 1 ? ' — réessai' : ' — LOT PERDU'}`);
      continue;
    }
    return r.parsed_output;
  }
  return null;
}

/** Exécute des travaux par paquets de `PARALLEL`, pour aller vite sans se faire limiter. */
async function pool<I, O>(items: I[], fn: (item: I) => Promise<O>): Promise<O[]> {
  const out: O[] = [];
  for (let i = 0; i < items.length; i += PARALLEL) {
    out.push(...(await Promise.all(items.slice(i, i + PARALLEL).map(fn))));
  }
  return out;
}

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

// ── Génération d'un thème ──────────────────────────────────────────────────
async function generate(themeKey: string, count?: number) {
  const plan = THEME_PLAN.find((p) => p.key === themeKey);
  if (!plan) throw new Error(`thème inconnu : ${themeKey}`);

  // Tous les mots déjà écrits, tous thèmes confondus : un mot ne vit que dans UN thème.
  const taken = new Set(allWords().map((w) => w.w.toLowerCase()));
  const already = THEMES.find((t) => t.key === themeKey)?.words.map((w) => w.w) ?? [];

  // Un thème entamé ne génère que le RESTE : demander sa cible entière produirait des doublons
  // de ce qu'il contient déjà, et gonflerait la facture pour rien.
  const target = count ?? Math.max(0, plan.target - already.length);
  console.log(`\n▸ ${plan.label} — ${already.length} écrits, ${target} à produire (cible ${plan.target})`);
  if (!target) {
    console.log('  déjà complet');
    return;
  }

  // ── Passe 1 : inventaire ──
  // La liste d'exclusion pèse ~16 000 jetons (4 000 mots déjà écrits) et elle est IDENTIQUE pour les
  // 31 thèmes d'une série. Placée dans l'invite utilisateur, elle était refacturée plein tarif à
  // chaque thème — environ 1 $ sur la série. Placée en fin de bloc système, elle est mise en cache :
  // payée 1,25× une fois, puis 0,1×. Elle va APRÈS les règles, parce qu'un préfixe de cache ne vaut
  // que s'il est stable : `RULES` seul reste ainsi réutilisable par les appels de rédaction.
  const inv = await ask(
    WRITER,
    `${RULES}

Mots déjà traités ailleurs sur le site, à ne JAMAIS reprendre :
${[...taken].sort().join(', ')}`,
    `Thème : « ${plan.label} » — ${plan.blurb}
Donne les ${target} mots anglais les plus utiles de ce thème, du plus courant au plus rare, avec une répartition réaliste par niveau (beaucoup de A1-B1, moins de C1-C2).
Aucun des mots déjà traités listés dans les consignes. Réponds uniquement avec la liste, ${target} mots au maximum.`,
    InventorySchema,
    16000,
  );
  // 16 000 et non 8 000 : `effort: low` consomme des jetons de raisonnement sur le MÊME plafond que
  // la réponse, et un inventaire de 180 mots s'arrêtait donc au milieu de la liste.
  // `.slice(0, target)` : le modèle rend régulièrement BEAUCOUP plus de mots que demandé — 44 pour
  // une demande de 1, constaté sur « maison ». Sans ce plafond, on paie la rédaction de dizaines de
  // fiches non voulues (0,13 $ au lieu de 0,01 $ sur ce seul thème) et on dépasse l'objectif du
  // thème, que `check-content.ts` signale aussitôt. L'inventaire étant trié du plus courant au plus
  // rare, couper par la fin garde les mots les plus utiles.
  const words = (inv?.words ?? [])
    .filter((x) => x.w?.trim() && !taken.has(x.w.trim().toLowerCase()))
    .map((x) => ({ w: x.w.trim(), cefr: toCefr(x.cefr) ?? 'B1' }))
    .slice(0, target);
  console.log(`  inventaire : ${words.length} mots · ${spentUsd.toFixed(3)} $`);
  if (!words.length) return;

  // ── Passe 2 : rédaction, par lots ──
  const batches: typeof words[] = [];
  for (let i = 0; i < words.length; i += BATCH) batches.push(words.slice(i, i + BATCH));

  const drops: string[] = [];
  const written = (
    await pool(batches, async (batch) => {
      const r = await ask(
        WRITER,
        RULES,
        `Thème : « ${plan.label} » — ${plan.blurb}
Rédige la fiche complète de chacun de ces mots, dans cet ordre, en respectant le niveau indiqué :
${batch.map((x) => `- ${x.w} (${x.cefr})`).join('\n')}`,
        EntriesSchema,
        16000,
      );
      return normalize(r?.entries ?? [], drops);
    })
  ).flat();
  console.log(`  rédaction  : ${written.length} fiches · ${spentUsd.toFixed(3)} $`);
  if (drops.length) console.log(`  normalisées/écartées : ${drops.join(' · ')}`);

  // ── Passe 3 : vérification ──
  const vBatches: Entry[][] = [];
  for (let i = 0; i < written.length; i += BATCH) vBatches.push(written.slice(i, i + BATCH));
  const verdicts = new Map<string, string>();
  const checked = (
    await pool(vBatches, async (batch) => {
      const r = await ask(
        CHECKER,
        `Tu relis des fiches de vocabulaire anglais→français. Pour chaque fiche, réponds ok=false et décris le problème en français SI ET SEULEMENT SI l'un de ces défauts est présent :
- la traduction française est fausse, ou ne correspond pas au sens attendu dans le thème indiqué ;
- l'exemple anglais n'emploie pas le mot vedette (ou une de ses formes) ;
- la traduction de l'exemple est fausse ou maladroite ;
- le niveau CEFR est manifestement absurde ;
- la note est fausse ;
- faute de français (orthographe, accord, accent).
Sinon ok=true. Sois strict mais ne signale pas les questions de goût.`,
        `Thème : « ${plan.label} ».\n${batch.map((e) => JSON.stringify(e)).join('\n')}`,
        ChecksSchema,
        4000,
      );
      return r?.checks ?? [];
    })
  ).flat();
  for (const c of checked) if (!c.ok) verdicts.set(c.w.toLowerCase(), c.probleme ?? 'signalé sans motif');
  console.log(`  vérification: ${verdicts.size} fiche(s) signalée(s) sur ${written.length} · ${spentUsd.toFixed(3)} $`);

  // ── Écriture du brouillon ──
  const lines = [
    `// BROUILLON — généré par : bun gen-lexicon-ai.ts ${themeKey}`,
    `// Rédaction : ${WRITER} · vérification : ${CHECKER}`,
    `// Les fiches SIGNALÉES par la vérification sont commentées, avec le motif. À trancher à la main.`,
    `// Aucune fiche n'a été relue une à une : la vérification automatique et check-content.ts en tiennent lieu.`,
    `import type { Theme } from '../../lib/lexicon';`,
    ``,
    `export const THEME_${themeKey.toUpperCase().replace(/[^A-Z0-9]/g, '_')}: Theme = {`,
    `  key: '${esc(themeKey)}',`,
    `  domain: '${esc(plan.domain)}',`,
    `  label: '${esc(plan.label)}',`,
    `  blurb: '${esc(plan.blurb)}',`,
    `  target: ${plan.target},`,
    `  words: [`,
  ];
  if (already.length) lines.push(`    // ⚠ ${already.length} mot(s) déjà présents dans le thème publié : ${already.join(', ')}`);
  for (const e of written) {
    const bad = verdicts.get(e.w.toLowerCase());
    // ⚠ `note` est un CHAMP, pas un commentaire. Il était écrit en `// …` en fin de ligne : lisible
    // à la relecture, mais invisible pour `import` — donc `merge-lexicon-draft.ts` perdait
    // silencieusement toutes les notes, c'est-à-dire les faux amis et les pièges de construction,
    // la partie la plus utile d'une fiche et celle que les règles demandent explicitement.
    const body =
      `{ w: '${esc(e.w)}', pos: '${e.pos}', fr: '${esc(e.fr)}', cefr: '${e.cefr}',` +
      (e.also?.length ? ` also: [${e.also.map((f) => `'${esc(f)}'`).join(', ')}],` : '') +
      ` ex: { en: '${esc(e.ex.en)}', fr: '${esc(e.ex.fr)}' }` +
      (e.note ? `, note: '${esc(e.note.replace(/\s*\n\s*/g, ' ').trim())}'` : '') +
      ' },';
    lines.push(bad ? `    // SIGNALÉ — ${bad}\n    // ${body}` : `    ${body}`);
  }
  lines.push('  ],', '};', '');

  mkdirSync('src/data/lexicon', { recursive: true });
  const out = `src/data/lexicon/${themeKey}.draft.ts`;
  writeFileSync(out, lines.join('\n'));
  console.log(`  ✓ ${out} — ${written.length - verdicts.size} fiche(s) retenues, ${verdicts.size} à trancher`);
}

// ── Estimation à blanc ─────────────────────────────────────────────────────
// Aucun appel réseau : on compte les caractères des invites et on suppose ~110 tokens de sortie
// par fiche. C'est une ESTIMATION, affichée pour décider — le compteur réel tourne pendant le run.
function dryRun(keys: string[]) {
  const T = (s: string) => Math.ceil(s.length / 3.5);
  const sys = T(RULES);
  let inTok = 0;
  let outTok = 0;
  let entries = 0;
  for (const key of keys) {
    const plan = THEME_PLAN.find((p) => p.key === key)!;
    const n = Math.max(0, plan.target - (THEMES.find((t) => t.key === key)?.words.length ?? 0));
    if (!n) continue;
    entries += n;
    const batches = Math.ceil(n / BATCH);
    // inventaire : 1 appel · rédaction : `batches` appels · vérification : `batches` appels
    inTok += sys * (1 + batches) + 4000 + batches * 400; // la liste d'exclusion pèse
    inTok += batches * (110 * BATCH); // la vérification relit les fiches produites
    outTok += n * 12 + n * 110 + n * 20;
  }
  const w = PRICING[WRITER];
  const c = PRICING[CHECKER];
  // Grossier mais honnête : on impute l'entrée au rédacteur, la vérification au relecteur.
  const est = (inTok * w.in + outTok * 0.85 * w.out + outTok * 0.15 * c.out) / 1e6;
  console.log(`\nEstimation pour ${keys.length} thème(s), ${entries} fiches :`);
  console.log(`  ~${(inTok / 1000).toFixed(0)} k tokens d'entrée, ~${(outTok / 1000).toFixed(0)} k de sortie`);
  console.log(`  ≈ ${est.toFixed(2)} $  (rédaction ${WRITER}, vérification ${CHECKER})`);
  console.log(`  ⚠ estimation, pas un devis. La mise en cache du système la fait généralement BAISSER.`);
  console.log(`\nPour lancer : bun gen-lexicon-ai.ts ${keys.length > 3 ? '--all' : keys.join(' ')} --max-spend ${Math.ceil(est * 1.5)}`);
}

// ── Entrée ─────────────────────────────────────────────────────────────────
const argv = process.argv.slice(2);
const dry = argv.includes('--dry-run');
const msIdx = argv.indexOf('--max-spend');
if (msIdx >= 0) maxSpend = Number(argv[msIdx + 1]);
const cIdx = argv.indexOf('--count');
const count = cIdx >= 0 ? Number(argv[cIdx + 1]) : undefined;

const empty = THEMES.filter((t) => !t.words.length).map((t) => t.key);
const incomplete = THEMES.filter((t) => t.words.length < t.target).map((t) => t.key);
const keys = argv.includes('--incomplete') ? incomplete : argv.includes('--all') ? empty : argv.filter((a) => !a.startsWith('--') && THEME_PLAN.some((p) => p.key === a));

if (!keys.length) {
  console.error('usage : bun gen-lexicon-ai.ts <thème…>|--all [--dry-run] [--max-spend N] [--count N]');
  console.error(`\nvides (${empty.length}) : ${empty.join(' ') || '—'}`);
  console.error(`incomplets (${incomplete.length}) : ${incomplete.join(' ') || '—'}`);
  process.exit(1);
}

if (dry) {
  dryRun(keys);
  process.exit(0);
}

if (!process.env.ANTHROPIC_API_KEY) {
  console.error('✗ ANTHROPIC_API_KEY absente. Pose-la dans web/.env (une ligne : ANTHROPIC_API_KEY=…).');
  process.exit(1);
}

mkdirSync(CACHE, { recursive: true });
console.log(`Plafond de dépense : ${maxSpend} $`);
try {
  for (const key of keys) await generate(key, count);
} catch (e) {
  console.error(`\n✗ ${e instanceof Error ? e.message : String(e)}`);
} finally {
  console.log(`\n── Dépense réelle : ${spentUsd.toFixed(3)} $ sur ${usage.calls} appel(s)`);
  console.log(`   ${usage.in} entrée · ${usage.cacheRead} lus en cache · ${usage.cacheWrite} écrits en cache · ${usage.out} sortie`);
  console.log(`   Relire les brouillons, puis : bun check-content.ts`);
}
