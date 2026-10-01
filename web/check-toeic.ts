// Validateur des banques d'items au format TOEIC®.
//
//   bun check-toeic.ts
//
// C'est le filet qui rend acceptable la génération d'items par lots : une banque écrite à la main
// et une banque générée passent le MÊME contrôle. Sortie non nulle en cas d'erreur, pour pouvoir
// le brancher sur un pré-commit ou une CI plus tard.
import { TOEIC_BANKS, TOEIC_EXAMS, TOEIC_PASSAGES, passageById } from './src/data/toeic';
import { PART_DISPLAY, TOEIC_TAGS, isListening, type ToeicItem, type ToeicPart } from './src/lib/toeic';

const LEVELS = new Set(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']);
/** Nombre de propositions attendu par partie (la partie 2 n'en a que trois, à l'oral). */
const OPTIONS_PER_PART: Partial<Record<ToeicPart, number>> = { 1: 4, 2: 3, 3: 4, 4: 4, 5: 4, 6: 4, 7: 4 };

const errors: string[] = [];
const warnings: string[] = [];
const fail = (id: string, msg: string) => errors.push(`${id} : ${msg}`);
const warn = (id: string, msg: string) => warnings.push(`${id} : ${msg}`);

/** Normalise un énoncé pour repérer les doublons malgré la ponctuation et la casse. */
const key = (s: string) => s.toLowerCase().replace(/[^a-z0-9 ]+/g, ' ').replace(/\s+/g, ' ').trim();

const seenIds = new Set<string>();
const seenStems = new Map<string, string>();

function checkItem(item: ToeicItem, where: string) {
  const id = `${where}/${item.id}`;

  if (!/^p[1-7]-\d{3,}$/.test(item.id)) fail(id, `identifiant hors convention (attendu « p5-001 »)`);
  if (seenIds.has(item.id)) fail(id, 'identifiant en double — il sert de clé de statistiques, il doit être unique');
  seenIds.add(item.id);

  const expected = OPTIONS_PER_PART[item.part];
  if (expected && item.options.length !== expected)
    fail(id, `${item.options.length} propositions au lieu de ${expected} pour la partie ${item.part}`);

  if (!Number.isInteger(item.answer) || item.answer < 0 || item.answer >= item.options.length)
    fail(id, `« answer » (${item.answer}) ne désigne aucune proposition`);

  const seen = new Set<string>();
  for (const opt of item.options) {
    if (!opt.trim()) fail(id, 'une proposition est vide');
    const k = key(opt);
    if (seen.has(k)) fail(id, `proposition en double : « ${opt} »`);
    seen.add(k);
  }

  if (!item.explain.trim()) fail(id, 'correction (« explain ») vide — c’est tout l’intérêt de l’item');
  else if (item.explain.trim().length < 40) warn(id, 'correction très courte : dit-elle POURQUOI ?');

  if (!LEVELS.has(item.cefr)) fail(id, `niveau CEFR inconnu : « ${item.cefr} »`);

  if (!item.tags.length) fail(id, 'aucun tag — le bilan par point faible ne pourra rien en dire');
  for (const tag of item.tags) if (!(tag in TOEIC_TAGS)) fail(id, `tag inconnu : « ${tag} » (voir TOEIC_TAGS)`);

  // Parties 5 et 6 : la phrase doit VRAIMENT porter un trou, sinon la question n'en est pas une.
  if ((item.part === 5 || item.part === 6) && !item.stem.includes('____'))
    fail(id, 'aucun trou (« ______ ») dans l’énoncé');

  const k = key(item.stem);
  const twin = seenStems.get(k);
  if (twin) fail(id, `énoncé identique à ${twin}`);
  else seenStems.set(k, id);

  // ---------- Audio, images, passages ----------
  // Une partie écrite ne porte pas d'image, et une question d'écoute doit avoir quelque chose à
  // FAIRE ENTENDRE : sans script ni passage, l'item serait injouable — soit muet, soit résolu en
  // lisant un texte que le vrai examen n'imprime pas.
  if (!isListening(item.part) && item.image) fail(id, 'une partie écrite ne porte pas d’image');
  if (item.part !== 1 && item.image) fail(id, 'seule la partie 1 porte une image');
  if (item.part === 1 && !item.image) fail(id, 'partie 1 sans image — la question n’a plus d’objet');

  if (isListening(item.part) && !item.passage && item.part > 2)
    fail(id, `partie ${item.part} sans « passage » : son script serait introuvable`);

  if (item.passage) {
    const passage = passageById(item.passage);
    if (!passage) fail(id, `passage inconnu : « ${item.passage} »`);
    else {
      // Un item d'écoute a besoin de répliques à prononcer ; un item de lecture, de documents à
      // afficher. Confondre les deux donne une partie 7 muette ou une partie 3 sans bande.
      if (isListening(item.part) && !passage.turns?.length)
        fail(id, `le passage « ${passage.id} » n’a aucune réplique à lire`);
      if (!isListening(item.part) && !passage.docs?.length)
        fail(id, `le passage « ${passage.id} » n’a aucun document à afficher`);
    }
  }

  // Parties 1 et 2 : les propositions ne sont PAS imprimées, elles sont lues. Une proposition très
  // longue devient alors inintelligible à l'oreille — c'est une faute de conception, pas de goût.
  if (!PART_DISPLAY[item.part].options) {
    for (const opt of item.options)
      if (opt.split(/\s+/).length > 14)
        warn(id, `proposition de ${opt.split(/\s+/).length} mots alors qu’elle sera seulement ENTENDUE`);
  }
}

for (const bank of TOEIC_BANKS) {
  for (const item of bank.items) {
    checkItem(item, bank.id);
    if (item.part !== bank.part) fail(`${bank.id}/${item.id}`, `partie ${item.part} rangée dans une banque de partie ${bank.part}`);
  }
}

// ---------- Supports partagés ----------
const usedPassages = new Set(TOEIC_BANKS.flatMap((b) => b.items.map((i) => i.passage).filter(Boolean)));
const passageIds = new Set<string>();
for (const p of TOEIC_PASSAGES) {
  if (passageIds.has(p.id)) fail(p.id, 'identifiant de passage en double');
  passageIds.add(p.id);
  if (!p.intro.trim()) fail(p.id, 'passage sans annonce (« intro ») — elle est lue avant la bande');
  if (!p.turns?.length && !p.docs?.length) fail(p.id, 'passage vide : ni réplique ni document');
  for (const t of p.turns ?? []) {
    if (!t.text.trim()) fail(p.id, 'une réplique est vide');
    if (!t.speaker.trim()) fail(p.id, 'une réplique n’indique pas qui parle');
  }
  for (const d of p.docs ?? []) if (!d.body.trim()) fail(p.id, `document « ${d.label} » vide`);
  // Un passage orphelin est du contenu écrit pour rien : on le signale sans bloquer, il peut être
  // en cours de rédaction.
  if (!usedPassages.has(p.id)) warn(p.id, 'passage qu’aucune question n’utilise');
}

// Les épreuves réutilisent les items des banques : on ne les revalide pas (les identifiants
// seraient vus deux fois), on contrôle leur COHÉRENCE de section.
for (const exam of TOEIC_EXAMS) {
  if (!exam.sections.length) fail(exam.id, 'épreuve sans aucune section');
  for (const section of exam.sections) {
    const where = `${exam.id}/partie ${section.part}`;
    if (section.minutes <= 0) fail(where, 'durée nulle ou négative');
    if (!section.items.length) fail(where, 'section vide');
    for (const item of section.items)
      if (item.part !== section.part) fail(`${where}/${item.id}`, `item de partie ${item.part} dans une section de partie ${section.part}`);
    // Une bonne réponse toujours à la même place se devinerait sans lire la question.
    const spread = new Set(section.items.map((i) => i.answer));
    if (section.items.length >= 8 && spread.size < 3)
      warn(where, 'les bonnes réponses sont concentrées sur moins de trois positions — devinable');
  }
}

const items = TOEIC_BANKS.reduce((n, b) => n + b.items.length, 0);
for (const line of warnings) console.warn('⚠︎ ' + line);
if (errors.length) {
  for (const line of errors) console.error('✗ ' + line);
  console.error(`\n${errors.length} erreur(s) sur ${items} item(s).`);
  process.exit(1);
}
const byPart = TOEIC_BANKS.reduce<Record<number, number>>((acc, b) => {
  for (const i of b.items) acc[i.part] = (acc[i.part] ?? 0) + 1;
  return acc;
}, {});
const spread = [1, 2, 3, 4, 5, 6, 7].map((p) => `P${p} ${byPart[p] ?? 0}`).join(' · ');
console.log(
  `✓ ${items} item(s) valides (${spread}) dans ${TOEIC_BANKS.length} banque(s), ` +
    `${TOEIC_PASSAGES.length} support(s), ${TOEIC_EXAMS.length} épreuve(s).` +
    `${warnings.length ? ` ${warnings.length} avertissement(s).` : ''}`,
);
