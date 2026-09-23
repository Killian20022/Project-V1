import type { ReactNode } from 'react';

// Small engraved emblems share a single stroke, scale and heraldic frame.
const SYMBOLS: Record<string, ReactNode> = {
  tenses: <><path d="M19 12h26M19 52h26M23 13v6c0 7 6 8 9 13-3 5-9 6-9 13v6M41 13v6c0 7-6 8-9 13 3 5 9 6 9 13v6"/><path d="m25 21 7 7 7-7M25 46l7-9 7 9Z" fill="currentColor" fillOpacity=".18"/></>,
  modals: <><circle cx="25" cy="24" r="11"/><path d="m32 32 19 19m-9-9 5-5m0 10 5-5"/><path d="m25 19 5 5-5 5-5-5Z" fill="currentColor" fillOpacity=".2"/></>,
  conditionals: <><path d="M32 53V35c0-9-15-10-15-20m15 20c0-9 15-10 15-20M12 20l5-6 6 5M41 19l6-5 5 6"/><path d="m27 44 5-5 5 5-5 5Z" fill="currentColor" fillOpacity=".2"/></>,
  nouns: <><path d="M19 13h29v31H19a6 6 0 0 0 0 12h29M19 13a6 6 0 0 0-6 6v30M19 50h29M25 21h15M25 27h10"/><circle cx="36" cy="38" r="7" fill="currentColor" fillOpacity=".13"/><path d="m32 44-2 8 6-3 6 3-2-8"/></>,
  adjectives: <><path d="M32 14v36M22 52h20M14 23l18-5 18 5M18 23l-8 17h16Zm28 0-8 17h16Z"/><path d="M10 40c1 8 15 8 16 0m12 0c1 8 15 8 16 0" fill="currentColor" fillOpacity=".16"/><circle cx="32" cy="13" r="3"/></>,
  prepositions: <><circle cx="32" cy="33" r="20"/><path d="M32 9v6m0 36v6M8 33h6m36 0h6m-9-17L27 28l-9 22 19-13Z"/><path d="m41 17-9 16-5-5Z" fill="currentColor" fillOpacity=".3"/><circle cx="32" cy="33" r="2"/></>,
  structure: <><path d="M12 53V24h4v-7h6v7h5v-7h10v7h5v-7h6v7h4v29ZM12 34h40M20 34v7m24-7v7M27 53V42a5 5 0 0 1 10 0v11"/><path d="M32 17V8m0 0h12l-3 4 3 4H32" fill="currentColor" fillOpacity=".15"/></>,
  style: <><path d="M18 47 45 14M24 41c-4-16 5-26 27-30 0 22-10 32-27 30ZM35 27l10 1M29 34l11 1M18 47l-2 6"/><path d="M13 55h38M38 44h9l4 11H34Z" fill="currentColor" fillOpacity=".15"/></>,
  book: <><path d="M32 20c-6-6-14-7-23-5v33c9-2 17-1 23 5 6-6 14-7 23-5V15c-9-2-17-1-23 5Zm0 0v33M16 24c4-1 7 0 10 2m-10 5c4-1 7 0 10 2m12-7c3-2 6-3 10-2m-10 9c3-2 6-3 10-2"/><path d="m32 6 3 4-3 4-3-4Z" fill="currentColor"/></>,
};

export function GrammarEmblem({ category = 'book', className = '' }: { category?: string; className?: string }) {
  return <span className={`grammar-emblem ${className}`} aria-hidden="true">
    <svg viewBox="0 0 80 88" className="grammar-emblem-frame" fill="none"><path d="M8 7h64v48c0 13-14 21-32 28C22 76 8 68 8 55Z"/><path d="M13 12h54v43c0 10-12 17-27 23-15-6-27-13-27-23Z"/><path d="M4 24h8m56 0h8M4 48h8m56 0h8"/></svg>
    <svg viewBox="0 0 64 64" className="grammar-emblem-symbol" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{SYMBOLS[category] ?? SYMBOLS.book}</svg>
  </span>;
}
