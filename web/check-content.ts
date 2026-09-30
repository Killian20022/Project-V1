// Validateur du contenu pédagogique : le lexique et le classement des fiches de grammaire.
//
//   bun check-content.ts
//
// Même rôle que `check-toeic.ts` : un thème de vocabulaire écrit à la main et un thème généré
// doivent passer le MÊME contrôle. Sortie non nulle en cas d'erreur.
import { DOMAINS, THEMES, VOCAB_TARGET } from './src/data/lexicon';
import { POS_LABEL, STEP_SIZE, stepsOf } from './src/lib/lexicon';
import { checkGrammarFamilies } from './src/lib/content';

const errors: string[] = [];
const warnings: string[] = [];

// ---------- Lexique ----------
const seen = new Map<string, string>();
const themeKeys = new Set<string>();
const domainKeys = new Set(DOMAINS.map((d) => d.key));
let words = 0;
let written = 0;

for (const theme of THEMES) {
  if (themeKeys.has(theme.key)) errors.push(`clé de thème en double : « ${theme.key} »`);
  themeKeys.add(theme.key);
  if (!domainKeys.has(theme.domain)) errors.push(`thème « ${theme.key} » : domaine inconnu « ${theme.domain} »`);
  if (theme.target <= 0) errors.push(`thème « ${theme.key} » : objectif de mots nul`);
  // Un thème vide est LÉGITIME : il fait partie du plan, il n'est pas encore écrit.
  if (!theme.words.length) continue;
  written++;
  if (theme.words.length > theme.target)
    warnings.push(`${theme.key} : ${theme.words.length} mots écrits pour un objectif de ${theme.target} — relever l’objectif ?`);
  for (const e of theme.words) {
    words++;
    const where = `${theme.key}/${e.w}`;
    const key = e.w.toLowerCase();

    // Un mot ne peut appartenir qu'à un thème : sinon il aurait deux cartes de révision
    // concurrentes pour un seul identifiant (`w|mot`), et la progression serait incohérente.
    const twin = seen.get(key);
    if (twin) errors.push(`${where} : déjà présent dans ${twin}`);
    else seen.set(key, where);

    if (!e.fr.trim()) errors.push(`${where} : traduction vide`);
    if (!(e.pos in POS_LABEL)) errors.push(`${where} : nature inconnue « ${e.pos} »`);
    if (!e.ex?.en.trim() || !e.ex?.fr.trim()) errors.push(`${where} : exemple incomplet`);

    // L'exemple doit contenir le mot, sous une forme ou une autre — sinon il n'illustre rien.
    const forms = [e.w, ...(e.also ?? [])];
    const inExample = forms.some((f) => new RegExp(`\\b${f.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(e.ex.en));
    if (!inExample) errors.push(`${where} : le mot n’apparaît pas dans son exemple`);

    // Une forme fléchie identique à la vedette ne sert à rien et fausse la recherche au corpus.
    for (const f of e.also ?? []) if (f.toLowerCase() === key) warnings.push(`${where} : forme « ${f} » identique à la vedette`);
  }

  const last = stepsOf(theme).at(-1);
  if (last && last.length < STEP_SIZE / 2 && theme.words.length > STEP_SIZE)
    warnings.push(`${theme.key} : le dernier palier n’a que ${last.length} mot(s)`);
}

// Les distracteurs de même nature se tirent du lexique ENTIER (cf. `wordDistractors`), pas du
// seul thème : on compte donc globalement. En dessous de quatre mots d'une nature donnée, les
// QCM retombent sur des propositions de nature différente — donc trop faciles.
const globalPos = new Map<string, number>();
for (const theme of THEMES) for (const e of theme.words) globalPos.set(e.pos, (globalPos.get(e.pos) ?? 0) + 1);
for (const [pos, n] of globalPos)
  if (n < 4)
    warnings.push(`lexique : seulement ${n} mot(s) de nature « ${POS_LABEL[pos as keyof typeof POS_LABEL]} » — distracteurs faibles pour ces mots`);

// ---------- Familles de grammaire ----------
const { undeclared, unknownCategory } = checkGrammarFamilies();
for (const l of undeclared) errors.push(`fiche de grammaire non classée : ${l}`);
for (const l of unknownCategory) errors.push(`famille inconnue : ${l}`);

for (const line of warnings) console.warn('⚠︎ ' + line);
if (errors.length) {
  for (const line of errors) console.error('✗ ' + line);
  console.error(`\n${errors.length} erreur(s).`);
  process.exit(1);
}
const pct = Math.round((words / VOCAB_TARGET) * 100);
console.log(
  `✓ ${words} mot(s) écrits sur un objectif de ${VOCAB_TARGET} (${pct} %), ` +
    `${written}/${THEMES.length} thème(s) remplis dans ${DOMAINS.length} domaines, ` +
    `${THEMES.reduce((n, t) => n + stepsOf(t).length, 0)} palier(s) ; ` +
    `toutes les fiches de grammaire sont classées.${warnings.length ? ` ${warnings.length} avertissement(s).` : ''}`,
);
