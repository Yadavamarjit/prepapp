import { Link } from 'react-router-dom';
import { useSyllabus } from '../context/SyllabusContext';
import { PAPER_2_SUBJECT } from '../data/syllabusCatalog';
import type { ChapterProgress } from '../types';

export function SyllabusStatus() {
  const { status, reload } = useSyllabus();
  if (status === 'ready') return null;
  if (status === 'loading') return <p role="status" className="text-sm">Loading CAPF syllabus…</p>;
  return <p role="alert" className="text-sm">The CAPF syllabus could not be loaded. <button type="button" className="underline" onClick={reload}>Retry</button></p>;
}

export function SyllabusOutline({ search = '', subjectId = '', paper, progressMap }: {
  search?: string;
  subjectId?: string;
  paper?: 'paper1' | 'paper2';
  progressMap?: Record<string, ChapterProgress>;
}) {
  const { status, subjects } = useSyllabus();
  if (status !== 'ready') return <SyllabusStatus />;
  const query = search.trim().toLowerCase();
  const visible = subjects.filter(subject => (!subjectId || subject.id === subjectId) &&
    (!paper || (subject.id === PAPER_2_SUBJECT) === (paper === 'paper2')))
    .map(subject => ({
      ...subject,
      groups: subject.subSubjects.map(group => ({
        ...group,
        chapters: group.chapters.filter(chapter =>
          [subject.name, group.name, chapter.title, ...chapter.topics].join(' ').toLowerCase().includes(query)),
      })).filter(group => group.chapters.length),
    })).filter(subject => subject.groups.length);
  if (!visible.length) return <p className="text-sm">No syllabus chapters match your search.</p>;
  return <div className="space-y-3">{visible.map(subject => {
    const chapters = subject.groups.flatMap(group => group.chapters);
    const completed = chapters.filter(chapter => progressMap?.[`capf:${chapter.id}`]?.isCompleted).length;
    return <details key={subject.id} open={query || subjectId ? true : undefined} className="study-panel">
      <summary className="cursor-pointer p-4 text-sm font-semibold">{subject.name} <span className="ml-2 text-xs font-normal opacity-75">{progressMap ? `${completed} / ` : ''}{chapters.length} chapters{progressMap ? ' completed' : ''}</span></summary>
      <div className="space-y-4 border-t border-current/15 p-4">
        <p className="text-sm opacity-75">{subject.officialScope}</p>
        {subject.groups.map(group => <section key={group.id}>
          <h3 className="text-sm font-semibold">{group.name} <span className="ml-2 text-xs font-normal opacity-75">{group.priority}</span></h3>
          <ul className="mt-2 space-y-1">{group.chapters.map(chapter => <li key={chapter.id}>
            <Link className="quiet-link py-1" to={`/learning/capf-${chapter.id}`}>{chapter.title}{progressMap?.[`capf:${chapter.id}`]?.isCompleted && ' ✓'}</Link>
          </li>)}</ul>
        </section>)}
      </div>
    </details>;
  })}</div>;
}
