import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { indexSyllabus, type SyllabusSubject } from '../data/syllabusCatalog';

const empty: SyllabusSubject[] = [];
const SyllabusContext = createContext({
  subjects: empty,
  chapters: indexSyllabus(empty),
  status: 'loading' as 'loading' | 'ready' | 'error',
  reload: () => {},
});

export function SyllabusProvider({ children }: { children: ReactNode }) {
  const [subjects, setSubjects] = useState(empty);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    setStatus('loading');
    fetch(`${import.meta.env.BASE_URL}upsc_capf_complete_syllabus.json`, { cache: 'no-cache', signal: controller.signal })
      .then(async response => {
        if (!response.ok) throw new Error('Unable to load the CAPF syllabus');
        const data = await response.json();
        if (!Array.isArray(data.subjects) || !data.subjects.length || !indexSyllabus(data.subjects).length) {
          throw new Error('The CAPF syllabus has no chapters');
        }
        if (!controller.signal.aborted) {
          setSubjects(data.subjects);
          setStatus('ready');
        }
      })
      .catch(() => { if (!controller.signal.aborted) setStatus('error'); });
    return () => controller.abort();
  }, [attempt]);
  const chapters = useMemo(() => indexSyllabus(subjects), [subjects]);
  return <SyllabusContext.Provider value={{ subjects, chapters, status, reload: () => setAttempt(value => value + 1) }}>{children}</SyllabusContext.Provider>;
}

export const useSyllabus = () => useContext(SyllabusContext);
