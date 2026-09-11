import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { loadSavedWords, saveWords } from '../lib/state';
import type { SavedWord } from '../types';
import { speak } from './LessonPage';

export function DictionaryPage({ token }: { token: string | null }) {
  const [query, setQuery] = useState('');
  const [definitions, setDefinitions] = useState<string[]>([]);
  const [words, setWords] = useState<SavedWord[]>(loadSavedWords);
  const [status, setStatus] = useState('');
  useEffect(() => saveWords(words), [words]);
  useEffect(() => {
    if (!token) return;
    api.words(token).then(remote => {
      setWords(local => {
        const merged = new Map([...remote, ...local].map(word => [word.word, word]));
        return [...merged.values()];
      });
    }).catch(() => undefined);
  }, [token]);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    const word = query.trim().toLowerCase();
    if (!word) return;
    setStatus('Recherche…'); setDefinitions([]);
    try {
      const response = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=d&max=1`);
      const data = await response.json() as Array<{ defs?: string[] }>;
      const defs = (data[0]?.defs ?? []).map(definition => definition.replace(/^\w+\t/, ''));
      setDefinitions(defs); setStatus(defs.length ? '' : 'Aucune définition trouvée.');
    } catch { setStatus('Le dictionnaire est temporairement indisponible.'); }
  }

  const currentWord = query.trim().toLowerCase();
  const saved = words.some(item => item.word === currentWord);
  async function addWord() {
    const newWord = { word: currentWord, definition: definitions[0] };
    if (saved || !newWord.word || !newWord.definition) return;
    if (token) {
      try { const remote = await api.saveWord(token, newWord); setWords(items => [...items, remote]); return; }
      catch { setStatus('Le mot est sauvegardé sur cet appareil, mais la synchronisation a échoué.'); }
    }
    setWords(items => [...items, newWord]);
  }

  async function removeWord(item: SavedWord) {
    if (token && item.id) await api.deleteWord(token, item.id).catch(() => undefined);
    setWords(current => current.filter(word => word.word !== item.word));
  }
  return <section><h2 className="title">Dictionnaire</h2><p className="sub">Recherche un mot anglais et crée ta collection personnelle.</p>
    <form className="card dictionary-search" onSubmit={search}><input className="text-input" value={query} onChange={event => setQuery(event.target.value)} placeholder="Ex : achieve, thrive, eloquent…" /><button className="btn btn-primary">Rechercher</button></form>
    {status && <div className="card result-card">{status}</div>}
    {!!definitions.length && <div className="card dictionary-result"><div className="dictionary-head"><h3>{currentWord}</h3><div><button className="audio-btn inline" onClick={() => speak(currentWord)}>♪ Écouter</button><button className="btn btn-primary" disabled={saved} onClick={addWord}>{saved ? 'Sauvegardé' : 'Sauvegarder'}</button></div></div>{definitions.slice(0, 5).map(definition => <p className="definition" key={definition}>{definition}</p>)}</div>}
    <h2 className="title section-title">Mes mots</h2><div className="grid cols">{words.map(item => <div className="card" key={item.word}><div className="saved-word-head"><b>{item.word}</b><button className="quiet-button danger" onClick={() => void removeWord(item)}>Supprimer</button></div><p className="definition">{item.definition}</p></div>)}</div>
  </section>;
}
