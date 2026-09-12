// Synthèse vocale : choisit automatiquement la meilleure voix anglaise disponible.

let cachedVoices: SpeechSynthesisVoice[] = [];

function loadVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  cachedVoices = window.speechSynthesis.getVoices();
  return cachedVoices;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  // Les voix arrivent parfois de façon asynchrone
  window.speechSynthesis.onvoiceschanged = () => loadVoices();
}

// On privilégie les voix modernes/naturelles (Google, Microsoft Natural, etc.)
const PREFERRED = /google|natural|neural|aria|jenny|libby|guy|ryan|sonia|zira|david|samantha/i;

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const voices = cachedVoices.length ? cachedVoices : loadVoices();
  if (!voices.length) return null;
  const short = lang.slice(0, 2).toLowerCase();
  const sameLang = voices.filter((v) => v.lang && v.lang.toLowerCase().replace('_', '-').startsWith(short));
  const exact = sameLang.filter((v) => v.lang.toLowerCase().replace('_', '-') === lang.toLowerCase());
  return exact.find((v) => PREFERRED.test(v.name)) || exact[0] || sameLang.find((v) => PREFERRED.test(v.name)) || sameLang[0] || null;
}

export type SpeakOptions = { lang?: string; rate?: number; pitch?: number };

export function speak(text: string, opts: SpeakOptions = {}) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = opts.lang ?? 'en-US';
  utterance.rate = opts.rate ?? 0.95;
  utterance.pitch = opts.pitch ?? 1;
  const voice = pickVoice(utterance.lang);
  if (voice) utterance.voice = voice;
  synth.speak(utterance);
}
