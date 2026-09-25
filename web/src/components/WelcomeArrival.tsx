import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Castle, X } from 'lucide-react';
import './WelcomeArrival.css';

function Guard({ side }: { side: 'left' | 'right' }) {
  return <div className={`arrival-guard arrival-guard-${side}`} aria-hidden="true"><svg viewBox="0 0 260 600" fill="none">
    <defs>
      <linearGradient id={`steel-${side}`}><stop stopColor="#283c3b"/><stop offset=".4" stopColor="#9da99d"/><stop offset=".55" stopColor="#63736b"/><stop offset="1" stopColor="#1b2c2a"/></linearGradient>
      <linearGradient id={`cloak-${side}`}><stop stopColor="#071d18"/><stop offset=".5" stopColor="#244b38"/><stop offset="1" stopColor="#0b241e"/></linearGradient>
    </defs>
    <ellipse cx="122" cy="567" rx="90" ry="13" fill="#03110e" opacity=".55"/>
    <path d="M76 210 Q45 275 40 523 Q119 551 196 516 L166 210Z" fill={`url(#cloak-${side})`} stroke="#7c7951" strokeWidth="2"/>
    <path d="M81 391 L76 536 L62 558 L106 558 L119 406 M128 404 L139 555 L181 555 L164 531 L159 391" fill={`url(#steel-${side})`} stroke="#142922" strokeWidth="5"/>
    <path d="M76 210 Q122 191 167 214 L158 372 L79 372Z" fill={`url(#steel-${side})`} stroke="#c1b889" strokeWidth="2"/>
    <path d="M92 219 L149 219 L153 395 L121 420 L87 394Z" fill={`url(#cloak-${side})`} stroke="#a18a54" strokeWidth="2"/>
    <path d="M121 257 L121 318 M109 273 L133 273" stroke="#c5aa6d" strokeWidth="5"/>
    <path d="M88 198 L85 150 Q88 110 120 108 Q156 110 161 151 L155 198 L122 217Z" fill={`url(#steel-${side})`} stroke="#283c32" strokeWidth="3"/>
    <path d="M89 158 L155 158 L153 169 L91 169Z" fill="#061813"/>
    <path d="M121 119 L121 199 M92 181 L108 185 M134 185 L151 181" stroke="#c1baa0" strokeWidth="3"/>
    <path d="M122 111 Q103 79 128 61 Q149 81 137 115" fill="#9d8855"/>
    <path d="M71 216 Q46 221 48 252 L65 306 L86 295 L78 250 M167 218 Q185 219 185 247 L173 289 L151 278" fill={`url(#steel-${side})`} stroke="#243c31" strokeWidth="5"/>
    <path d="M49 286 L93 277 L106 352 Q91 396 75 406 Q44 375 40 335Z" fill="#153a2b" stroke="#b19b64" strokeWidth="4"/>
    <path d="M72 300 L78 378 M54 324 L92 320" stroke="#b19b64" strokeWidth="4"/>
    <g className="arrival-lance">
      <path d="M180 548 L180 50" stroke="#141f18" strokeWidth="10"/>
      <path d="M179 548 L179 50" stroke="#a08451" strokeWidth="5"/>
      <path d="M179 9 L166 49 L179 67 L192 49Z" fill={`url(#steel-${side})`} stroke="#c3c6b1" strokeWidth="2"/>
      <path d="M179 61 L199 70 L179 78" fill="#d3b478"/>
      <path d="M164 289 Q181 280 190 292 L190 307 L168 310Z" fill={`url(#steel-${side})`} stroke="#263c31" strokeWidth="3"/>
    </g>
  </svg></div>;
}

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
    <div className="arrival-sentries"><Guard side="left"/><Guard side="right"/></div>
    <div className="cinema-fog cinema-fog-left" aria-hidden="true"/>
    <div className="cinema-fog cinema-fog-right" aria-hidden="true"/>
    <div className="arrival-heading"><p>LES GARDIENS VOUS OUVRENT LA VOIE</p><h1>Scriptoria</h1></div>
    <button className="cinema-skip" onClick={close} autoFocus><span>Passer l’introduction</span><X size={15}/></button>
  </dialog>;
}
