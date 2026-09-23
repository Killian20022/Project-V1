import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ArrowRight, Swords } from 'lucide-react';

export function WelcomeArrival({ replay, userId, authReady }: { replay: number; userId?: string; authReady: boolean }) {
  // Every new document starts at the castle, including returning visitors.
  // Reduced motion changes the presentation in CSS, never whether it is shown.
  const [visible, setVisible] = useState(true);
  const dialog = useRef<HTMLDialogElement>(null);
  const previousUser = useRef<string | null | undefined>(undefined);
  const close = useCallback(() => setVisible(false), []);

  useEffect(() => { if (replay > 0) setVisible(true); }, [replay]);

  // A real sign-in also gets a welcome; initial authentication hydration does not replay it.
  useEffect(() => {
    if (!authReady) return;
    if (previousUser.current === null && userId) {
      setVisible(true);
    }
    previousUser.current = userId ?? null;
  }, [userId, authReady]);

  useLayoutEffect(() => {
    if (!visible) return;
    const node = dialog.current;
    node?.showModal();
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const timer = window.setTimeout(close, 3400);
    return () => {
      window.clearTimeout(timer);
      node?.close();
      document.body.style.overflow = previousOverflow;
    };
  }, [visible, close]);

  if (!visible) return null;
  return <dialog ref={dialog} className="castle-arrival" aria-labelledby="castle-welcome-title" aria-describedby="castle-welcome-description" onCancel={close}>
    <div className="castle-arrival-scene" aria-hidden="true">
      <div className="arrival-halo" />
      <svg viewBox="0 0 440 260" className="arrival-castle" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round">
        <path className="castle-outline" d="M42 246V91h15V67h22v24h17V67h22v24h15v155M307 246V91h15V67h22v24h17V67h22v24h15v155M133 126h22v-19h21v19h22v-19h44v19h22v-19h21v19h22M133 159h174M176 246v-60a44 44 0 0 1 88 0v60M220 107V25m0 0h66l-16 15 16 15h-66" />
        <path d="M70 124v18h18v-18a9 9 0 0 0-18 0Zm282 0v18h18v-18a9 9 0 0 0-18 0ZM70 178v18h18v-18a9 9 0 0 0-18 0Zm282 0v18h18v-18a9 9 0 0 0-18 0ZM22 246h396" opacity=".5" />
        <path className="arrival-door arrival-door-left" d="M178 246v-60a42 42 0 0 1 42-42v102ZM190 183v63m15-92v92" />
        <path className="arrival-door arrival-door-right" d="M262 246v-60a42 42 0 0 0-42-42v102ZM250 183v63m-15-92v92" />
        <path className="arrival-light" d="m219 158-49 88h100Z" stroke="none" fill="currentColor" />
      </svg>
      <span className="arrival-crest"><Swords size={28} strokeWidth={1.2}/></span>
      <span className="arrival-spark spark-one">✦</span><span className="arrival-spark spark-two">✧</span><span className="arrival-spark spark-three">✦</span>
    </div>
    <div className="arrival-copy"><p className="arrival-kicker">ENGLISH SWORD</p><h2 id="castle-welcome-title">Le royaume vous attend.</h2><p id="castle-welcome-description">Une nouvelle aventure commence.</p></div>
    <button className="arrival-skip" onClick={close} autoFocus>Entrer dans le royaume <ArrowRight size={15}/></button>
    <div className="arrival-timeline" aria-hidden="true"><span/></div>
  </dialog>;
}
