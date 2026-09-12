import { useEffect, useState } from 'react';
import { Volume2, Search, Bookmark, Trash2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { loadSavedWords, saveWords } from '@/lib/state';
import { speak } from '@/lib/speak';
import type { SavedWord } from '../types';

export function DictionaryPage() {
  const [query, setQuery] = useState('');
  const [definitions, setDefinitions] = useState<string[]>([]);
  const [searched, setSearched] = useState('');
  const [words, setWords] = useState<SavedWord[]>(loadSavedWords);
  const [status, setStatus] = useState('');

  useEffect(() => saveWords(words), [words]);

  async function search(event: React.FormEvent) {
    event.preventDefault();
    const word = query.trim().toLowerCase();
    if (!word) return;
    setStatus('Recherche…');
    setDefinitions([]);
    setSearched(word);
    try {
      const response = await fetch(`https://api.datamuse.com/words?sp=${encodeURIComponent(word)}&md=d&max=1`);
      const data = (await response.json()) as Array<{ defs?: string[] }>;
      const defs = (data[0]?.defs ?? []).map((definition) => definition.replace(/^\w+\t/, ''));
      setDefinitions(defs);
      setStatus(defs.length ? '' : 'Aucune définition trouvée pour ce mot.');
    } catch {
      setStatus('Le dictionnaire est temporairement indisponible.');
    }
  }

  const saved = words.some((item) => item.word === searched);

  function addWord() {
    if (saved || !searched || !definitions[0]) return;
    setWords((items) => [...items, { word: searched, definition: definitions[0] }]);
  }

  function removeWord(target: SavedWord) {
    setWords((current) => current.filter((word) => word.word !== target.word));
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Dictionnaire</h1>
        <p className="text-muted-foreground">Cherche un mot anglais, écoute-le et crée ta collection perso.</p>
      </div>

      <form onSubmit={search} className="flex gap-2">
        <input
          className="w-full rounded-lg border border-input bg-background px-4 py-3 outline-none focus:border-primary"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Ex : achieve, thrive, eloquent…"
        />
        <Button type="submit">
          <Search /> Chercher
        </Button>
      </form>

      {status && <p className="text-sm text-muted-foreground">{status}</p>}

      {!!definitions.length && (
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-xl font-bold capitalize">{searched}</h3>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" onClick={() => speak(searched)} aria-label="Écouter">
                  <Volume2 />
                </Button>
                <Button size="sm" disabled={saved} onClick={addWord}>
                  {saved ? <Check /> : <Bookmark />} {saved ? 'Sauvegardé' : 'Sauvegarder'}
                </Button>
              </div>
            </div>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {definitions.slice(0, 5).map((definition) => (
                <li key={definition}>• {definition}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="mb-3 text-lg font-semibold">Mes mots ({words.length})</h2>
        {words.length === 0 ? (
          <p className="text-sm text-muted-foreground">Tes mots sauvegardés apparaîtront ici.</p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {words.map((item) => (
              <Card key={item.word}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <b className="capitalize">{item.word}</b>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" onClick={() => speak(item.word)} aria-label="Écouter">
                        <Volume2 />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => removeWord(item)} aria-label="Supprimer">
                        <Trash2 />
                      </Button>
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">{item.definition}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
