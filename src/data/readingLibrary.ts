import { NCERT_STUDY_LIBRARY } from './ncertCurriculum';

export interface ReadingBook {
  code: string;
  title: string;
  subject: string;
  grade: number;
  chapters: { number: number; title: string }[];
}

// Full chapter sequences only. The older study catalog also contains combined
// highlights and partial selections; those are not complete textbooks.
export const READING_BOOKS: ReadingBook[] = ['iesc1', 'jesc1', 'iess1', 'jess1'].map(code => {
  const source = NCERT_STUDY_LIBRARY.find(book => book.code === code)!;
  const chapters = source.chapters.map(chapter => ({ number: chapter.chapterNumber, title: chapter.title }));
  if (code === 'jess1') {
    chapters[5] = { number: 6, title: 'Manufacturing Industries' };
    chapters.push({ number: 7, title: 'Lifelines of National Economy' });
  }
  return { code, title: source.bookTitle.replace(/^NCERT Class \d+ /, ''), subject: source.subject, grade: source.grade, chapters };
});

export function resolveReadingChapter(code: string | undefined, number: string | undefined) {
  const book = READING_BOOKS.find(item => item.code === code);
  const chapter = book?.chapters.find(item => String(item.number) === number);
  return { book, chapter };
}
