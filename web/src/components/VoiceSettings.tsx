import { useEffect, useState } from 'react';
import { Volume2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getVoicePref, setVoicePref, listEnglishVoices, speak, type VoicePref } from '@/lib/speak';

const ACCENTS: { code: string; label: string; flag: string }[] = [
  { code: 'en-US', label: 'Américain', flag: '🇺🇸' },
  { code: 'en-GB', label: 'Britannique', flag: '🇬🇧' },
  { code: 'en-AU', label: 'Australien', flag: '🇦🇺' },
];

export function VoiceSettings({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [pref, setPref] = useState<VoicePref>(getVoicePref);

  useEffect(() => {
    if (!open) return;
    const refresh = () => setVoices(listEnglishVoices());
    refresh();
    if ('speechSynthesis' in window) window.speechSynthesis.onvoiceschanged = refresh;
  }, [open]);

  if (!open) return null;

  function update(next: Partial<VoicePref>) {
    const merged = { ...pref, ...next };
    setPref(merged);
    setVoicePref(merged);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-2xl border border-sky-400/20 bg-card p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">Réglages de la voix</h2>
          <Button variant="ghost" size="icon" onClick={onClose} aria-label="Fermer">
            <X />
          </Button>
        </div>

        <div className="space-y-5">
          <div>
            <div className="mb-2 text-sm font-semibold text-muted-foreground">Accent</div>
            <div className="flex flex-wrap gap-2">
              {ACCENTS.map((a) => (
                <Button
                  key={a.code}
                  variant={pref.lang === a.code ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => update({ lang: a.code, voiceURI: null })}
                >
                  {a.flag} {a.label}
                </Button>
              ))}
            </div>
          </div>

          <div>
            <div className="mb-2 text-sm font-semibold text-muted-foreground">Voix</div>
            <select
              className="w-full rounded-lg border border-input bg-background px-3 py-2 outline-none focus:border-primary"
              value={pref.voiceURI ?? ''}
              onChange={(e) => update({ voiceURI: e.target.value || null })}
            >
              <option value="">Automatique (meilleure dispo)</option>
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
            {voices.length === 0 && (
              <p className="mt-1 text-xs text-muted-foreground">
                Aucune voix détectée pour l'instant — clique « Tester », elles se chargent parfois au 1er essai.
              </p>
            )}
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between text-sm font-semibold text-muted-foreground">
              <span>Vitesse</span>
              <span>{pref.rate.toFixed(2)}×</span>
            </div>
            <input
              type="range"
              min={0.6}
              max={1.2}
              step={0.05}
              value={pref.rate}
              onChange={(e) => update({ rate: Number(e.target.value) })}
              className="w-full accent-sky-400"
            />
          </div>

          <Button className="w-full" onClick={() => speak('Hello! This is how your English voice sounds.')}>
            <Volume2 /> Tester la voix
          </Button>

          <p className="text-center text-xs text-muted-foreground">
            La qualité dépend des voix installées sur ton appareil. Chrome et Edge proposent souvent des voix
            « Natural » très agréables.
          </p>
        </div>
      </div>
    </div>
  );
}
