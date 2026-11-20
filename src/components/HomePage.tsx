import { useEffect, useRef, useState, type FormEvent, type PointerEvent } from 'react';
import {
  ArrowDown, ArrowRight, ArrowUpRight, BookOpen, Calculator, Check, ChevronDown, CircleX,
  Clock3, Compass, Layers3, ListChecks, Minus, Newspaper, Pause, PenLine, Play, RotateCcw, Sparkles,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { APP_NAME } from '../data/brand';
import { ARTICLE_33_QUESTION } from '../data/sampleQuestion';
import './HomePage.css';

const studySessions = {
  20: { learn: 8, practise: 8, revise: 4 },
  45: { learn: 20, practise: 15, revise: 10 },
  90: { learn: 40, practise: 30, revise: 20 },
};

const sessionTasks = [
  { key: 'learn', title: 'Read a topic lesson', detail: 'Pick one concept and make a note in your own words.', icon: BookOpen, path: '/learning' },
  { key: 'practise', title: 'Work through Paper I questions', detail: 'Rule out weak options and read the explanations.', icon: ListChecks, path: '/capf-elimination' },
  { key: 'revise', title: 'Recall what you’ve studied', detail: 'Try your due cards or revisit a question you missed.', icon: RotateCcw, path: '/revision' },
] as const;

const resources = [
  { title: 'CAPF syllabus', detail: 'See the exam scope and browse the chapter-by-chapter study guide.', icon: Compass, path: '/capf-syllabus' },
  { title: 'NCERT library', detail: 'Read original textbooks and track the chapters you’ve covered.', icon: BookOpen, path: '/books' },
  { title: 'Current affairs', detail: 'Read exam-relevant news and save key facts for recall.', icon: Newspaper, path: '/current-affairs' },
  { title: 'Calculation Coach', detail: 'Build speed with focused arithmetic and mental maths drills.', icon: Calculator, path: '/calculation-coach' },
];

const aiTools = [
  { title: 'AI study planner', detail: 'Get a daily plan based on your available time, unfinished chapters and recent mistakes.', icon: Clock3 },
  { title: 'Topic tutor and practice questions', detail: 'Break down a difficult topic and generate practice questions at your level.', icon: ListChecks },
  { title: 'Paper II feedback', detail: 'Get feedback on your answer’s structure, reasoning and writing style.', icon: PenLine },
  { title: 'Textbook passage help', detail: 'Turn a highlighted passage into a simpler explanation or a short quiz.', icon: BookOpen },
  { title: 'Mistake diagnosis', detail: 'See why a wrong option looked tempting and what to review next.', icon: RotateCcw },
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
          <h3 id="prep-question-heading" ref={questionHeading} tabIndex={-1}>Paper I practice</h3>
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

function SessionPlanner() {
  const [budget, setBudget] = useState<keyof typeof studySessions>(45);

  return (
    <div className="prep-session">
      <header className="prep-session-top">
        <div><Clock3 size={20} aria-hidden="true" /><h3>Plan a study session</h3></div>
      </header>
      <fieldset className="prep-session-time">
        <legend>How much time do you have?</legend>
        <div>
          {([20, 45, 90] as const).map(minutes => (
            <button key={minutes} type="button" aria-pressed={budget === minutes} onClick={() => setBudget(minutes)}>{minutes} min</button>
          ))}
        </div>
      </fieldset>
      <ol className="prep-session-tasks">
        {sessionTasks.map(({ key, title, detail, icon: Icon, path }) => (
          <li key={key}>
            <Link to={path}>
              <span className="prep-task-icon"><Icon size={19} aria-hidden="true" /></span>
              <span className="prep-task-copy"><strong>{title}</strong><small>{detail}</small></span>
              <span className="prep-task-time">{studySessions[budget][key]} min</span>
              <ArrowUpRight className="prep-task-arrow" size={17} aria-hidden="true" />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  );
}

export function HomePage() {
  const { user } = useAuth();
  const { hash } = useLocation();
  const heroFrame = useRef<HTMLDivElement>(null);
  const [motionPaused, setMotionPaused] = useState(false);

  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [hash]);

  function moveScene(event: PointerEvent<HTMLElement>) {
    if (event.pointerType !== 'mouse' || motionPaused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const { left, top, width, height } = event.currentTarget.getBoundingClientRect();
    const x = (event.clientX - left) / width - 0.5;
    const y = (event.clientY - top) / height - 0.5;
    heroFrame.current?.style.setProperty('--prep-hero-parallax',
      `translate3d(${x * 22}px, ${y * 14}px, 0) rotateX(${-y * 1.6}deg) rotateY(${x * 2}deg)`);
  }

  function resetScene() {
    if (!motionPaused) heroFrame.current?.style.removeProperty('--prep-hero-parallax');
  }

  function toggleSceneMotion() {
    const frame = heroFrame.current;
    if (frame && !motionPaused) frame.style.setProperty('--prep-hero-frozen', getComputedStyle(frame).transform);
    setMotionPaused(!motionPaused);
  }

  return (
    <div className="prep-home">
      <a className="prep-skip" href="#home-content">Skip to content</a>
      <header className="prep-header">
        <nav className="prep-container prep-nav" aria-label="Main navigation">
          <Link className="prep-brand" to="/"><span><Layers3 size={21} aria-hidden="true" /></span>{APP_NAME}</Link>
          <div className="prep-nav-links">
            <a href="#study-path">Study path</a>
            <a href="#practice">Try practice</a>
            <a href="#resources">Resources</a>
            <a href="#ai-tools">AI tools</a>
          </div>
          <div className="prep-nav-actions">
            {!user && <Link className="prep-nav-sign-in" to="/login">Sign in</Link>}
            <Link className="prep-nav-cta" to="/dashboard" aria-label="Open workspace">
              <span className="prep-nav-workspace-full">Open workspace</span><span className="prep-nav-workspace-short">Workspace</span>
              <ArrowUpRight size={16} aria-hidden="true" />
            </Link>
          </div>
        </nav>
      </header>

      <main id="home-content" tabIndex={-1}>
        <section className="prep-hero" aria-labelledby="prep-heading" data-motion-paused={motionPaused} onPointerMove={moveScene} onPointerLeave={resetScene}>
          <div className="prep-hero-media" aria-hidden="true">
            <div className="prep-hero-frame" ref={heroFrame}>
              <div className="prep-hero-camera">
                <picture>
                  <source media="(max-width: 43rem)" srcSet="/capf-study-hero-mobile.webp" />
                  <img src="/capf-study-hero.webp" alt="" width={1672} height={941} fetchPriority="high" />
                </picture>
                <span className="prep-hero-rain" />
                <span className="prep-hero-lamp" />
              </div>
            </div>
          </div>
          <div className="prep-container prep-hero-inner">
            <div className="prep-hero-copy">
              <p className="prep-eyebrow">UPSC CAPF (AC) preparation</p>
              <h1 id="prep-heading">Prepare with <em>purpose.</em></h1>
              <p className="prep-hero-intro">Study the syllabus, practise both papers and build a revision habit you can keep.</p>
              <div className="prep-actions">
                <Link className="prep-button prep-button-gold" to="/dashboard">Start studying <ArrowRight size={18} aria-hidden="true" /></Link>
                <a className="prep-hero-link" href="#sample-question">Try a sample question <ArrowDown size={16} aria-hidden="true" /></a>
              </div>
              <div className="prep-hero-access">
                {!user && <span>Google sign-in for the workspace</span>}
                <a className="prep-hero-ai" href="#ai-tools">Explore AI tools <ArrowUpRight size={14} aria-hidden="true" /></a>
              </div>
            </div>
            <a className="prep-scroll-link" href="#study-path"><ArrowDown size={17} aria-hidden="true" /> Explore the study path</a>
            <button className="prep-hero-motion" type="button" onClick={toggleSceneMotion}>
              {motionPaused ? <Play size={15} aria-hidden="true" /> : <Pause size={15} aria-hidden="true" />}
              {motionPaused ? 'Play motion' : 'Pause motion'}
            </button>
          </div>
        </section>

        <section className="prep-container prep-section prep-path" id="study-path" aria-labelledby="prep-path-heading">
          <div className="prep-section-copy">
            <p className="prep-eyebrow">Your study path</p>
            <h2 id="prep-path-heading">Start with the time you have.</h2>
            <p>Choose a session length and see how to divide it between learning, practice and recall. Open any task to get straight to work.</p>
            <Link className="prep-text-link" to="/dashboard#daily-plan">Open your daily plan <ArrowUpRight size={16} aria-hidden="true" /></Link>
          </div>
          <SessionPlanner />
        </section>

        <section className="prep-papers" id="practice" aria-labelledby="prep-papers-heading">
          <div className="prep-container prep-section">
            <header className="prep-section-copy prep-papers-heading">
              <div>
                <p className="prep-eyebrow">Exam practice</p>
                <h2 id="prep-papers-heading">Two papers. Two different skills.</h2>
              </div>
              <p>Learn to spot the wrong options in Paper I. In Paper II, turn what you know into a clear, well-structured answer.</p>
            </header>
            <div className="prep-papers-grid">
              <div className="prep-paper-column">
                <SampleQuestion />
                <Link className="prep-text-link" to="/practice/capf-analytica">Open timed Paper I practice <ArrowUpRight size={16} aria-hidden="true" /></Link>
              </div>
              <article className="prep-writing">
                <header>
                  <span className="prep-quiz-icon"><PenLine size={21} aria-hidden="true" /></span>
                  <div><h3>Paper II writing</h3><p>Argument writing</p></div>
                  <span className="prep-quiz-label">Sample prompt</span>
                </header>
                <div className="prep-writing-body">
                  <p className="prep-writing-prompt">Should disaster preparedness be taught in every school?</p>
                  <p>Think of a benefit, a practical concern, and a way a school could address it.</p>
                  <details className="prep-disclosure">
                    <summary>Show writing outline <ChevronDown size={17} aria-hidden="true" /></summary>
                    <ol>
                      <li>State your position in one clear sentence.</li>
                      <li>Weigh the value of early training against demands on the timetable.</li>
                      <li>Propose a practical next step, such as including drills in existing lessons.</li>
                    </ol>
                  </details>
                  <Link className="prep-button prep-button-dark" to="/paper-2">Open the writing desk <ArrowUpRight size={17} aria-hidden="true" /></Link>
                </div>
              </article>
            </div>
          </div>
        </section>

        <section className="prep-container prep-section prep-revision" id="revision" aria-labelledby="prep-revision-heading">
          <div className="prep-section-copy">
            <p className="prep-eyebrow">Revision</p>
            <h2 id="prep-revision-heading">Recall it before you reread it.</h2>
            <p>Answer from memory, then check what you missed. CadetSlate turns completed lessons and practice into recall cards and gives your mistakes a place to revisit.</p>
            <Link className="prep-text-link" to="/revision">Open revision tools <ArrowUpRight size={16} aria-hidden="true" /></Link>
          </div>
          <article className="prep-recall">
            <header><RotateCcw size={20} aria-hidden="true" /> <h3>Recall card · Indian Polity</h3></header>
            <p>Which article lets you approach the Supreme Court to enforce a Fundamental Right?</p>
            <details className="prep-disclosure">
              <summary><span className="prep-show-answer">Reveal answer</span><span className="prep-hide-answer">Hide answer</span><ChevronDown size={17} aria-hidden="true" /></summary>
              <p><strong>Article 32.</strong> It guarantees the right to move the Supreme Court for enforcement of Fundamental Rights.</p>
            </details>
          </article>
        </section>

        <section className="prep-resources" id="resources" aria-labelledby="prep-resources-heading">
          <div className="prep-container prep-section">
            <header className="prep-section-copy">
              <p className="prep-eyebrow">Study library</p>
              <h2 id="prep-resources-heading">Go deeper on what you need.</h2>
            </header>
            <div className="prep-resource-list">
              {resources.map(({ title, detail, icon: Icon, path }) => (
                <Link className="prep-resource" key={path} to={path}>
                  <span className="prep-task-icon"><Icon size={23} aria-hidden="true" /></span>
                  <span><strong>{title}</strong><small>{detail}</small></span>
                  <ArrowUpRight size={20} aria-hidden="true" />
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="prep-ai" id="ai-tools" aria-labelledby="prep-ai-heading">
          <div className="prep-container prep-section">
            <div className="prep-section-copy">
              <p className="prep-eyebrow"><Sparkles size={16} aria-hidden="true" /> AI study tools</p>
              <h2 id="prep-ai-heading">Get help when you get stuck.</h2>
              <p>Ask for a clearer explanation, get feedback on a draft or figure out what to study next. Sign in to access the AI tools.</p>
              <Link className="prep-button prep-button-dark" to="/ai-tutor">Open the AI tutor <ArrowUpRight size={16} aria-hidden="true" /></Link>
            </div>
            <ul className="prep-ai-tools">
              {aiTools.map(({ title, detail, icon: Icon }) => (
                <li key={title}>
                  <span className="prep-task-icon"><Icon size={19} aria-hidden="true" /></span>
                  <div><h3>{title}</h3><p>{detail}</p></div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="prep-container prep-section prep-faq" aria-labelledby="prep-faq-heading">
          <h2 id="prep-faq-heading">Before you start</h2>
          <div>
            <details className="prep-disclosure">
              <summary>Where is my study progress saved? <ChevronDown size={17} aria-hidden="true" /></summary>
              <p>Your study plan and progress are saved in this browser. Sign in with the same Google account to access your saved textbook notes.</p>
            </details>
            <details className="prep-disclosure">
              <summary>Where should I start if I’m new to CAPF? <ChevronDown size={17} aria-hidden="true" /></summary>
              <p>Read the <Link to="/capf-syllabus">CAPF syllabus</Link> to get familiar with both papers, then try a short session from the <a href="#study-path">study path</a>.</p>
            </details>
          </div>
        </section>

        <section className="prep-close" aria-labelledby="prep-close-heading">
          <div className="prep-container prep-section">
            <h2 id="prep-close-heading">Make today a study day.</h2>
            <Link className="prep-button prep-button-gold" to="/dashboard">Open your workspace <ArrowRight size={18} aria-hidden="true" /></Link>
          </div>
        </section>
      </main>

      <footer className="prep-footer">
        <div className="prep-container">
          <Link className="prep-brand" to="/"><span><Layers3 size={19} aria-hidden="true" /></span>{APP_NAME}</Link>
          <nav aria-label="Footer navigation">
            <Link to="/capf-syllabus">Syllabus</Link>
            <Link to="/practice">Practice</Link>
            <Link to="/dashboard">Workspace</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
