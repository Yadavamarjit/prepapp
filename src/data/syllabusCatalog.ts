export interface SyllabusChapter {
  id: string;
  order: number;
  title: string;
  priority: string;
  topics: string[];
  bookReferences?: { book: string; chapter: string; sourceUrl: string }[];
}
export interface SyllabusGroup {
  id: string;
  name: string;
  priority: string;
  primaryBooks: string[];
  chapters: SyllabusChapter[];
}
export interface SyllabusSubject {
  id: string;
  name: string;
  officialScope: string;
  subSubjects: SyllabusGroup[];
}

export const PAPER_2_SUBJECT = 'paper-2-general-studies-essay-comprehension';

export function indexSyllabus(subjects: SyllabusSubject[]) {
  return subjects.flatMap(subject => subject.subSubjects.flatMap(group =>
    [...group.chapters].sort((a, b) => a.order - b.order).map(chapter => ({
      ...chapter,
      subject: subject.name,
      subjectId: subject.id,
      groupId: group.id,
      groupTitle: group.name,
      progressId: `capf:${chapter.id}`,
      path: `/learning/capf-${chapter.id}`,
      practicePath: `/ai-tutor?chapter=${chapter.id}`,
      reference: [...group.primaryBooks, ...(chapter.bookReferences || []).map(ref => `${ref.book}: ${ref.chapter}`), `Syllabus topics: ${chapter.topics.join('; ')}`].join(' · '),
    })),
  ));
}

export type CatalogChapter = ReturnType<typeof indexSyllabus>[number];

export function nextSyllabusChapters(chapters: CatalogChapter[], completed: ReadonlySet<string>) {
  const groups = new Map<string, CatalogChapter>();
  for (const chapter of chapters) {
    const key = `${chapter.subjectId}:${chapter.groupId}`;
    if (!completed.has(chapter.progressId) && !groups.has(key)) groups.set(key, chapter);
  }
  return [...groups.values()];
}
