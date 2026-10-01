// Génère les six scènes de la partie 1 du TOEIC en SVG.
//
//   bun gen-toeic-scenes.ts
//
// Écrit `public/assets/toeic/p1-0N.svg`. Relancer après toute modification des scènes ci-dessous.
//
// ── Pourquoi des dessins et pas des photos ─────────────────────────────────
// La partie 1 demande de choisir, parmi quatre phrases entendues, celle qui décrit l'image. Une
// photo de banque libre conviendrait mieux au réalisme, mais le téléchargement est impossible depuis
// cet environnement, et surtout : un item de partie 1 ne vaut QUE si l'image tranche sans
// ambiguïté. Une photo rapporte toujours des détails qu'on n'a pas voulus — un passant, une
// enseigne, un objet au second plan — et un distracteur qu'on croyait réfutable devient défendable.
// Un dessin, lui, ne contient que ce qu'on y met : ici le nombre de personnes, leur posture et les
// objets présents sont exactement ceux que les items interrogent. C'est plus pauvre et plus juste.
//
// Contraintes tenues : aucune dépendance, aucun réseau, quelques kilo-octets par fichier, et la
// palette du site (parchemin et encre) pour que ça n'ait pas l'air collé d'ailleurs.
import { mkdirSync, writeFileSync } from 'node:fs';

const W = 900;
const H = 560;

// Palette : les mêmes ocres et verts sourds que le reste de Scriptoria.
const C = {
  sky: '#dfd3b4',
  ground: '#c9b894',
  ink: '#2b2117',
  line: '#6b5a42',
  wall: '#e6dcc4',
  wood: '#9c7a4e',
  woodDark: '#7a5c38',
  metal: '#a8a49b',
  skin: '#d8b48c',
  cloth1: '#4a6b57',
  cloth2: '#7a4a3a',
  cloth3: '#3f5370',
  hiVis: '#d9b23a',
  white: '#f2ecda',
  glass: '#b9c9c4',
};

/** Un personnage debout, vu de face. `arms` change la posture, c'est ce que les items interrogent. */
function person(x: number, y: number, s: number, cloth: string, opts: { arms?: 'down' | 'forward' | 'up' | 'hold'; hat?: string; vest?: boolean } = {}) {
  const { arms = 'down', hat, vest } = opts;
  const armPath =
    arms === 'forward'
      ? `M${x - 7 * s},${y + 20 * s} L${x - 16 * s},${y + 30 * s} M${x + 7 * s},${y + 20 * s} L${x + 16 * s},${y + 30 * s}`
      : arms === 'up'
        ? `M${x - 7 * s},${y + 20 * s} L${x - 15 * s},${y + 8 * s} M${x + 7 * s},${y + 20 * s} L${x + 15 * s},${y + 8 * s}`
        : arms === 'hold'
          ? `M${x - 7 * s},${y + 20 * s} L${x - 12 * s},${y + 32 * s} M${x + 7 * s},${y + 20 * s} L${x + 12 * s},${y + 32 * s}`
          : `M${x - 7 * s},${y + 20 * s} L${x - 11 * s},${y + 38 * s} M${x + 7 * s},${y + 20 * s} L${x + 11 * s},${y + 38 * s}`;
  return `
    <circle cx="${x}" cy="${y}" r="${9 * s}" fill="${C.skin}" stroke="${C.ink}" stroke-width="${1.6 * s}"/>
    ${hat ? `<path d="M${x - 11 * s},${y - 4 * s} a${11 * s},${11 * s} 0 0 1 ${22 * s},0 z" fill="${hat}" stroke="${C.ink}" stroke-width="${1.6 * s}"/>` : ''}
    <path d="M${x},${y + 9 * s} L${x},${y + 42 * s}" stroke="${C.ink}" stroke-width="${1.6 * s}"/>
    <path d="M${x - 11 * s},${y + 14 * s} h${22 * s} v${28 * s} h${-22 * s} z" fill="${cloth}" stroke="${C.ink}" stroke-width="${1.6 * s}"/>
    ${vest ? `<path d="M${x - 11 * s},${y + 18 * s} h${22 * s} v${6 * s} h${-22 * s} z" fill="${C.hiVis}" stroke="${C.ink}" stroke-width="${1.2 * s}"/>` : ''}
    <path d="${armPath}" stroke="${C.ink}" stroke-width="${1.8 * s}" fill="none"/>
    <path d="M${x - 5 * s},${y + 42 * s} L${x - 6 * s},${y + 62 * s} M${x + 5 * s},${y + 42 * s} L${x + 6 * s},${y + 62 * s}" stroke="${C.ink}" stroke-width="${2 * s}"/>`;
}

/**
 * Un personnage ASSIS, de profil, tourné vers la droite. `seatX`/`seatY` sont le point d'ASSISE,
 * pas la tête — c'est ce qui garantit qu'il repose vraiment sur sa chaise.
 *
 * La première version était ancrée sur la tête : à l'échelle 1,5 le personnage se retrouvait à
 * 90 px au-dessus du siège et ses bras n'atteignaient plus le bureau. Sur un item dont la bonne
 * réponse est « the man is typing on a laptop », ça suffit à rendre la question insoluble. Ici la
 * cuisse part de l'assise, le buste monte au-dessus, et `reach` donne la hauteur à laquelle les
 * mains doivent arriver — on la cale sur le plateau du bureau.
 */
function seated(seatX: number, seatY: number, s: number, cloth: string, reach?: { x: number; y: number }) {
  const hipY = seatY - 2 * s;
  const torso = 30 * s;
  const shoulderY = hipY - torso;
  const headY = shoulderY - 10 * s;
  const handX = reach?.x ?? seatX + 26 * s;
  const handY = reach?.y ?? hipY - 6 * s;
  return `
    <path d="M${seatX},${hipY} L${seatX + 26 * s},${hipY} L${seatX + 28 * s},${hipY + 26 * s}" stroke="${C.ink}" stroke-width="${2.4 * s}" fill="none" stroke-linejoin="round"/>
    <path d="M${seatX - 9 * s},${hipY} h${19 * s} v${-torso} h${-19 * s} z" fill="${cloth}" stroke="${C.ink}" stroke-width="${1.7 * s}"/>
    <path d="M${seatX + 7 * s},${shoulderY + 8 * s} L${handX},${handY}" stroke="${C.ink}" stroke-width="${2 * s}" fill="none"/>
    <circle cx="${seatX}" cy="${headY}" r="${9.5 * s}" fill="${C.skin}" stroke="${C.ink}" stroke-width="${1.7 * s}"/>
    <path d="M${seatX + 7 * s},${headY - 3 * s} a${9.5 * s},${9.5 * s} 0 0 0 ${-14 * s},${-4 * s}" fill="${C.ink}" opacity="0.75"/>`;
}

const chair = (x: number, y: number) => `
  <path d="M${x},${y} h34 v6 h-34 z" fill="${C.woodDark}" stroke="${C.ink}" stroke-width="2"/>
  <path d="M${x + 30},${y} v-34 h5 v34" fill="${C.woodDark}" stroke="${C.ink}" stroke-width="2"/>
  <path d="M${x + 3},${y + 6} v26 M${x + 29},${y + 6} v26" stroke="${C.ink}" stroke-width="2.5"/>`;

const box = (x: number, y: number, w: number, h: number) => `
  <path d="M${x},${y} h${w} v${h} h${-w} z" fill="${C.wood}" stroke="${C.ink}" stroke-width="2"/>
  <path d="M${x + w / 2},${y} v${h}" stroke="${C.ink}" stroke-width="1.2" opacity="0.5"/>
  <path d="M${x},${y + h * 0.34} h${w}" stroke="${C.ink}" stroke-width="1.2" opacity="0.35"/>`;

const frame = (inner: string, floorY: number, wall = C.wall) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img">
  <rect width="${W}" height="${H}" fill="${wall}"/>
  <rect y="${floorY}" width="${W}" height="${H - floorY}" fill="${C.ground}"/>
  <path d="M0,${floorY} H${W}" stroke="${C.line}" stroke-width="2.5"/>
  ${inner}
  <rect x="2" y="2" width="${W - 4}" height="${H - 4}" fill="none" stroke="${C.line}" stroke-width="4"/>
</svg>`;

// ── p1-01 — un homme SEUL, assis, qui tape sur un portable ─────────────────
// Le bureau est à 352, l'assise à 372 : les mains visent 348, juste sur le clavier. Un seul
// personnage, et la fenêtre reste loin de lui — le distracteur « walking toward the window » doit
// être manifestement faux.
const s1 = frame(
  `
  <path d="M90,120 h190 v130 h-190 z" fill="${C.glass}" stroke="${C.line}" stroke-width="3"/>
  <path d="M185,120 v130 M90,185 h190" stroke="${C.line}" stroke-width="2"/>
  <path d="M470,372 h40 v6 h-40 z" fill="${C.woodDark}" stroke="${C.ink}" stroke-width="2"/>
  <path d="M470,336 h6 v38 h-6 z" fill="${C.woodDark}" stroke="${C.ink}" stroke-width="2"/>
  <path d="M488,378 v54" stroke="${C.ink}" stroke-width="3"/>
  ${seated(500, 372, 1.5, C.cloth3, { x: 604, y: 346 })}
  <path d="M560,352 h230 v9 h-230 z" fill="${C.wood}" stroke="${C.ink}" stroke-width="2.5"/>
  <path d="M576,361 v71 M774,361 v71" stroke="${C.ink}" stroke-width="3.5"/>
  <path d="M596,352 l10,-40 h78 l-4,40 z" fill="${C.metal}" stroke="${C.ink}" stroke-width="2.5"/>
  <path d="M606,312 h78 v-54 h-84 z" fill="${C.white}" stroke="${C.ink}" stroke-width="2.5"/>
  <path d="M614,272 h58 M614,288 h40" stroke="${C.line}" stroke-width="2.4"/>`,
  432,
);

// ── p1-02 — entrepôt : cartons sur palettes, chariot à l'ARRÊT, sans conducteur ──
const s2 = frame(
  `
  <path d="M0,120 H${W}" stroke="${C.line}" stroke-width="2" opacity="0.4"/>
  ${box(90, 300, 90, 70)}${box(185, 300, 90, 70)}${box(120, 228, 90, 70)}
  <path d="M80,370 h200 v14 h-200 z" fill="${C.woodDark}" stroke="${C.ink}" stroke-width="2"/>
  <path d="M100,384 v10 M250,384 v10" stroke="${C.ink}" stroke-width="3"/>
  ${box(330, 318, 80, 52)}${box(415, 318, 80, 52)}
  <path d="M322,370 h180 v14 h-180 z" fill="${C.woodDark}" stroke="${C.ink}" stroke-width="2"/>
  <path d="M640,250 h120 v120 h-120 z" fill="${C.hiVis}" stroke="${C.ink}" stroke-width="2.5"/>
  <path d="M660,250 v-60 h16 v60" fill="${C.metal}" stroke="${C.ink}" stroke-width="2"/>
  <path d="M676,196 h70 v8 h-70 z" fill="${C.metal}" stroke="${C.ink}" stroke-width="2"/>
  <path d="M742,204 v160 h10 v-160 z" fill="${C.metal}" stroke="${C.ink}" stroke-width="2"/>
  <path d="M752,356 h60 v10 h-60 z" fill="${C.metal}" stroke="${C.ink}" stroke-width="2"/>
  <circle cx="665" cy="382" r="26" fill="${C.ink}"/><circle cx="665" cy="382" r="10" fill="${C.metal}"/>
  <circle cx="745" cy="382" r="20" fill="${C.ink}"/><circle cx="745" cy="382" r="7" fill="${C.metal}"/>`,
  400,
);

// ── p1-03 — réunion : cinq personnes assises, UNE debout devant un écran ───
const s3 = frame(
  `
  <path d="M580,110 h280 v170 h-280 z" fill="${C.ink}" stroke="${C.line}" stroke-width="4"/>
  <path d="M610,150 h150 M610,185 h210 M610,220 h120" stroke="${C.white}" stroke-width="7" opacity="0.65"/>
  ${person(500, 170, 1.45, C.cloth1, { arms: 'forward' })}
  ${chair(60, 418)}${chair(170, 418)}${chair(280, 418)}${chair(390, 418)}
  ${seated(80, 418, 1.2, C.cloth2, { x: 142, y: 372 })}
  ${seated(190, 418, 1.2, C.cloth3, { x: 252, y: 372 })}
  ${seated(300, 418, 1.2, C.cloth1, { x: 362, y: 372 })}
  ${seated(410, 418, 1.2, C.cloth2, { x: 472, y: 372 })}
  <path d="M50,376 h440 v12 h-440 z" fill="${C.wood}" stroke="${C.ink}" stroke-width="2.5"/>
  <path d="M78,388 v74 M462,388 v74" stroke="${C.ink}" stroke-width="3.5"/>
  <path d="M110,366 h54 v10 h-54 z" fill="${C.white}" stroke="${C.ink}" stroke-width="1.8"/>
  <path d="M300,366 h54 v10 h-54 z" fill="${C.white}" stroke="${C.ink}" stroke-width="1.8"/>`,
  470,
);

// ── p1-04 — chantier : deux ouvriers casqués, l'un tient un plan DÉPLIÉ ────
const s4 = frame(
  `
  <path d="M60,300 h90 v130 h-90 z" fill="${C.metal}" stroke="${C.ink}" stroke-width="2.5" opacity="0.8"/>
  <path d="M60,340 h90 M60,382 h90 M105,300 v130" stroke="${C.ink}" stroke-width="2" opacity="0.6"/>
  <path d="M760,140 v290" stroke="${C.ink}" stroke-width="7"/>
  <path d="M700,140 h120 v14 h-120 z" fill="${C.metal}" stroke="${C.ink}" stroke-width="2.5"/>
  <path d="M706,154 v40" stroke="${C.ink}" stroke-width="2.5"/>
  <path d="M684,194 h46 v34 h-46 z" fill="${C.wood}" stroke="${C.ink}" stroke-width="2.5"/>
  ${person(330, 230, 1.75, C.cloth3, { arms: 'hold', hat: C.hiVis, vest: true })}
  ${person(520, 230, 1.75, C.cloth2, { arms: 'forward', hat: C.hiVis, vest: true })}
  <path d="M362,286 h130 v76 h-130 z" fill="${C.white}" stroke="${C.ink}" stroke-width="2.5"/>
  <path d="M380,306 h94 M380,326 h70 M380,344 h94" stroke="${C.line}" stroke-width="2.2"/>
  <path d="M427,286 v76" stroke="${C.line}" stroke-width="1.6" opacity="0.6"/>`,
  430,
  C.sky,
);

// ── p1-05 — rue commerçante : piétons qui marchent, vélos GARÉS ────────────
const s5 = frame(
  `
  <path d="M40,110 h250 v210 h-250 z" fill="${C.wall}" stroke="${C.line}" stroke-width="3"/>
  <path d="M70,170 h190 v110 h-190 z" fill="${C.glass}" stroke="${C.line}" stroke-width="2.5"/>
  <path d="M165,170 v110" stroke="${C.line}" stroke-width="2"/>
  <path d="M330,110 h260 v210 h-260 z" fill="${C.wall}" stroke="${C.line}" stroke-width="3"/>
  <path d="M360,180 h200 v100 h-200 z" fill="${C.glass}" stroke="${C.line}" stroke-width="2.5"/>
  <path d="M630,110 h230 v210 h-230 z" fill="${C.wall}" stroke="${C.line}" stroke-width="3"/>
  <path d="M660,180 h170 v100 h-170 z" fill="${C.glass}" stroke="${C.line}" stroke-width="2.5"/>
  ${person(200, 360, 1.35, C.cloth1, { arms: 'down' })}
  ${person(300, 366, 1.35, C.cloth2, { arms: 'down' })}
  ${person(430, 362, 1.35, C.cloth3, { arms: 'down' })}
  <path d="M600,330 v90 M760,330 v90" stroke="${C.metal}" stroke-width="7"/>
  <circle cx="630" cy="446" r="24" fill="none" stroke="${C.ink}" stroke-width="4"/>
  <circle cx="700" cy="446" r="24" fill="none" stroke="${C.ink}" stroke-width="4"/>
  <path d="M630,446 L664,412 L700,446 M664,412 v-26 h20" stroke="${C.ink}" stroke-width="3.5" fill="none"/>
  <circle cx="750" cy="446" r="24" fill="none" stroke="${C.ink}" stroke-width="4"/>
  <circle cx="820" cy="446" r="24" fill="none" stroke="${C.ink}" stroke-width="4"/>
  <path d="M750,446 L784,412 L820,446 M784,412 v-26 h20" stroke="${C.ink}" stroke-width="3.5" fill="none"/>`,
  330,
  C.sky,
);

// ── p1-06 — restaurant dressé mais VIDE, un serveur debout ────────────────
const round = (x: number, y: number, r: number) => `
  <ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.36}" fill="${C.white}" stroke="${C.ink}" stroke-width="2.5"/>
  <path d="M${x},${y + r * 0.3} v${r * 0.75}" stroke="${C.ink}" stroke-width="3.5"/>
  <ellipse cx="${x}" cy="${y + r * 1.05}" rx="${r * 0.4}" ry="${r * 0.14}" fill="none" stroke="${C.ink}" stroke-width="2.5"/>
  <circle cx="${x - r * 0.4}" cy="${y - r * 0.05}" r="${r * 0.17}" fill="none" stroke="${C.line}" stroke-width="2"/>
  <circle cx="${x + r * 0.4}" cy="${y - r * 0.05}" r="${r * 0.17}" fill="none" stroke="${C.line}" stroke-width="2"/>
  <path d="M${x - r * 0.08},${y - r * 0.2} v${-r * 0.3} h${r * 0.16} v${r * 0.3} z" fill="${C.glass}" stroke="${C.line}" stroke-width="1.6"/>`;

const s6 = frame(
  `
  <path d="M60,120 h200 v150 h-200 z" fill="${C.glass}" stroke="${C.line}" stroke-width="3"/>
  <path d="M160,120 v150" stroke="${C.line}" stroke-width="2"/>
  <path d="M640,130 h200 v60 h-200 z" fill="${C.wood}" stroke="${C.line}" stroke-width="3"/>
  <path d="M660,150 h160" stroke="${C.ink}" stroke-width="3" opacity="0.5"/>
  ${round(200, 350, 78)}${chair(100, 430)}${chair(270, 430)}
  ${round(470, 330, 66)}${chair(390, 404)}${chair(530, 404)}
  ${person(760, 250, 1.5, C.cloth1, { arms: 'hold' })}
  <path d="M776,288 h44 v10 h-44 z" fill="${C.white}" stroke="${C.ink}" stroke-width="2"/>`,
  300,
);

const scenes: [string, string][] = [
  ['p1-01.svg', s1],
  ['p1-02.svg', s2],
  ['p1-03.svg', s3],
  ['p1-04.svg', s4],
  ['p1-05.svg', s5],
  ['p1-06.svg', s6],
];

mkdirSync('public/assets/toeic', { recursive: true });
for (const [name, svg] of scenes) {
  const body = svg.replace(/\n\s*/g, ' ').trim();
  writeFileSync(`public/assets/toeic/${name}`, body + '\n');
  console.log(`✓ public/assets/toeic/${name} — ${(body.length / 1024).toFixed(1)} Ko`);
}
