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
