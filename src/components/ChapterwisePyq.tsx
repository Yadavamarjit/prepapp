import { useState } from 'react';
import { ArrowLeft, ArrowRight, ChevronDown, ListTree } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import science from '../../upsc_capf_science_chapterwise_pyqs.json';
import geography from '../../upsc_capf_geography_chapterwise_pyqs.json';
import history from '../../upsc_capf_history_chapterwise_pyqs.json';

const subjects = [science, geography, history];
const base = '/practice/chapterwise-pyq';
const optionKeys = ['a', 'b', 'c', 'd'] as const;
type Option = typeof optionKeys[number];
type Chapter = typeof science.subSubjects[number]['chapters'][number];

export default function ChapterwisePyq() {
  const { subjectId, chapterId } = useParams();
  const [menuOpen, setMenuOpen] = useState(false);
  const [answers, setAnswers] = useState<Record<string, Option>>({});
  const subject = subjectId ? subjects.find(item => item.subjectId === subjectId) : science;
  const chapters = subject?.subSubjects.flatMap(group => group.chapters);
  const chapter = chapterId ? chapters?.find(item => item.chapterId === chapterId) : chapters?.find(item => item.questions.length) ?? chapters?.[0];

  return <div className="space-y-6">
    <header>
      <p className="eyebrow">UPSC CAPF · Paper I</p>
      <h1 className="page-title mt-2">Chapterwise PYQ</h1>
      <p className="page-description">Practise previous-year questions by subject and chapter.</p>
    </header>
    <nav aria-label="PYQ subjects" className="flex flex-wrap gap-2">
      {subjects.map(item => {
        const active = subject?.subjectId === item.subjectId;
        return <Link key={item.subjectId} to={`${base}/${item.subjectId}`} aria-current={active ? 'true' : undefined}
          className={active ? 'primary-button' : 'secondary-button'}>
          {item.subjectName}<span className="opacity-80">{item.totalQuestions}</span>
        </Link>;
      })}
    </nav>
    {subject && chapter ? <div className="grid items-start gap-5 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
      <aside className="study-panel md:sticky md:top-24 md:max-h-[calc(100dvh-7rem)] md:overflow-auto">
        <button type="button" className="flex w-full items-center gap-2 p-4 text-left text-sm font-semibold md:hidden"
          onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen} aria-controls="pyq-chapters">
          <ListTree size={16} aria-hidden="true" /> Browse chapters
          <ChevronDown size={16} aria-hidden="true" className={`ml-auto ${menuOpen ? 'rotate-180' : ''}`} />
        </button>
        <nav id="pyq-chapters" aria-label={`${subject.subjectName} chapters`} className={`${menuOpen ? 'block' : 'hidden'} space-y-2 p-3 md:block`}>
          <h2 className="hidden px-2 py-2 text-sm font-semibold md:block">Chapters</h2>
          {subject.subSubjects.map(group => <details key={group.subSubjectId} open={group.chapters.some(item => item.chapterId === chapter.chapterId)} className="group">
            <summary className="flex cursor-pointer list-none items-start gap-2 rounded-lg px-2 py-2 text-sm font-medium hover:bg-[#EFF2E9] dark:hover:bg-[#273C2E] [&::-webkit-details-marker]:hidden">
              <ChevronDown size={15} aria-hidden="true" className="mt-0.5 shrink-0 -rotate-90 group-open:rotate-0" />
              {group.subSubjectName}
            </summary>
            <ul className="mt-1 space-y-1">
              {group.chapters.map(item => {
                const active = item.chapterId === chapter.chapterId;
                return <li key={item.chapterId}><Link to={`${base}/${subject.subjectId}/${item.chapterId}`} aria-current={active ? 'page' : undefined}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-start justify-between gap-2 rounded-lg py-2 pl-7 pr-2 text-xs leading-5 ${active ? 'bg-[#E9EFE9] font-semibold text-[#315840] dark:bg-[#273C2E] dark:text-[#B2D7BA]' : 'hover:bg-[#EFF2E9] dark:hover:bg-[#273C2E]'}`}>
                  <span>{item.chapterName}</span><span className="tabular-nums" aria-label={`${item.questions.length} questions`}>{item.questions.length}</span>
                </Link></li>;
              })}
            </ul>
          </details>)}
        </nav>
      </aside>
      <ChapterPractice key={`${subject.subjectId}/${chapter.chapterId}`} chapter={chapter} answers={answers} subjectId={subject.subjectId}
        onAnswer={(key, option) => setAnswers(previous => ({ ...previous, [key]: option }))} />
    </div> : <section className="study-panel space-y-4 p-5">
      <h2 className="section-title">Subject or chapter not found</h2>
      <Link to={subject ? `${base}/${subject.subjectId}` : base} className="quiet-link">Browse available chapters <ArrowRight size={15} aria-hidden="true" /></Link>
    </section>}
  </div>;
}

function ChapterPractice({ chapter, answers, subjectId, onAnswer }: {
  chapter: Chapter;
  answers: Record<string, Option>;
  subjectId: string;
  onAnswer: (key: string, option: Option) => void;
}) {
  const [index, setIndex] = useState(0);
  const question = chapter.questions[index];
  const answerKey = question && `${subjectId}/${question.id}`;
  const selected = answers[answerKey];
  const correct = question?.correctOption;
  const dropped = question?.status === 'dropped_by_upsc' || !correct;

  return <section className="study-panel min-w-0 space-y-5 p-4 sm:p-6" aria-labelledby="pyq-chapter-title">
    <header className="space-y-2">
      <h2 id="pyq-chapter-title" className="text-xl font-semibold">{chapter.chapterName}</h2>
      {question && <p role="status" className="text-xs text-[#686C65] dark:text-slate-400">
        Question {index + 1} of {chapter.questions.length} · {question.year} paper · Q{question.questionNumber}
      </p>}
    </header>
    {question ? <>
      <fieldset key={question.id}>
        <legend className="mb-4 whitespace-pre-line text-sm font-medium leading-7">{question.question}</legend>
        <div className="grid gap-2">
          {optionKeys.map(option => {
            const isSelected = selected === option;
            const isCorrect = !!selected && correct === option;
            return <button key={option} type="button" disabled={dropped || !!selected} onClick={() => onAnswer(answerKey, option)}
              className={`flex min-h-11 gap-3 rounded-lg border px-3 py-2.5 text-left text-sm leading-6 ${isCorrect ? 'border-[#789575] bg-[#E9EFE9] text-[#315840] dark:bg-[#273C2E] dark:text-[#B2D7BA]' : isSelected ? 'border-rose-400 bg-rose-50 text-rose-900 dark:bg-rose-950 dark:text-rose-200' : 'border-[#DDE1D2] enabled:hover:bg-[#EFF2E9] dark:border-slate-700 dark:enabled:hover:bg-[#273C2E]'}`}>
              <span className="shrink-0 font-semibold">{option.toUpperCase()}.</span>
              <span className="min-w-0 whitespace-pre-line">{question.options[option]}{isSelected && <span className="sr-only"> (your answer)</span>}{isCorrect && <span className="sr-only"> (answer key)</span>}</span>
            </button>;
          })}
        </div>
      </fieldset>
      <div role="status">
        {dropped ? <p className="text-sm">Dropped by UPSC. No answer key is available for this question.</p> : selected && <div className="space-y-1 text-sm leading-6">
          <p className="font-medium">{selected === correct ? 'Correct.' : 'Incorrect.'} {question.status === 'official' ? 'Official answer' : 'Provisional answer'} — {correct.toUpperCase()}. {question.correctAnswerText}</p>
          {question.status === 'provisional_derived' && <p className="text-xs text-[#686C65] dark:text-slate-400">This key was derived for the dataset and has not been confirmed by UPSC.</p>}
        </div>}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#DDE1D2] pt-4 dark:border-slate-700">
        <button type="button" className="secondary-button disabled:opacity-50" disabled={index === 0} onClick={() => setIndex(index - 1)}>
          <ArrowLeft size={15} aria-hidden="true" /> Previous
        </button>
        <button type="button" className="primary-button" disabled={index === chapter.questions.length - 1} onClick={() => setIndex(index + 1)}>
          Next <ArrowRight size={15} aria-hidden="true" />
        </button>
      </div>
    </> : <p className="text-sm">There are no questions in this chapter.</p>}
  </section>;
}
