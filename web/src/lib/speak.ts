// Synthèse vocale : voix anglaise, réglable et mémorisée (accent, voix, vitesse).

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  cachedVoices = window.speechSynthesis.getVoices();
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = () => loadVoices();
}

// Voix modernes / naturelles privilégiées
const PREFERRED = /google|natural|neural|enhanced|premium|aria|jenny|libby|guy|ryan|sonia|zira|david|samantha|siri/i;

export type VoicePref = { voiceURI: string | null; lang: string; rate: number };

const DEFAULT_PREF: VoicePref = { voiceURI: null, lang: 'en-US', rate: 0.95 };

export function getVoicePref(): VoicePref {
  try {
    const raw = localStorage.getItem('eq_voice');
    if (!raw) return { ...DEFAULT_PREF };
    return { ...DEFAULT_PREF, ...(JSON.parse(raw) as Partial<VoicePref>) };
  } catch {
    return { ...DEFAULT_PREF };
  }
}

export function setVoicePref(pref: VoicePref) {
  try {
    localStorage.setItem('eq_voice', JSON.stringify(pref));
  } catch {
    /* ignore */
  }
}

/** Liste des voix anglaises disponibles, les plus naturelles en premier. */
export function listEnglishVoices(): SpeechSynthesisVoice[] {
  const voices = cachedVoices.length ? cachedVoices : loadVoices();
  const en = voices.filter((v) => v.lang && v.lang.toLowerCase().startsWith('en'));
  return en.sort((a, b) => Number(PREFERRED.test(b.name)) - Number(PREFERRED.test(a.name)));
}

function resolveVoice(pref: VoicePref): SpeechSynthesisVoice | null {
  const voices = cachedVoices.length ? cachedVoices : loadVoices();
  if (!voices.length) return null;
  if (pref.voiceURI) {
    const chosen = voices.find((v) => v.voiceURI === pref.voiceURI);
    if (chosen) return chosen;
  }
  const short = pref.lang.slice(0, 2).toLowerCase();
  const sameLang = voices.filter((v) => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(short));
  const exact = sameLang.filter((v) => v.lang.toLowerCase().replace('_', '-') === pref.lang.toLowerCase());
  return (
    exact.find((v) => PREFERRED.test(v.name)) ||
    exact[0] ||
    sameLang.find((v) => PREFERRED.test(v.name)) ||
    sameLang[0] ||
    null
  );
}

/**
 * Trois timbres anglais DISTINCTS, pour que « l'homme » et « la femme » d'une conversation ne
 * soient pas la même voix. On ne peut rien promettre : la liste dépend du système du joueur, et
 * certains navigateurs n'exposent qu'une seule voix anglaise. Dans ce cas on renvoie la même voix
 * plusieurs fois — le dialogue reste intelligible grâce aux pauses et au nom du locuteur affiché
 * à la correction, et c'est préférable à un silence.
 */
export function pickVoices(n: number): (SpeechSynthesisVoice | null)[] {
  const en = listEnglishVoices();
  if (!en.length) return Array.from({ length: n }, () => null);
  // On alterne volontairement en partant des deux bouts de la liste : les voix voisines dans
  // l'énumération du système sont souvent deux variantes du même timbre.
  const spread = [en[0], en[en.length - 1], en[Math.floor(en.length / 2)], ...en];
  const out: SpeechSynthesisVoice[] = [];
  for (const v of spread) {
    if (out.length >= n) break;
    if (!out.some((p) => p.voiceURI === v.voiceURI)) out.push(v);
  }
  while (out.length < n) out.push(out[out.length % Math.max(1, out.length)] ?? en[0]);
  return out.slice(0, n);
}

export interface SpokenTurn {
  text: string;
  voice?: 'A' | 'B' | 'C';
}

/**
 * Lit une suite de répliques d'affilée, chaque voix tenant son rôle. Rend une fonction d'arrêt.
 *
 * `speak()` ne peut PAS servir à ça : il appelle `synth.cancel()` à chaque fois, donc deux appels
 * de suite se coupent l'un l'autre. Ici on annule UNE fois, puis on empile — la file d'attente de
 * `speechSynthesis` enchaîne les énoncés toute seule.
 */
export function speakScript(turns: readonly SpokenTurn[], onDone?: () => void): () => void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window) || !turns.length) {
    onDone?.();
    return () => {};
  }
  const pref = getVoicePref();
  const synth = window.speechSynthesis;
  synth.cancel();

  const [vA, vB, vC] = pickVoices(3);
  const byRole = { A: vA, B: vB, C: vC };
  let cancelled = false;

  turns.forEach((turn, i) => {
    const utterance = new SpeechSynthesisUtterance(turn.text);
    const voice = byRole[turn.voice ?? 'A'] ?? null;
    // Un peu plus lent que l'entraînement : au vrai examen le débit est naturel, et une voix de
    // synthèse trop rapide devient inintelligible bien avant une voix humaine.
    utterance.rate = Math.min(1, pref.rate);
    utterance.pitch = 1;
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = pref.lang;
    }
    if (i === turns.length - 1) {
      utterance.onend = () => {
        if (!cancelled) onDone?.();
      };
      // `onerror` compte aussi : sans ça, une voix indisponible laisserait l'épreuve bloquée sur
      // « lecture en cours » et le joueur ne pourrait plus répondre.
      utterance.onerror = () => {
        if (!cancelled) onDone?.();
      };
    }
    synth.speak(utterance);
  });

  return () => {
    cancelled = true;
    synth.cancel();
  };
}

export function speak(text: string, override?: Partial<VoicePref>) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const pref = { ...getVoicePref(), ...override };
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = pref.lang;
  utterance.rate = pref.rate;
  utterance.pitch = 1;
  const voice = resolveVoice(pref);
  if (voice) {
    utterance.voice = voice;
    utterance.lang = voice.lang;
  }
  synth.speak(utterance);
}
