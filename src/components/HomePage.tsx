import { useRef, useState, type FormEvent } from 'react';
import {
  ArrowDown, ArrowRight, BookOpen, CalendarDays, Check, ChevronDown, CircleCheck, CircleX,
  Layers3, ListChecks, Minus, PenLine, RotateCcw, SquareStack,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../data/brand';
import { ARTICLE_33_QUESTION } from '../data/learningLibrary';
import './HomePage.css';

const planTasks = [
  { title: 'Read about Fundamental Rights', time: '15 min' },
  { title: 'Solve a Paper I question', time: '10 min' },
  { title: 'Review yesterday’s notes', time: '5 min' },
];

function SampleQuestion() {
  const { question, options, correctIndex, explanation } = ARTICLE_33_QUESTION;
  const [selected, setSelected] = useState<number | null>(null);
  const [crossedOut, setCrossedOut] = useState<number[]>([]);
  const [checked, setChecked] = useState(false);
  const questionHeading = useRef<HTMLHeadingElement>(null);

  function toggleOption(index: number) {
    setCrossedOut((current) => current.includes(index)
      ? current.filter((option) => option !== index)
      : [...current, index]);
    if (selected === index) setSelected(null);
  }

  function checkAnswer(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (checked) {
      setSelected(null);
      setCrossedOut([]);
      setChecked(false);
      questionHeading.current?.focus();
    } else if (selected !== null) {
      setChecked(true);
    }
  }

  return (
    <article className="prep-quiz" id="sample-question" aria-labelledby="prep-question-heading" tabIndex={-1}>
      <header className="prep-quiz-header">
        <span className="prep-quiz-icon"><ListChecks size={21} aria-hidden="true" /></span>
        <div>
          <h2 id="prep-question-heading" ref={questionHeading} tabIndex={-1}>Paper I practice</h2>
          <p>Indian Polity</p>
        </div>
        <span className="prep-quiz-label">Sample question</span>
      </header>

      <form className="prep-quiz-form" onSubmit={checkAnswer}>
        <fieldset aria-describedby="prep-question-help">
          <legend>{question}</legend>
          <p className="prep-question-help" id="prep-question-help">Pick an answer. Use <Minus size={14} aria-label="the minus button" role="img" /> to cross out an option.</p>
          <ul className="prep-options">
            {options.map((option, index) => {
              const letter = String.fromCharCode(65 + index);
              const eliminated = crossedOut.includes(index);
              const correct = checked && index === correctIndex;
              const incorrect = checked && selected === index && index !== correctIndex;

              return (
                <li
                  className="prep-option"
                  key={option}
                  data-eliminated={eliminated && !correct}
                  data-result={correct ? 'correct' : incorrect ? 'incorrect' : undefined}
                >
                  <label className="prep-option-label">
                    <input
                      className="sr-only"
                      type="radio"
                      name="prep-sample-answer"
                      value={index}
                      checked={selected === index}
                      disabled={eliminated || checked}
                      onChange={() => setSelected(index)}
                    />
                    <span className="prep-option-letter" aria-hidden="true">{letter}</span>
                    <span className="prep-option-text">{option}</span>
                  </label>
                  {checked ? (
                    <span className="prep-option-action">
                      {correct && <Check size={18} aria-label="Correct option" role="img" />}
                      {incorrect && <CircleX size={17} aria-label="Incorrect option" role="img" />}
                    </span>
                  ) : (
                    <button
                      className="prep-option-action"
                      type="button"
                      aria-label={`Cross out option ${letter}: ${option}`}
                      aria-pressed={eliminated}
                      title={eliminated ? 'Restore option' : 'Cross out option'}
                      onClick={() => toggleOption(index)}
                    >
                      {eliminated ? <RotateCcw size={15} aria-hidden="true" /> : <Minus size={17} aria-hidden="true" />}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </fieldset>
        <div role="status">
          {checked && (
            <div className="prep-quiz-feedback" data-correct={selected === correctIndex}>
              <strong>{selected === correctIndex ? 'Correct!' : `Correct answer: ${options[correctIndex]}`}</strong>
              <p>{explanation}</p>
            </div>
          )}
        </div>
        <button className="prep-quiz-submit" type="submit" disabled={selected === null}>
          {checked ? <>Try again <RotateCcw size={16} aria-hidden="true" /></> : <>Check answer <ArrowRight size={16} aria-hidden="true" /></>}
        </button>
      </form>
    </article>
  );
}

function StudyPlanPreview() {
  const [completed, setCompleted] = useState<string[]>([]);

  return (
    <div className="prep-plan">
      <div className="prep-plan-heading">
        <strong>Sample daily plan</strong>
        <span aria-live="polite">{completed.length} of {planTasks.length} done</span>
      </div>
      <ul className="prep-plan-tasks">
        {planTasks.map(({ title, time }) => (
          <li key={title}>
            <label>
              <input
                type="checkbox"
                checked={completed.includes(title)}
                onChange={(event) => {
                  const isDone = event.currentTarget.checked;
                  setCompleted((current) => isDone ? [...current, title] : current.filter((task) => task !== title));
                }}
              />
              <span>{title}</span>
              <small>{time}</small>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HomePage() {
  const { signInAsGuest } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [failedAt, setFailedAt] = useState<'hero' | 'footer' | null>(null);

  async function startStudying(source: 'hero' | 'footer') {
    setPending(true);
    setFailedAt(null);
    try {
      await signInAsGuest('Guest');
      navigate('/dashboard');
    } catch {
      setFailedAt(source);
      setPending(false);
    }
  }

  return (
    <div className="prep-home">
      <a className="prep-skip" href="#home-content">Skip to content</a>
      <div className="prep-hero-shell">
        <header className="prep-header">
          <nav className="prep-container prep-nav" aria-label="Main navigation">
            <Link className="prep-brand" to="/"><span><Layers3 size={21} aria-hidden="true" /></span>{APP_NAME}</Link>
            <div className="prep-nav-links">
              <a className="prep-nav-features" href="#features">How it works</a>
              <Link className="prep-sign-in" to="/login">Sign in <ArrowRight size={15} aria-hidden="true" /></Link>
            </div>
          </nav>
        </header>

        <main id="home-content" tabIndex={-1}>
          <section className="prep-container prep-hero" aria-labelledby="prep-heading">
            <div className="prep-hero-copy">
              <p className="prep-eyebrow">UPSC CAPF (AC) preparation</p>
              <h1 id="prep-heading">Know what to <em>study today.</em></h1>
              <p className="prep-intro">Follow a daily plan for both CAPF papers. Build your fundamentals, practise under exam conditions, and turn mistakes into your next revision session.</p>
              <div className="prep-actions">
                <button className="prep-primary" type="button" disabled={pending} onClick={() => startStudying('hero')}>
                  {pending ? 'Opening workspace…' : 'Start studying'} <ArrowRight size={18} aria-hidden="true" />
                </button>
                <a className="prep-secondary" href="#sample-question">Try a sample question <ArrowDown size={16} aria-hidden="true" /></a>
              </div>
              <p className="prep-guest"><Check size={16} aria-hidden="true" /> Try it as a guest. No account required.</p>
              {failedAt === 'hero' && <p className="prep-error" role="alert">Could not open your workspace. Please try again.</p>}
            </div>

            <div className="prep-quiz-stage">
              <SampleQuestion />
            </div>
          </section>

          <section className="prep-features" id="features" aria-labelledby="prep-features-heading">
            <div className="prep-container">
              <h2 className="prep-section-title" id="prep-features-heading">What a study session looks like</h2>
              <div className="prep-workflow">
                <article className="prep-workflow-card">
                  <span className="prep-workflow-icon"><CalendarDays size={21} aria-hidden="true" /></span>
                  <h3>Plan your day</h3>
                  <p>Break the CAPF syllabus into a few tasks you can finish today.</p>
                  <StudyPlanPreview />
                </article>
                <article className="prep-workflow-card">
                  <span className="prep-workflow-icon"><PenLine size={21} aria-hidden="true" /></span>
                  <h3>Practise both papers</h3>
                  <p>Work on Paper I elimination and build arguments for Paper II.</p>
                  <div className="prep-card-demo">
                    <span className="prep-demo-label">Paper II · Argument writing</span>
                    <p>Should disaster preparedness be taught in every school?</p>
                    <details>
                      <summary><BookOpen size={16} aria-hidden="true" /> Show writing outline <ChevronDown size={16} aria-hidden="true" /></summary>
                      <p>State your position, weigh a benefit against a practical concern, then propose a way forward.</p>
                    </details>
                  </div>
                </article>
                <article className="prep-workflow-card">
                  <span className="prep-workflow-icon"><SquareStack size={21} aria-hidden="true" /></span>
                  <h3>Review your mistakes</h3>
                  <p>Use the Mistake Vault and recall cards to revisit what you missed.</p>
                  <div className="prep-card-demo">
                    <span className="prep-demo-label">Polity · Recall card</span>
                    <p>Which article lets you approach the Supreme Court to enforce a Fundamental Right?</p>
                    <details>
                      <summary><CircleCheck size={16} aria-hidden="true" /> Reveal answer <ChevronDown size={16} aria-hidden="true" /></summary>
                      <p><strong>Article 32.</strong> It guarantees the right to move the Supreme Court for enforcement of Fundamental Rights.</p>
                    </details>
                  </div>
                </article>
              </div>
              <div className="prep-bottom">
                <div>
                  <h2>Ready for your first session?</h2>
                  <p>Open your study plan and pick a task for today.</p>
                </div>
                <button className="prep-primary" type="button" disabled={pending} onClick={() => startStudying('footer')}>
                  {pending ? 'Opening workspace…' : 'Start studying'} <ArrowRight size={18} aria-hidden="true" />
                </button>
                {failedAt === 'footer' && <p className="prep-error" role="alert">Could not open your workspace. Please try again.</p>}
              </div>
            </div>
          </section>
        </main>
      </div>

      <footer className="prep-container prep-footer">
        <Link className="prep-brand" to="/"><span><Layers3 size={18} aria-hidden="true" /></span>{APP_NAME}</Link>
        <Link to="/login">Sign in</Link>
      </footer>
    </div>
  );
}
