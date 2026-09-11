import type { Lesson, Level } from '../types';

export function LessonPage({ level, index, lesson, onBack, onStart }: { level: Level; index: number; lesson: Lesson; onBack: () => void; onStart: () => void }) {
  return <section className="lesson-sheet">
    <button className="btn btn-ghost" onClick={onBack}>← Parcours</button>
    <div className="teach-top lesson-top"><span className={`ku-badge ${lesson.t === 'V' ? 'ku-voc' : 'ku-gram'}`}>{lesson.t === 'V' ? 'Vocabulaire' : 'Grammaire'}</span><span className="teach-step">{level} · Leçon {index + 1}</span></div>
    <h2 className="title">{lesson.title}</h2>
    {lesson.intro && <p className="teach-intro">{lesson.intro}</p>}
    {lesson.forms && <div className="teach-card"><div className="teach-h">{lesson.formsTitle ?? 'Les formes'}</div><table className="forms-tbl"><tbody>{lesson.forms.map(([left, right]) => <tr key={`${left}-${right}`}><td>{left}</td><td>{right}</td></tr>)}</tbody></table></div>}
    {lesson.sections?.map(section => <div className="teach-card" key={section.h}><div className="teach-h">{section.h}</div><div className="teach-rule" dangerouslySetInnerHTML={{ __html: section.body }} /></div>)}
    {!!lesson.examples?.length && <><div className="teach-h">Exemples</div><div className="teach-exs">{lesson.examples.map(([en, fr]) => <div className="teach-ex" key={en}><div><div className="tex-en">{en}</div><div className="tex-fr">{fr}</div></div><button className="mini-audio" onClick={() => speak(en)}>♪</button></div>)}</div></>}
    {!!lesson.pitfalls?.length && <div className="teach-card warn"><div className="teach-h">À éviter</div>{lesson.pitfalls.map(item => <div className="teach-li" key={item} dangerouslySetInnerHTML={{ __html: item }} />)}</div>}
    {!!lesson.keypoints?.length && <div className="teach-card key"><div className="teach-h">À retenir</div>{lesson.keypoints.map(item => <div className="teach-li" key={item} dangerouslySetInnerHTML={{ __html: item }} />)}</div>}
    <button className="btn btn-primary full" onClick={onStart}>Commencer les exercices →</button>
  </section>;
}

export function speak(text: string) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = 'en-US';
  utterance.rate = 0.9;
  speechSynthesis.speak(utterance);
}
