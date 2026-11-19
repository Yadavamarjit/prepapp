import { apiFetch } from '../lib/api';
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  Layers,
  GraduationCap,
  FileText,
  AlignLeft,
  CheckSquare,
  FileDown,
  Wand2,
  HelpCircle,
  X,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Check,
  Quote,
  ArrowLeft,
  Clock,
  Compass,
  Trash2,
  Filter,
} from 'lucide-react';
import { NCERT_STUDY_LIBRARY, NCERTBook, NCERTChapter } from '../data/ncertCurriculum';
import { MarkdownRenderer } from './MarkdownRenderer';

interface NcertExplorerProps {
  onSelectTopicForAi?: (title: string, subject: string, standardRef: string) => void;
}

interface RenderedBlock {
  text: string;
  left: number;
  top: number;
  width: number;
  height: number;
}

interface RenderedPage {
  pageNumber: number;
  width: number;
  height: number;
  imagePath: string;
  blocks: RenderedBlock[];
}

interface ChapterStudyNote {
  id: string;
  bookCode: string;
  chapterNumber: number;
  type: 'EXPLAIN' | 'QUESTIONS';
  selectedText: string;
  pageNumber?: number;
  title: string;
  content: string;
  createdAt: string;
}

export const NcertExplorer: React.FC<NcertExplorerProps> = ({ onSelectTopicForAi }) => {
  // Router Hooks for direct URL access (e.g. /ncert/:grade/:subject/:chapterNumber)
  const { grade, subject, chapterNumber, bookCode } = useParams<{
    grade?: string;
    subject?: string;
    chapterNumber?: string;
    bookCode?: string;
  }>();
  const navigate = useNavigate();
  const location = useLocation();

  // Main Studio Mode: 'CATALOG' (Library Picker) vs 'READER' (Immersive Distraction-Free Study Studio)
  const [viewMode, setViewMode] = useState<'CATALOG' | 'READER'>('CATALOG');

  // Filter States
  const [selectedSubject, setSelectedSubject] = useState<'ALL' | 'Science' | 'Geography' | 'History' | 'Polity'>('ALL');
  const [selectedGrade, setSelectedGrade] = useState<number | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Reader States
  const [readingTab, setReadingTab] = useState<'OFFICIAL_PDF' | 'FULL_TEXT' | 'SUMMARY'>('OFFICIAL_PDF');
  const [pdfDisplayMode, setPdfDisplayMode] = useState<'VISUAL_BOOK' | 'RAW_PDF'>('VISUAL_BOOK');
  const [renderedPages, setRenderedPages] = useState<RenderedPage[]>([]);
  const [pdfPagesLoading, setPdfPagesLoading] = useState<boolean>(false);
  const [selectedSnippet, setSelectedSnippet] = useState<string>('');
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [copiedSnippet, setCopiedSnippet] = useState<boolean>(false);

  // Persistent Chapter Study Notes Feed (Right Panel Accordion)
  const [savedNotes, setSavedNotes] = useState<ChapterStudyNote[]>([]);
  const [notesLoading, setNotesLoading] = useState<boolean>(false);
  const [expandedNoteIds, setExpandedNoteIds] = useState<Set<string>>(new Set());
  const [notesFilter, setNotesFilter] = useState<'ALL' | 'EXPLAIN' | 'QUESTIONS'>('ALL');
  const [newlyCreatedId, setNewlyCreatedId] = useState<string | null>(null);

  // Reader Layout Controls
  const [isLeftDrawerOpen, setIsLeftDrawerOpen] = useState<boolean>(false);
  const [isRightPanelOpen, setIsRightPanelOpen] = useState<boolean>(true);
  const [pdfZoomLevel, setPdfZoomLevel] = useState<number>(105);

  // Floating Quick Action Toolbar (Pill above selected text)
  const [floatingToolbar, setFloatingToolbar] = useState<{ x: number; y: number; visible: boolean }>({
    x: 0,
    y: 0,
    visible: false,
  });

  const readerContainerRef = useRef<HTMLDivElement>(null);

  // Active Chapter & Book
  const [activeChapter, setActiveChapter] = useState<NCERTChapter>(() => {
    return NCERT_STUDY_LIBRARY[0].chapters[0];
  });
  const [activeBook, setActiveBook] = useState<NCERTBook>(() => {
    return NCERT_STUDY_LIBRARY[0];
  });

  // Filtered books
  const filteredBooks = useMemo(() => {
    return NCERT_STUDY_LIBRARY.filter((book) => {
      const matchSubject = selectedSubject === 'ALL' || book.subject === selectedSubject;
      const matchGrade = selectedGrade === 'ALL' || book.grade === selectedGrade;
      return matchSubject && matchGrade;
    });
  }, [selectedSubject, selectedGrade]);

  // All filtered chapters matching search
  const filteredChaptersList = useMemo(() => {
    const list: { book: NCERTBook; chapter: NCERTChapter }[] = [];
    const q = searchQuery.toLowerCase().trim();

    for (const book of filteredBooks) {
      for (const ch of book.chapters) {
        if (
          !q ||
          ch.title.toLowerCase().includes(q) ||
          ch.summary.toLowerCase().includes(q) ||
          ch.highYieldNotes.toLowerCase().includes(q) ||
          ch.keyConcepts.some((k) => k.toLowerCase().includes(q))
        ) {
          list.push({ book, chapter: ch });
        }
      }
    }
    return list;
  }, [filteredBooks, searchQuery]);

  // Available grades for the current subject
  const availableGrades = useMemo(() => {
    const grades = new Set<number>();
    const pool = selectedSubject === 'ALL' ? NCERT_STUDY_LIBRARY : NCERT_STUDY_LIBRARY.filter((b) => b.subject === selectedSubject);
    pool.forEach((b) => grades.add(b.grade));
    return Array.from(grades).sort((a, b) => a - b);
  }, [selectedSubject]);

  // Helper to resolve book and chapter from route parameters
  const findBookAndChapter = (
    pGrade?: string,
    pSubject?: string,
    pChapterNum?: string,
    pBookCode?: string
  ): { book: NCERTBook; chapter: NCERTChapter } | null => {
    // 1. Try matching by bookCode + chapterNumber (e.g. /ncert/iesc1/1)
    if (pBookCode && pChapterNum) {
      const chNum = parseInt(pChapterNum, 10);
      const book = NCERT_STUDY_LIBRARY.find((b) => b.code.toLowerCase() === pBookCode.toLowerCase());
      if (book) {
        const chapter = book.chapters.find((c) => c.chapterNumber === chNum) || book.chapters[0];
        return { book, chapter };
      }
    }

    // 2. Try matching by grade + subject + chapterNumber (e.g. /ncert/9/science/1 or /ncert/class-9/science/1)
    if (pGrade && pSubject) {
      const cleanGrade = parseInt(pGrade.toLowerCase().replace('class-', '').replace('grade-', ''), 10);
      const cleanSubj = pSubject.toLowerCase().trim();
      const chNum = pChapterNum ? parseInt(pChapterNum, 10) : 1;

      const matchSubject = (bookSubj: string) => {
        const bs = bookSubj.toLowerCase();
        if (bs === cleanSubj) return true;
        if (cleanSubj === 'science' && bs.includes('science')) return true;
        if (cleanSubj === 'geography' && (bs.includes('geography') || bs.includes('geo'))) return true;
        if (cleanSubj === 'history' && (bs.includes('history') || bs.includes('hist'))) return true;
        if (cleanSubj === 'polity' && (bs.includes('polity') || bs.includes('politics'))) return true;
        return false;
      };

      const book = NCERT_STUDY_LIBRARY.find(
        (b) => b.grade === cleanGrade && matchSubject(b.subject)
      );

      if (book) {
        const chapter = book.chapters.find((c) => c.chapterNumber === chNum) || book.chapters[0];
        return { book, chapter };
      }
    }

    return null;
  };

  // Sync URL parameters on initial load or browser refresh / back-forward navigation
  useEffect(() => {
    const match = findBookAndChapter(grade, subject, chapterNumber, bookCode);
    if (match) {
      setActiveBook(match.book);
      setActiveChapter(match.chapter);
      setViewMode('READER');
      setRenderedPages([]);
      fetchChapterNotes(match.book.code, match.chapter.chapterNumber);
    } else if (!grade && !subject && !bookCode) {
      if (location.pathname === '/ncert' || location.pathname === '/learning') {
        setViewMode('CATALOG');
      }
    }
  }, [grade, subject, chapterNumber, bookCode, location.pathname]);

  // Fetch persistent notes for the active chapter from DB
  const fetchChapterNotes = (bookCode: string, chNum: number) => {
    setNotesLoading(true);
    apiFetch(`/api/ncert/notes/${bookCode}/${chNum}`)
      .then((r) => r.json())
      .then((d) => {
        if (d.success && Array.isArray(d.notes)) {
          setSavedNotes(d.notes);
          // By default, past notes are collapsed
          setExpandedNoteIds(new Set());
        }
      })
      .catch((e) => console.warn('Failed to fetch chapter notes:', e))
      .finally(() => setNotesLoading(false));
  };

  // Launch Reader for a chapter with clean route URL
  const handleOpenChapterInReader = (book: NCERTBook, chapter: NCERTChapter) => {
    setActiveBook(book);
    setActiveChapter(chapter);
    setRenderedPages([]);
    setSelectedSnippet('');
    setFloatingToolbar({ x: 0, y: 0, visible: false });
    setViewMode('READER');
    fetchChapterNotes(book.code, chapter.chapterNumber);

    // Update URL to /ncert/:grade/:subject/:chapterNumber
    navigate(`/ncert/${book.grade}/${book.subject.toLowerCase()}/${chapter.chapterNumber}`);
  };

  // Select another chapter from the left drawer outline
  const handleSelectChapterFromOutline = (ch: NCERTChapter) => {
    setActiveChapter(ch);
    setRenderedPages([]);
    setSelectedSnippet('');
    setFloatingToolbar({ x: 0, y: 0, visible: false });
    fetchChapterNotes(activeBook.code, ch.chapterNumber);

    // Update URL
    navigate(`/ncert/${activeBook.grade}/${activeBook.subject.toLowerCase()}/${ch.chapterNumber}`);
  };

  // Return to Catalog Library
  const handleBackToLibrary = () => {
    setViewMode('CATALOG');
    navigate('/ncert');
  };

  // Fetch notes on chapter change when in reader
  useEffect(() => {
    if (viewMode === 'READER') {
      fetchChapterNotes(activeBook.code, activeChapter.chapterNumber);
    }
  }, [activeBook.code, activeChapter.chapterNumber, viewMode]);

  // Fetch full rendered book pages with bounding-box selectable text layers
  useEffect(() => {
    if (viewMode === 'READER' && readingTab === 'OFFICIAL_PDF' && pdfDisplayMode === 'VISUAL_BOOK') {
      setPdfPagesLoading(true);
      apiFetch(`/api/ncert/pdf-rendered-pages/${activeBook.code}/${activeChapter.chapterNumber}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.success && Array.isArray(d.pages)) {
            setRenderedPages(d.pages);
          }
        })
        .catch((e) => console.warn('Failed to load rendered PDF book pages:', e))
        .finally(() => setPdfPagesLoading(false));
    }
  }, [viewMode, readingTab, pdfDisplayMode, activeBook.code, activeChapter.chapterNumber]);

  // Request AI Explanation or Question Generation & Save to DB
  const handleTriggerAiAction = async (action: 'EXPLAIN' | 'GENERATE_QUESTIONS', textToUse?: string) => {
    const targetText = (textToUse || selectedSnippet).trim();
    if (!targetText) return;

    setIsRightPanelOpen(true);
    setFloatingToolbar((prev) => ({ ...prev, visible: false }));
    setAiLoading(true);

    try {
      // 1. Generate Explanation or Questions from AI
      const res = await apiFetch('/api/ai/text-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          text: targetText,
          context: {
            bookTitle: activeBook.bookTitle,
            chapterTitle: activeChapter.title,
            subject: activeBook.subject,
            grade: activeBook.grade,
          },
        }),
      });
      const data = await res.json();

      if (data.success) {
        const title = action === 'EXPLAIN' ? '💡 Concept Breakdown & Examiner Traps' : '🎯 CAPF Practice Drill';
        const content = action === 'EXPLAIN' ? data.explanation : data.output;

        // 2. Persist in Database
        const saveRes = await apiFetch('/api/ncert/notes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            bookCode: activeBook.code,
            chapterNumber: activeChapter.chapterNumber,
            type: action,
            selectedText: targetText,
            title,
            content,
          }),
        });
        const savedData = await saveRes.json();

        if (savedData.success && savedData.note) {
          const newNote: ChapterStudyNote = savedData.note;
          setSavedNotes((prev) => [newNote, ...prev]);

          // Automatically expand the newly generated card!
          setExpandedNoteIds((prev) => {
            const next = new Set(prev);
            next.add(newNote.id);
            return next;
          });
          setNewlyCreatedId(newNote.id);
          setTimeout(() => setNewlyCreatedId(null), 3000);
        }
      }
    } catch (err) {
      console.error('AI text action failed:', err);
    } finally {
      setAiLoading(false);
    }
  };

  // Toggle single accordion note
  const toggleAccordion = (id: string) => {
    setExpandedNoteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  // Delete a saved note from DB
  const handleDeleteNote = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await apiFetch(`/api/ncert/notes/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSavedNotes((prev) => prev.filter((n) => n.id !== id));
        setExpandedNoteIds((prev) => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }
    } catch (err) {
      console.error('Failed to delete note:', err);
    }
  };

  // Clear all notes for chapter
  const handleClearAllNotes = async () => {
    if (!window.confirm('Are you sure you want to clear all saved notes and questions for this chapter?')) return;
    try {
      const res = await apiFetch(`/api/ncert/notes/${activeBook.code}/${activeChapter.chapterNumber}/all`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setSavedNotes([]);
        setExpandedNoteIds(new Set());
      }
    } catch (err) {
      console.error('Failed to clear notes:', err);
    }
  };

  // Catch user text selections in the window
  const handleCaptureTextSelection = () => {
    const selection = window.getSelection();
    const raw = selection?.toString() || '';
    const sel = raw.replace(/\s+/g, ' ').trim();

    if (sel && sel.length > 5) {
      setSelectedSnippet(sel);

      // Position floating toolbar near cursor/selection
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        if (rect.width > 0) {
          setFloatingToolbar({
            x: Math.min(window.innerWidth - 250, Math.max(16, rect.left + rect.width / 2 - 110)),
            y: Math.max(16, rect.top - 46),
            visible: true,
          });
        }
      }
    } else {
      setFloatingToolbar((prev) => ({ ...prev, visible: false }));
    }
  };

  const handleCopySnippet = () => {
    if (selectedSnippet) {
      navigator.clipboard.writeText(selectedSnippet);
      setCopiedSnippet(true);
      setTimeout(() => setCopiedSnippet(false), 1800);
    }
  };

  // Filtered list of notes according to type tab
  const filteredNotes = useMemo(() => {
    if (notesFilter === 'ALL') return savedNotes;
    return savedNotes.filter((n) => n.type === notesFilter);
  }, [savedNotes, notesFilter]);

  // Counts for filter tabs
  const countExplains = useMemo(() => savedNotes.filter((n) => n.type === 'EXPLAIN').length, [savedNotes]);
  const countQuestions = useMemo(() => savedNotes.filter((n) => n.type === 'QUESTIONS').length, [savedNotes]);

  // Close floating toolbar when clicking outside
  useEffect(() => {
    const handleDocumentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.floating-selection-pill')) {
        setTimeout(() => {
          const sel = window.getSelection()?.toString().trim();
          if (!sel) {
            setFloatingToolbar((prev) => ({ ...prev, visible: false }));
          }
        }, 100);
      }
    };
    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  // Format timestamp helper
  const formatTimeAgo = (iso: string) => {
    try {
      const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
      if (diff < 60) return 'Just now';
      if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
      if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
      return `${Math.floor(diff / 86400)}d ago`;
    } catch {
      return '';
    }
  };

  // =========================================================================
  // STAGE 1: CLEAN CHAPTER CATALOG & SELECTION HUB
  // =========================================================================
  if (viewMode === 'CATALOG') {
    return (
      <div className="space-y-5">
        {/* Compact Clean Header */}
        <div className="rounded-2xl bg-gradient-to-r from-[#172554] via-[#1e3a8a] to-[#0f172a] text-white p-5 sm:p-6 shadow-md border border-blue-500/20 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5 max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-xs font-semibold">
              <GraduationCap className="w-3.5 h-3.5" />
              <span>NCERT Standard Curriculum</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white font-serif">
              NCERT Chapter-Wise Study Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Select any chapter to launch the <strong>full-screen distraction-free reader</strong> with official NCERT PDFs, selectable text, and a persistent AI study notebook.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="px-4 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-center">
              <div className="text-lg font-bold font-mono text-emerald-400">{filteredChaptersList.length}</div>
              <div className="text-[11px] text-slate-300">Chapters Ready</div>
            </div>
          </div>
        </div>

        {/* Filter Toolbar: Subject & Grade Pills */}
        <div className="bg-white dark:bg-[#1A2420] p-4 rounded-xl border border-[#E2E6DD] dark:border-slate-800 shadow-2xs space-y-3">
          {/* Subject Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
            <span className="text-xs font-semibold text-[#5C646B] dark:text-slate-400 flex items-center gap-1 flex-shrink-0">
              <Layers className="w-3.5 h-3.5" /> Subject:
            </span>
            {(['ALL', 'Science', 'Geography', 'History', 'Polity'] as const).map((subj) => (
              <button
                key={subj}
                onClick={() => {
                  setSelectedSubject(subj);
                  setSelectedGrade('ALL');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  selectedSubject === subj
                    ? 'bg-[#36624B] text-white shadow-xs'
                    : 'bg-[#F2F4F0] dark:bg-[#121816] text-[#5C646B] dark:text-slate-300 hover:text-[#1E252B]'
                }`}
              >
                {subj === 'ALL' ? 'All NCERT Subjects' : subj}
              </button>
            ))}
          </div>

          {/* Grade Selector & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-[#E2E6DD]/60 dark:border-slate-800/60">
            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <span className="text-xs font-semibold text-[#5C646B] dark:text-slate-400 flex items-center gap-1 flex-shrink-0 mr-1">
                Class:
              </span>
              <button
                onClick={() => setSelectedGrade('ALL')}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                  selectedGrade === 'ALL'
                    ? 'bg-[#1E252B] dark:bg-white text-white dark:text-[#1E252B]'
                    : 'bg-[#F7F8F5] dark:bg-[#121816] text-[#5C646B] dark:text-slate-400'
                }`}
              >
                All
              </button>
              {availableGrades.map((g) => (
                <button
                  key={g}
                  onClick={() => setSelectedGrade(g)}
                  className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                    selectedGrade === g
                      ? 'bg-[#1E252B] dark:bg-white text-white dark:text-[#1E252B]'
                      : 'bg-[#F7F8F5] dark:bg-[#121816] text-[#5C646B] dark:text-slate-400'
                  }`}
                >
                  Class {g}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chapter, topic, or concept..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-[#E2E6DD] dark:border-slate-700 bg-[#F7F8F5] dark:bg-[#121816] text-[#1E252B] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#36624B]/30"
              />
            </div>
          </div>
        </div>

        {/* Chapters Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChaptersList.length === 0 ? (
            <div className="col-span-full p-12 text-center bg-white dark:bg-[#1A2420] rounded-2xl border border-[#E2E6DD] dark:border-slate-800 text-xs text-slate-500">
              No chapters match your criteria.
            </div>
          ) : (
            filteredChaptersList.map(({ book, chapter }) => (
              <div
                key={chapter.id}
                onClick={() => handleOpenChapterInReader(book, chapter)}
                className="group p-5 rounded-2xl bg-white dark:bg-[#1A2420] border border-[#E2E6DD] dark:border-slate-800 hover:border-[#36624B] shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between space-y-3"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-[#E3EFE8] dark:bg-[#1A2E24] text-[#36624B] dark:text-[#88D4A8]">
                      Ch {chapter.chapterNumber}
                    </span>
                    <span className="text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                      {book.subject} &bull; Class {book.grade}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-[#1E252B] dark:text-white group-hover:text-[#36624B] dark:group-hover:text-[#88D4A8] transition-colors line-clamp-1 font-serif">
                    {chapter.title}
                  </h3>

                  <p className="text-xs text-[#5C646B] dark:text-slate-400 line-clamp-2 leading-relaxed">
                    {chapter.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {chapter.keyConcepts.slice(0, 2).map((k, i) => (
                      <span
                        key={i}
                        className="text-[10px] px-2 py-0.5 rounded-full bg-[#F7F8F5] dark:bg-[#121816] text-[#5C646B] dark:text-slate-400 border border-[#E2E6DD]/60"
                      >
                        {k}
                      </span>
                    ))}
                  </div>

                  <span className="text-xs font-semibold text-[#36624B] dark:text-[#88D4A8] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform flex-shrink-0">
                    <span>Study</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // STAGE 2: DEDICATED DISTRACTION-FREE READER STUDIO
  // =========================================================================
  return (
    <div
      className="fixed inset-0 z-50 bg-[#0E1512] text-slate-100 flex flex-col overflow-hidden h-screen w-screen p-0 m-0"
    >
      {/* 1. Ultra-Slim 48px Header Bar */}
      <header className="h-12 border-b border-slate-800 bg-[#141C18] px-3 sm:px-4 flex items-center justify-between gap-2 flex-shrink-0 z-30 select-none">
        {/* Left: Back to Library + Chapter Drawer Toggle */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={handleBackToLibrary}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs flex-shrink-0"
            title="Return to Chapter Library"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Library</span>
          </button>

          <button
            onClick={() => setIsLeftDrawerOpen(!isLeftDrawerOpen)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs flex-shrink-0 ${
              isLeftDrawerOpen
                ? 'bg-[#36624B] text-white'
                : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300'
            }`}
            title="Toggle Chapter Outline"
          >
            <BookOpen className="w-3.5 h-3.5 text-[#88D4A8]" />
            <span className="hidden md:inline">Outline</span>
          </button>

          <div className="h-4 w-px bg-slate-800 hidden sm:block" />

          {/* Active Chapter Label */}
          <div className="min-w-0 truncate">
            <div className="flex items-center gap-1.5 text-xs">
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#36624B] text-white flex-shrink-0">
                {activeBook.subject} Gr {activeBook.grade}
              </span>
              <span className="font-semibold text-slate-200 truncate">
                Ch {activeChapter.chapterNumber}: {activeChapter.title}
              </span>
            </div>
          </div>
        </div>

        {/* Center: Reading Mode Switcher */}
        <div className="flex items-center p-0.5 bg-slate-900/80 rounded-lg text-xs font-semibold border border-slate-800 flex-shrink-0">
          <button
            onClick={() => setReadingTab('OFFICIAL_PDF')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              readingTab === 'OFFICIAL_PDF'
                ? 'bg-blue-600 text-white shadow-2xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileDown className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">NCERT PDF</span>
            <span className="sm:hidden">PDF</span>
          </button>
          <button
            onClick={() => setReadingTab('FULL_TEXT')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              readingTab === 'FULL_TEXT'
                ? 'bg-[#36624B] text-white shadow-2xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Textbook View</span>
            <span className="sm:hidden">Text</span>
          </button>
          <button
            onClick={() => setReadingTab('SUMMARY')}
            className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
              readingTab === 'SUMMARY'
                ? 'bg-[#36624B] text-white shadow-2xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <AlignLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Key Traps</span>
            <span className="sm:hidden">Traps</span>
          </button>
        </div>

        {/* Right: Zoom & AI Study Notebook Toggle */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {readingTab === 'OFFICIAL_PDF' && pdfDisplayMode === 'VISUAL_BOOK' && (
            <div className="hidden lg:flex items-center gap-1 px-2 py-0.5 bg-slate-900 rounded-lg border border-slate-800 text-xs">
              <button
                onClick={() => setPdfZoomLevel((p) => Math.max(75, p - 15))}
                title="Zoom Out"
                className="p-1 hover:text-blue-400 cursor-pointer"
              >
                <ZoomOut className="w-3 h-3" />
              </button>
              <span className="font-mono text-[10px] w-9 text-center text-slate-300">{pdfZoomLevel}%</span>
              <button
                onClick={() => setPdfZoomLevel((p) => Math.min(160, p + 15))}
                title="Zoom In"
                className="p-1 hover:text-blue-400 cursor-pointer"
              >
                <ZoomIn className="w-3 h-3" />
              </button>
            </div>
          )}

          <button
            onClick={() => setIsRightPanelOpen(!isRightPanelOpen)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs ${
              isRightPanelOpen
                ? 'bg-[#36624B] text-white'
                : 'bg-emerald-950/80 text-emerald-300 border border-emerald-800/80'
            }`}
            title="Toggle Right AI Study Notebook Panel"
          >
            <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
            <span className="hidden md:inline">Study Notebook</span>
            {savedNotes.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/30 text-emerald-300 text-[10px] font-mono">
                {savedNotes.length}
              </span>
            )}
          </button>
        </div>
      </header>

      {/* 2. Main Reader Split Canvas: [Left Slide-Out Drawer] [Center Vast Canvas] [Right Persistent Notebook] */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* ========================================================================= */}
        {/* PANE A: SLIDE-OUT CHAPTER OUTLINE / DRAWER                               */}
        {/* ========================================================================= */}
        {isLeftDrawerOpen && (
          <div
            onClick={() => setIsLeftDrawerOpen(false)}
            className="fixed inset-0 top-12 z-40 bg-black/50 backdrop-blur-xs md:hidden"
          />
        )}

        <div
          className={`transition-all duration-300 ease-in-out border-r border-slate-800 bg-[#121915] flex flex-col flex-shrink-0 z-40 ${
            isLeftDrawerOpen
              ? 'w-72 sm:w-80 absolute md:relative inset-y-0 left-0 shadow-2xl md:shadow-none'
              : 'w-0 -ml-1 border-r-0 overflow-hidden'
          }`}
        >
          <div className="p-3 border-b border-slate-800 flex items-center justify-between bg-[#151E19]">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider">
              {activeBook.bookTitle}
            </span>
            <button
              onClick={() => setIsLeftDrawerOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1.5 no-scrollbar">
            {activeBook.chapters.map((ch) => {
              const isSelected = activeChapter.id === ch.id;
              return (
                <div
                  key={ch.id}
                  onClick={() => handleSelectChapterFromOutline(ch)}
                  className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-[#36624B]/30 border-[#36624B] text-white shadow-2xs'
                      : 'bg-[#161F1B] border-slate-800/80 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-1.5 text-[10px]">
                    <span className="px-1.5 py-0.5 rounded font-mono font-bold bg-black/40 text-[#88D4A8]">
                      Ch {ch.chapterNumber}
                    </span>
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200 mt-1 line-clamp-1">
                    {ch.title}
                  </h4>
                  <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {ch.summary}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* PANE B: CENTER EXPANSIVE BOOK CANVAS (MAX SPACE, CLEAN & FOCUSED)         */}
        {/* ========================================================================= */}
        <main
          ref={readerContainerRef}
          onMouseUp={handleCaptureTextSelection}
          className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 select-text bg-[#0B0F0D] flex flex-col items-center"
        >
          {/* VIEW 1: OFFICIAL NCERT PDF */}
          {readingTab === 'OFFICIAL_PDF' && (
            <div className="w-full max-w-4xl flex flex-col items-center space-y-6">
              {/* Subtle top controls for PDF (Visual vs Raw iframe) */}
              <div className="w-full flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800/80">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[11px] text-slate-400">
                    Source: {activeBook.code}0{activeChapter.chapterNumber}.pdf
                  </span>
                  <span className="text-slate-600">&bull;</span>
                  <span className="text-[11px] text-emerald-400">
                    Highlight any line to trigger Easy Explain or MCQs
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center p-0.5 bg-slate-900 rounded-md text-[11px] font-medium border border-slate-800">
                    <button
                      onClick={() => setPdfDisplayMode('VISUAL_BOOK')}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        pdfDisplayMode === 'VISUAL_BOOK'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Visual PDF
                    </button>
                    <button
                      onClick={() => setPdfDisplayMode('RAW_PDF')}
                      className={`px-2 py-0.5 rounded transition-all cursor-pointer ${
                        pdfDisplayMode === 'RAW_PDF'
                          ? 'bg-blue-600 text-white'
                          : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      Raw PDF
                    </button>
                  </div>

                  <a
                    href={`/api/ncert/pdf/${activeBook.code}/${activeChapter.chapterNumber}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
                    title="Open PDF in new browser tab"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Mode A: High-Res Pages with selectable transparent text layer */}
              {pdfDisplayMode === 'VISUAL_BOOK' && (
                <div className="w-full flex flex-col items-center space-y-8">
                  {pdfPagesLoading ? (
                    <div className="p-24 text-center space-y-3 bg-[#131A16] rounded-2xl border border-slate-800 w-full max-w-lg my-12">
                      <div className="w-9 h-9 mx-auto border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-semibold text-slate-300">
                        Rendering high-resolution NCERT pages with interactive text selection...
                      </p>
                    </div>
                  ) : renderedPages.length > 0 ? (
                    renderedPages.map((page) => (
                      <div
                        key={page.pageNumber}
                        className="relative bg-white rounded-xl shadow-2xl border border-slate-700/60 overflow-hidden transition-all"
                        style={{
                          width: `${Math.min(940, Math.round(820 * (pdfZoomLevel / 100)))}px`,
                          aspectRatio: `${page.width} / ${page.height}`,
                          containerType: 'size',
                        }}
                      >
                        {/* 1. Underlying Real High-Res Rendered Book Page Image */}
                        <img
                          src={page.imagePath}
                          alt={`NCERT Page ${page.pageNumber}`}
                          className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none"
                          loading="lazy"
                        />

                        {/* 2. Transparent Highlighting & Selection Text Layer (Natural Line Layers) */}
                        <div className="absolute inset-0 w-full h-full select-text pointer-events-auto">
                          {(page.blocks || []).map((b, bIdx) => (
                            <div
                              key={bIdx}
                              className="absolute select-text text-transparent hover:bg-yellow-200/10 selection:bg-[#36624B]/40 selection:text-transparent cursor-text leading-none whitespace-nowrap overflow-hidden flex items-center"
                              style={{
                                left: `${b.left}%`,
                                top: `${b.top}%`,
                                width: `${b.width}%`,
                                height: `${b.height}%`,
                                fontSize: `clamp(9px, ${b.height * 0.85}cqh, 24px)`,
                              }}
                              title={b.text}
                            >
                              {b.text}
                            </div>
                          ))}
                        </div>

                        {/* Subtle Page Badge */}
                        <div className="absolute bottom-2 right-3 px-2 py-0.5 rounded bg-black/70 text-white text-[10px] font-mono select-none pointer-events-none">
                          Page {page.pageNumber}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-12 text-center bg-[#131A16] rounded-2xl border border-slate-800 text-xs text-slate-400">
                      Preparing pages... If rendering takes time, switch to "Raw PDF" above.
                    </div>
                  )}
                </div>
              )}

              {/* Mode B: Raw PDF iframe */}
              {pdfDisplayMode === 'RAW_PDF' && (
                <div className="w-full h-[calc(100vh-140px)] rounded-xl overflow-hidden border border-slate-800 bg-[#525659] shadow-inner relative">
                  <iframe
                    src={`/api/ncert/pdf/${activeBook.code}/${activeChapter.chapterNumber}#toolbar=1&navpanes=0`}
                    className="w-full h-full border-0"
                    title={`NCERT ${activeBook.bookTitle} Chapter ${activeChapter.chapterNumber}`}
                  />
                </div>
              )}
            </div>
          )}

          {/* VIEW 2: TEXTBOOK SECTIONS VIEW */}
          {readingTab === 'FULL_TEXT' && (
            <div className="w-full max-w-3xl space-y-6">
              {activeChapter.sections && activeChapter.sections.length > 0 ? (
                activeChapter.sections.map((sec, sIdx) => (
                  <div
                    key={sIdx}
                    className="p-6 rounded-2xl bg-[#141C18] border border-slate-800 space-y-3.5 shadow-sm"
                  >
                    <h3 className="text-base sm:text-lg font-bold text-white font-serif flex items-center gap-2 border-b border-slate-800 pb-2.5">
                      <span className="w-6 h-6 rounded-md bg-[#36624B] text-white flex items-center justify-center text-xs font-mono font-bold">
                        {sIdx + 1}
                      </span>
                      <span>{sec.heading}</span>
                    </h3>

                    <p className="text-sm text-slate-300 leading-relaxed font-sans">
                      {sec.content}
                    </p>

                    {sec.bulletPoints && sec.bulletPoints.length > 0 && (
                      <ul className="space-y-1.5 pt-1 pl-1">
                        {sec.bulletPoints.map((bp, bIdx) => (
                          <li key={bIdx} className="text-xs sm:text-sm text-slate-300 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#88D4A8] mt-2 flex-shrink-0" />
                            <span>{bp}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {sec.tableData && (
                      <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0E1512] mt-2">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-[#1C2621] text-white font-bold border-b border-slate-800">
                            <tr>
                              {sec.tableData.headers.map((h, hIdx) => (
                                <th key={hIdx} className="p-3">
                                  {h}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-800/80">
                            {sec.tableData.rows.map((row, rIdx) => (
                              <tr key={rIdx} className="hover:bg-slate-800/30">
                                {row.map((cell, cIdx) => (
                                  <td key={cIdx} className="p-3 text-slate-300">
                                    {cell}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}

                    {sec.keyTakeaway && (
                      <div className="p-3.5 rounded-xl bg-[#1A2E24] border border-[#36624B]/40 text-xs font-semibold text-[#88D4A8] flex items-center gap-2">
                        <CheckSquare className="w-4 h-4 text-[#88D4A8] flex-shrink-0" />
                        <span>{sec.keyTakeaway}</span>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-6 rounded-2xl bg-[#141C18] border border-slate-800 space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-base font-bold text-white font-serif">
                      1. Complete Chapter Summary & Conceptual Scope
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed font-sans">
                      {activeChapter.summary}
                    </p>
                  </div>
                  <div className="space-y-2 border-t border-slate-800 pt-3">
                    <h3 className="text-base font-bold text-white font-serif">
                      2. Detailed Examination Notes & Key Applications
                    </h3>
                    <p className="text-sm text-slate-300 leading-relaxed font-sans">
                      {activeChapter.highYieldNotes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* VIEW 3: SUMMARY & EXAM TRAPS */}
          {readingTab === 'SUMMARY' && (
            <div className="w-full max-w-3xl space-y-6">
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#88D4A8] flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" /> Chapter Syllabus Summary
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed bg-[#141C18] p-5 rounded-2xl border border-slate-800">
                  {activeChapter.summary}
                </p>
              </div>

              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-[#88D4A8]" /> Foundational Pillars & Core Concepts
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {activeChapter.keyConcepts.map((concept, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 rounded-xl bg-[#141C18] border border-slate-800 text-xs font-medium text-slate-300 flex items-start gap-2"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#1A2E24] text-[#88D4A8] flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <span>{concept}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl p-5 bg-[#1A2E24] border border-[#36624B]/40 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-[#88D4A8]">
                  <Lightbulb className="w-4 h-4 text-amber-400" />
                  <span>High-Yield Examination Takeaway</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed font-sans">
                  {activeChapter.highYieldNotes}
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {activeChapter.mnemonics && (
                  <div className="p-4 rounded-xl bg-[#282215] border border-amber-800/40 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1">
                      💡 Memory Hook / Mnemonic
                    </span>
                    <p className="text-xs text-slate-200">
                      {activeChapter.mnemonics}
                    </p>
                  </div>
                )}

                {activeChapter.pastYearTrap && (
                  <div className="p-4 rounded-xl bg-[#2E1815] border border-red-900/40 space-y-1">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" /> Past Year Examiner Trap
                    </span>
                    <p className="text-xs text-slate-200">
                      {activeChapter.pastYearTrap}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        {/* ========================================================================= */}
        {/* PANE C: RIGHT PERSISTENT CHAPTER STUDY NOTEBOOK (ACCORDION FEED IN DB)    */}
        {/* ========================================================================= */}
        <aside
          className={`transition-all duration-300 ease-in-out border-l border-slate-800 bg-[#121915] flex flex-col flex-shrink-0 z-30 ${
            isRightPanelOpen ? 'w-84 sm:w-96' : 'w-0 -mr-1 border-l-0 overflow-hidden'
          }`}
        >
          {/* Top Header of Right Notebook */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-[#151E19]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-white uppercase tracking-wider">
                Study Notebook
              </span>
              <span className="px-1.5 py-0.2 rounded-full bg-slate-800 text-slate-300 text-[10px] font-mono">
                {savedNotes.length}
              </span>
            </div>
            <button
              onClick={() => setIsRightPanelOpen(false)}
              className="p-1 rounded text-slate-400 hover:text-white cursor-pointer"
              title="Close panel to widen book"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          </div>

          {/* Notebook Filter Pills & Clear Action */}
          <div className="px-3.5 py-2 border-b border-slate-800/80 bg-[#131A16] flex items-center justify-between gap-1 text-[11px]">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setNotesFilter('ALL')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer ${
                  notesFilter === 'ALL'
                    ? 'bg-slate-700 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                All ({savedNotes.length})
              </button>
              <button
                onClick={() => setNotesFilter('EXPLAIN')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  notesFilter === 'EXPLAIN'
                    ? 'bg-emerald-900/70 text-emerald-300 border border-emerald-700/60'
                    : 'text-emerald-400/80 hover:text-emerald-300'
                }`}
              >
                <span>💡 Notes</span>
                <span>({countExplains})</span>
              </button>
              <button
                onClick={() => setNotesFilter('QUESTIONS')}
                className={`px-2 py-0.5 rounded-md font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                  notesFilter === 'QUESTIONS'
                    ? 'bg-indigo-900/70 text-indigo-300 border border-indigo-700/60'
                    : 'text-indigo-400/80 hover:text-indigo-300'
                }`}
              >
                <span>🎯 Quiz</span>
                <span>({countQuestions})</span>
              </button>
            </div>

            {savedNotes.length > 0 && (
              <button
                onClick={handleClearAllNotes}
                title="Clear all saved notes for this chapter"
                className="p-1 rounded text-slate-500 hover:text-rose-400 cursor-pointer transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* AI Panel Body (Scrollable Feed) */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 no-scrollbar">
            {/* Active Selected Snippet Box (Pinned at top) */}
            <div className="p-3 rounded-xl bg-[#16201B] border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Quote className="w-3 h-3 text-[#88D4A8]" /> Highlighted Quote &amp; Input
                </span>
                {selectedSnippet && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={handleCopySnippet}
                      title="Copy selected text"
                      className="p-0.5 rounded text-slate-400 hover:text-white cursor-pointer"
                    >
                      {copiedSnippet ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    </button>
                    <button
                      onClick={() => setSelectedSnippet('')}
                      title="Clear snippet"
                      className="p-0.5 rounded text-slate-400 hover:text-red-400 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>

              {/* Highlighted text or custom editable input */}
              <div className="space-y-1">
                <textarea
                  value={selectedSnippet}
                  onChange={(e) => setSelectedSnippet(e.target.value)}
                  placeholder="Select/highlight any text in the book on the left, or type/paste your text here..."
                  rows={selectedSnippet ? Math.min(6, Math.max(3, Math.ceil(selectedSnippet.length / 45))) : 3}
                  className="w-full p-2.5 rounded-lg bg-[#0E1512] border border-slate-800 hover:border-slate-700 focus:border-[#36624B] text-xs text-slate-200 font-serif leading-relaxed focus:outline-none transition-colors resize-y"
                />
                {selectedSnippet && (
                  <div className="flex items-center justify-between text-[10px] text-slate-400 px-1">
                    <span className="text-emerald-400 font-mono">✓ {selectedSnippet.length} chars captured</span>
                    <span className="text-slate-500 italic">Editable / Resizable</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-2 pt-0.5">
                <button
                  disabled={!selectedSnippet.trim() || aiLoading}
                  onClick={() => handleTriggerAiAction('EXPLAIN')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#36624B] hover:bg-[#2A4F3C] disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <Sparkles className="w-3 h-3 text-yellow-300" />
                  <span>{aiLoading ? 'Analyzing...' : 'Easy Explain'}</span>
                </button>
                <button
                  disabled={!selectedSnippet.trim() || aiLoading}
                  onClick={() => handleTriggerAiAction('GENERATE_QUESTIONS')}
                  className="px-2.5 py-1.5 rounded-lg bg-[#1e3a8a] hover:bg-[#1d4ed8] disabled:opacity-40 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                >
                  <HelpCircle className="w-3 h-3 text-blue-200" />
                  <span>MCQ Test</span>
                </button>
              </div>
            </div>

            {/* Loading shimmer when generating */}
            {aiLoading && (
              <div className="p-4 text-center space-y-2 bg-[#16201B] rounded-xl border border-emerald-500/40 animate-pulse">
                <div className="w-6 h-6 mx-auto border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-semibold text-emerald-300">
                  Formulating targeted exam breakdown & saving to notebook...
                </p>
              </div>
            )}

            {/* Accordion Feed of Saved Chapter Notes */}
            {notesLoading ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Loading saved notes...
              </div>
            ) : filteredNotes.length === 0 ? (
              <div className="p-6 text-center bg-[#141C18] rounded-xl border border-dashed border-slate-800 space-y-2 text-xs text-slate-400">
                <Lightbulb className="w-6 h-6 mx-auto text-amber-400/80" />
                <p className="font-semibold text-slate-300">No notes saved for this chapter yet.</p>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Highlight sentences in the textbook and click <strong>Easy Explain</strong> or <strong>MCQ Test</strong>. All your takeaways will be saved here automatically!
                </p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredNotes.map((note) => {
                  const isExpanded = expandedNoteIds.has(note.id);
                  const isExplain = note.type === 'EXPLAIN';
                  const isNew = newlyCreatedId === note.id;

                  return (
                    <div
                      key={note.id}
                      className={`rounded-xl border transition-all overflow-hidden ${
                        isExplain
                          ? 'border-emerald-500/35 bg-[#14231B]/50 hover:border-emerald-500/50'
                          : 'border-indigo-500/35 bg-[#131B2E]/50 hover:border-indigo-500/50'
                      } ${isNew ? 'ring-2 ring-emerald-400 animate-in fade-in zoom-in-95' : ''}`}
                    >
                      {/* Accordion Header (Click to expand/collapse) */}
                      <div
                        onClick={() => toggleAccordion(note.id)}
                        className={`p-3 flex items-center justify-between gap-2 cursor-pointer transition-colors select-none ${
                          isExplain
                            ? 'hover:bg-emerald-950/40 bg-[#16251E]/60'
                            : 'hover:bg-indigo-950/40 bg-[#152033]/60'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          {/* Badge with Distinct Color */}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider flex-shrink-0 flex items-center gap-1 border ${
                              isExplain
                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                                : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            }`}
                          >
                            {isExplain ? <Sparkles className="w-2.5 h-2.5 text-yellow-300" /> : <HelpCircle className="w-2.5 h-2.5 text-blue-300" />}
                            <span>{isExplain ? 'Concept Note' : 'Practice Drill'}</span>
                          </span>

                          <span className="text-xs text-slate-300 font-serif italic truncate">
                            "{note.selectedText}"
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] text-slate-500 hidden sm:inline">
                            {formatTimeAgo(note.createdAt)}
                          </span>

                          <button
                            onClick={(e) => handleDeleteNote(note.id, e)}
                            className="p-1 rounded text-slate-500 hover:text-rose-400 transition-colors cursor-pointer"
                            title="Delete this saved card"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>

                          <div className="text-slate-400">
                            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                          </div>
                        </div>
                      </div>

                      {/* Accordion Content (Expanded View) */}
                      {isExpanded && (
                        <div
                          className={`p-3.5 border-t space-y-3 ${
                            isExplain
                              ? 'border-emerald-500/20 bg-[#0E1712]'
                              : 'border-indigo-500/20 bg-[#0D121E]'
                          }`}
                        >
                          {/* Quoted Text Full Block */}
                          <div
                            className={`p-2.5 rounded-lg border text-xs italic font-serif leading-relaxed ${
                              isExplain
                                ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-100'
                                : 'bg-indigo-950/30 border-indigo-500/30 text-indigo-100'
                            }`}
                          >
                            "{note.selectedText}"
                          </div>

                          {/* Markdown Rendered Content */}
                          <div className="text-xs leading-relaxed max-h-[460px] overflow-y-auto pr-1">
                            <MarkdownRenderer content={note.content} />
                          </div>

                          {/* Bottom Actions */}
                          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                            <button
                              onClick={() => {
                                navigator.clipboard.writeText(note.content);
                              }}
                              className="text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Copy Answer</span>
                            </button>

                            {onSelectTopicForAi && (
                              <button
                                onClick={() =>
                                  onSelectTopicForAi(
                                    activeChapter.title,
                                    activeBook.subject,
                                    `${activeBook.bookTitle} (Ch. ${activeChapter.chapterNumber})`
                                  )
                                }
                                className="text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer font-semibold"
                              >
                                <Sparkles className="w-3 h-3" />
                                <span>Discuss in AI Tutor</span>
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ========================================================================= */}
      {/* 3. FLOATING QUICK-ACTION TOOLBAR PILL (Appears right above cursor)       */}
      {/* ========================================================================= */}
      {floatingToolbar.visible && selectedSnippet && (
        <div
          className="floating-selection-pill fixed z-50 flex items-center gap-1 p-1 bg-[#1E252B] text-white rounded-xl shadow-2xl border border-slate-700 backdrop-blur-md animate-in fade-in zoom-in-95 duration-150"
          style={{
            left: `${floatingToolbar.x}px`,
            top: `${floatingToolbar.y}px`,
          }}
        >
          <button
            onClick={() => handleTriggerAiAction('EXPLAIN')}
            className="px-2.5 py-1 rounded-lg bg-[#36624B] hover:bg-[#2A4F3C] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
          >
            <Sparkles className="w-3 h-3 text-yellow-300" />
            <span>Easy Explain</span>
          </button>
          <button
            onClick={() => handleTriggerAiAction('GENERATE_QUESTIONS')}
            className="px-2.5 py-1 rounded-lg bg-[#1e3a8a] hover:bg-[#1d4ed8] text-white text-xs font-semibold flex items-center gap-1 cursor-pointer transition-all shadow-xs"
          >
            <HelpCircle className="w-3 h-3 text-blue-200" />
            <span>Questions</span>
          </button>
          <button
            onClick={() => setFloatingToolbar((prev) => ({ ...prev, visible: false }))}
            className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
    </div>
  );
};
