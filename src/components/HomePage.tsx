import { useState } from 'react';
import {
  ArrowDown, ArrowRight, BarChart3, BookOpen, Calculator, Check, ClipboardList,
  Clock3, Layers3, Newspaper, PenLine, Play, RotateCcw, Sparkles, Target,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './HomePage.css';

const previewTasks = [
  { icon: BookOpen, title: 'Read Fundamental Rights', detail: 'Learn', time: '15 min', tone: 'mint' },
  { icon: Target, title: 'Try a Paper I sectional', detail: 'Practise', time: 'Timed', tone: 'sand' },
  { icon: RotateCcw, title: 'Recall yesterday’s topics', detail: 'Review', time: '5 min', tone: 'lilac' },
];

const features = [
  { icon: ClipboardList, title: 'Daily plan & CAPF syllabus', description: 'Break the syllabus into manageable sessions and see what to study, practise and review today.' },
  { icon: BookOpen, title: 'NCERT & textbook library', description: 'Read chapter by chapter, take notes, and mark what you’ve covered.' },
  { icon: Target, title: 'Paper I practice', description: 'Practise eliminating options, take timed sectionals, and get used to negative marking.' },
  { icon: PenLine, title: 'Paper II writing', description: 'Work on essays, arguments and other descriptive tasks with dedicated writing practice.' },
  { icon: RotateCcw, title: 'Daily review & Mistake Vault', description: 'Revisit missed questions and use spaced recall to remember what you studied.' },
  { icon: Newspaper, title: 'Current affairs', description: 'Study exam-relevant news and turn key facts into recall cards.' },
  { icon: Sparkles, title: 'AI topic tutor', description: 'Break down a difficult topic and practise it with AI-generated questions.' },
  { icon: Play, title: 'Short chapter lessons', description: 'Learn one concept at a time with visual reels and quick knowledge checks.' },
  { icon: Calculator, title: 'Calculation Coach', description: 'Build speed and accuracy with focused mental maths drills.' },
  { icon: BarChart3, title: 'Progress & analytics', description: 'See your accuracy, writing practice and syllabus coverage to decide what needs more time.' },
];

export function HomePage() {
  const { signInAsGuest } = useAuth();
  const navigate = useNavigate();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function startStudying() {
    setPending(true);
    setError('');
    try {
      await signInAsGuest('Guest');
      navigate('/dashboard');
    } catch {
      setError('Could not open your workspace. Please try again.');
      setPending(false);
    }
  }

  return (
    <div className="prep-home">
      <a className="prep-skip" href="#home-content">Skip to content</a>
      <header className="prep-header">
        <nav className="prep-container prep-nav" aria-label="Main navigation">
          <Link className="prep-brand" to="/"><span><Layers3 size={20} aria-hidden="true" /></span> DutyDeck</Link>
          <div className="prep-nav-links">
            <a className="prep-nav-features" href="#features">Features</a>
            <Link className="prep-sign-in" to="/login">Sign in <ArrowRight size={16} aria-hidden="true" /></Link>
          </div>
        </nav>
      </header>

      <main id="home-content">
        <section className="prep-container prep-hero" aria-labelledby="prep-heading">
          <div>
            <p className="prep-eyebrow"><span /> UPSC CAPF (AC) preparation</p>
            <h1 id="prep-heading">Know what to<br className="prep-desktop-break" /> <em>study today.</em></h1>
            <p className="prep-intro">Prepare for both CAPF papers in one place. Follow a daily plan, build your fundamentals, and turn missed questions into your next revision session.</p>
            <div className="prep-actions">
              <button className="prep-primary" type="button" disabled={pending} onClick={startStudying}>
                {pending ? 'Opening workspace…' : 'Start studying'} <ArrowRight size={18} aria-hidden="true" />
              </button>
              <a className="prep-secondary" href="#features">Explore features <ArrowDown size={16} aria-hidden="true" /></a>
            </div>
            <p className="prep-guest"><Check size={15} aria-hidden="true" /> Try it as a guest. No account required.</p>
            {error && <p className="prep-error" role="alert">{error}</p>}
          </div>

          <div className="prep-preview">
            <div className="prep-preview-card">
              <div className="prep-preview-top">
                <span><Layers3 size={16} aria-hidden="true" /> DutyDeck</span>
                <span>Sample study plan</span>
              </div>
              <div className="prep-preview-body">
                <div className="prep-preview-heading">
                  <div><p><Clock3 size={14} aria-hidden="true" /> Daily plan</p><h2>Today’s study plan</h2></div>
                  <span className="prep-preview-count">3 tasks</span>
                </div>
                <ul className="prep-task-list">
                  {previewTasks.map(({ icon: Icon, title, detail, time, tone }) => (
                    <li className="prep-task" key={title}>
                      <span className={`prep-icon prep-icon-${tone}`}><Icon size={19} aria-hidden="true" /></span>
                      <div><span>{detail}</span><strong>{title}</strong></div>
                      <small>{time}</small>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="prep-features" id="features" aria-labelledby="prep-features-heading">
          <div className="prep-container">
            <div className="prep-section-heading">
              <p className="prep-eyebrow"><span /> Inside DutyDeck</p>
              <h2 id="prep-features-heading">Learn, practise and revise for CAPF.</h2>
            </div>
            <ul className="prep-feature-grid">
              {features.map(({ icon: Icon, title, description }) => (
                <li key={title}>
                  <span className="prep-icon prep-icon-mint"><Icon size={20} aria-hidden="true" /></span>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </li>
              ))}
            </ul>
            <div className="prep-bottom">
              <div><h2>Ready for your first session?</h2><p>Open your workspace and pick a task for today.</p></div>
              <button className="prep-primary" type="button" disabled={pending} onClick={startStudying}>
                {pending ? 'Opening workspace…' : 'Start studying'} <ArrowRight size={18} aria-hidden="true" />
              </button>
              {error && <p className="prep-error" role="alert">{error}</p>}
            </div>
          </div>
        </section>
      </main>

      <footer className="prep-container prep-footer">
        <Link className="prep-brand" to="/"><span><Layers3 size={20} aria-hidden="true" /></span> DutyDeck</Link>
        <Link to="/login">Sign in</Link>
      </footer>
    </div>
  );
}
