import { LEVEL_INFO, LEVELS, lessonsFor } from '../lib/content';
import type { GameState, Lesson, Level } from '../types';

export function LearnPage({ state, selectedLevel, onSelectLevel, onOpenLesson }: { state: GameState; selectedLevel: Level | null; onSelectLevel: (level: Level | null) => void; onOpenLesson: (level: Level, index: number, lesson: Lesson) => void }) {
  if (!selectedLevel) return <section><h2 className="title">Choisis ton niveau</h2><p className="sub">Chaque niveau contient dix cours progressifs.</p><div className="grid cols">{LEVELS.map(level => {
    const info = LEVEL_INFO[level];
    return <button className="card level-card reset-button" key={level} onClick={() => onSelectLevel(level)}><div className={`level-badge ${info.color}`}>{level}</div><div className="level-name">{info.name}</div><div className="level-desc">{state.lessons[level] ?? 0}/10 leçons</div></button>;
  })}</div></section>;

  const done = state.lessons[selectedLevel] ?? 0;
  return <section>
    <button className="btn btn-ghost" onClick={() => onSelectLevel(null)}>← Tous les niveaux</button>
    <h2 className="title path-title">{selectedLevel} — {LEVEL_INFO[selectedLevel].name}</h2>
    <p className="sub">Lis la fiche, puis termine les exercices pour débloquer la suite.</p>
    <div id="lessonPath">{lessonsFor(selectedLevel).map((lesson, index) => {
      const status = index < done ? 'done' : index === done ? 'current' : 'locked';
      return <button key={`${selectedLevel}-${index}`} disabled={status === 'locked'} className={`lesson-node reset-button ${status} ${index % 2 ? 'right' : 'left'}`} onClick={() => onOpenLesson(selectedLevel, index, lesson)}>
        <span className="lesson-bubble">{status === 'done' ? '✓' : status === 'locked' ? '×' : lesson.t === 'V' ? 'A' : '§'}</span>
        <span className="lesson-label">Leçon {index + 1} · {lesson.title}</span>
      </button>;
    })}</div>
  </section>;
}
