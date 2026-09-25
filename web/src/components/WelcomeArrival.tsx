import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Castle, X } from 'lucide-react';
import './WelcomeArrival.css';

export function WelcomeArrival({ replay }: { replay: number; userId?: string; authReady: boolean }) {
  const [closed, setClosed] = useState(false);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [gentle] = useState(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return true;
    try { return localStorage.getItem('eq_cinema_motion') === 'gentle'; } catch { return false; }
  });
  const dialog = useRef<HTMLDialogElement>(null);
  const duration = gentle ? 900 : 3400;
  const close = useCallback(() => setClosed(true), []);
  useEffect(() => { setClosed(false); }, [replay]);
  useLayoutEffect(() => {
    if (closed) return;
    const node = dialog.current;
    node?.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { node?.close(); document.body.style.overflow = overflow; };
  }, [closed]);
  useEffect(() => {
    if (closed) return;
    // A slow or missing image must never prevent access to the home page.
    const timer = window.setTimeout(ready ? close : () => setReady(true), ready ? duration : 1500);
    return () => window.clearTimeout(timer);
  }, [closed, ready, duration, close]);
  if (closed) return null;
  return <dialog ref={dialog} className="kingdom-cinema arrival-auto" data-stage={ready ? 'playing' : 'loading'} data-motion={gentle ? 'gentle' : 'full'} style={{ '--arrival-duration': `${duration}ms` } as CSSProperties} aria-label="Bienvenue à Scriptoria" onCancel={close}>
    <div className="cinema-landscape" aria-hidden="true">
      <img src={import.meta.env.BASE_URL + 'media/kingdom-gate.png'} alt="" onLoad={() => setReady(true)} onError={() => { setFailed(true); setReady(true); }} className={!failed ? 'is-ready' : ''}/>
      {failed && <Castle className="cinema-fallback" strokeWidth={.7}/>}
      <div className="cinema-shade"/>
    </div>
    <div className="cinema-gate-light" aria-hidden="true"/>
    <div className="cinema-fog cinema-fog-left" aria-hidden="true"/>
    <div className="cinema-fog cinema-fog-right" aria-hidden="true"/>
    <div className="arrival-heading"><p>LES PORTES DU ROYAUME S’OUVRENT</p><h1>Scriptoria</h1></div>
    <button className="cinema-skip" onClick={close} autoFocus><span>Passer l’introduction</span><X size={15}/></button>
  </dialog>;
}
