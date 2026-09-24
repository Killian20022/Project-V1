import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, Castle, Swords, Volume2, VolumeX, X } from 'lucide-react';
import { playRoyalFanfare } from '@/lib/royalFanfare';

const DURATION = 3900;
type Stage = 'ready' | 'playing' | 'closed';
function savedMotion(): boolean {
  try {
    const saved = localStorage.getItem('eq_cinema_motion');
    if (saved) return saved === 'gentle';
  } catch { /* Fall back to the device preference. */ }
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function WelcomeArrival({ replay, userId, authReady }: { replay: number; userId?: string; authReady: boolean }) {
  const [stage, setStage] = useState<Stage>('ready');
  const [sound, setSound] = useState(true);
  const [gentle, setGentle] = useState(savedMotion);
  const [imageReady, setImageReady] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const previousUser = useRef<string | null | undefined>(undefined);
  const finishTimer = useRef<number>();
  const stopAudio = useRef<(() => void) | null>(null);
  const playing = useRef(false);
  const visible = stage !== 'closed';

  const close = useCallback(() => {
    window.clearTimeout(finishTimer.current);
    stopAudio.current?.();
    stopAudio.current = null;
    playing.current = false;
    setStage('closed');
  }, []);

  useEffect(() => { if (replay > 0) setStage('ready'); }, [replay]);
  useEffect(() => {
    if (!authReady) return;
    if (previousUser.current === null && userId && !playing.current) setStage('ready');
    previousUser.current = userId ?? null;
  }, [userId, authReady]);

  useLayoutEffect(() => {
    if (!visible) return;
    const node = dialog.current;
    node?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { node?.close(); document.body.style.overflow = overflow; };
  }, [visible]);

  useEffect(() => () => {
    window.clearTimeout(finishTimer.current);
    stopAudio.current?.();
  }, []);

  useEffect(() => {
    const onVisibility = () => { if (document.hidden && playing.current) close(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [close]);

  function enter() {
    if (playing.current) return;
    playing.current = true;
    // AudioContext is created directly inside the click handler for autoplay compatibility.
    if (sound) { try { stopAudio.current = playRoyalFanfare(); } catch { /* Continue the visual entrance. */ } }
    setStage('playing');
    finishTimer.current = window.setTimeout(close, DURATION);
  }

  if (!visible) return null;
  return <dialog ref={dialog} className="kingdom-cinema" data-stage={stage} data-motion={gentle ? 'gentle' : 'full'} aria-labelledby="kingdom-title" aria-describedby="kingdom-description" onCancel={close}>
    <div className="cinema-landscape" aria-hidden="true">
      <img src={import.meta.env.BASE_URL + 'media/kingdom-gate.png'} alt="" onLoad={() => setImageReady(true)} onError={() => { setImageReady(true); setImageFailed(true); }} className={imageReady && !imageFailed ? 'is-ready' : ''}/>
      {imageFailed && <Castle className="cinema-fallback" strokeWidth={.7}/>}
      <div className="cinema-shade"/>
    </div>
    <div className="cinema-fog cinema-fog-back" aria-hidden="true"/>
    <div className="cinema-fog cinema-fog-left" aria-hidden="true"/>
    <div className="cinema-fog cinema-fog-right" aria-hidden="true"/>
    <div className="cinema-frame" aria-hidden="true"><span/><Swords size={21} strokeWidth={1.2}/><span/></div>
    <div className="cinema-copy">
      <p className="cinema-eyebrow">LES PORTES DU ROYAUME S’OUVRENT</p>
      <h1 id="kingdom-title"><em>Scriptoria</em></h1>
      <p id="kingdom-description">Votre aventure commence de l’autre côté de la brume.</p>
      <div className="cinema-controls" hidden={stage === 'playing'}>
        <button className="cinema-enter" onClick={enter} autoFocus><Swords size={18} strokeWidth={1.4}/>Entrer dans le royaume<ArrowRight size={17}/></button>
        <div className="cinema-options">
          <button className="cinema-audio" onClick={() => setSound(value => !value)} aria-pressed={sound} aria-label={sound ? 'Couper la fanfare' : 'Activer la fanfare'}>{sound ? <Volume2 size={15}/> : <VolumeX size={15}/>} {sound ? 'Fanfare activée' : 'Sans le son'}</button>
          <label><input type="checkbox" checked={gentle} onChange={e => {
            setGentle(e.target.checked);
            try { localStorage.setItem('eq_cinema_motion', e.target.checked ? 'gentle' : 'full'); } catch { /* The choice remains active for this visit. */ }
          }}/>Version douce</label>
        </div>
      </div>
    </div>
    <p className="cinema-welcome" aria-live="polite">{stage === 'playing' ? 'Bienvenue dans votre royaume.' : ''}</p>
    <button className="cinema-skip" onClick={close}><span>{stage === 'playing' ? 'Passer l’introduction' : 'Accéder directement au site'}</span><X size={15}/></button>
    <div className="cinema-footer" aria-hidden="true"><span>APPRENDRE</span><i>✦</i><span>EXPLORER</span><i>✦</i><span>CONQUÉRIR</span></div>
  </dialog>;
}
