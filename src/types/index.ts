export type ExamTrack = 'UPSC_CAPF' | 'SSC_CPO' | 'SHARED_CORE';

export type Subject = 
  | 'Polity & Constitution' 
  | 'Modern History' 
  | 'Geography & Environment' 
  | 'General Science' 
  | 'Quantitative Aptitude' 
  | 'Reasoning & Intelligence' 
  | 'English Comprehension' 
  | 'Paper 2 (Subjective)';

export interface QuestionOption {
  key: 'A' | 'B' | 'C' | 'D';
  text: string;
}

export interface QuestionExplanation {
  coreConcept: string;
  shortcutOrTrick?: string;
  standardBookRef?: string;
  trapAlert?: string;
}

export interface Question {
  id: string;
  targetExam: ('SSC_CPO' | 'UPSC_CAPF')[];
  subject: Subject;
  microTopic: string;
  difficulty: 'Speed' | 'Analytical';
  type: 'SINGLE_CHOICE' | 'STATEMENT_BASED';
  questionText: string;
  statements?: string[]; // 1, 2, 3 statements for UPSC standard format
  options: QuestionOption[];
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  explanation: QuestionExplanation;
  yearRef?: string;
}

export type MistakeReason = 'Conceptual Gap' | 'Misread Question' | 'Calculation/Time Panic';

export interface MistakeRecord {
  id: string;
  questionId: string;
  selectedAnswer: 'A' | 'B' | 'C' | 'D';
  correctAnswer: 'A' | 'B' | 'C' | 'D';
  timeSpentSeconds: number;
  reason?: MistakeReason;
  timestamp: number;
  reviewCount: number;
  nextReviewDate: number; // SRS timestamp
  notes?: string;
}

export type Paper2Type = 'ESSAY' | 'ARGUMENT' | 'REPORT' | 'PRECIS';

export interface Paper2Prompt {
  id: string;
  type: Paper2Type;
  title: string;
  prompt: string;
  wordLimit: number;
  suggestedMinutes: number;
  originalPassage?: string; // For Précis writing
  contextTags: string[];
}

export interface Paper2Feedback {
  totalScore: number; // out of 20 marks
  structuralScore: number;
  factualAndDepthScore: number;
  toneAndGrammarScore: number;
  objectiveToneAudit: string;
  pointsForFeedback: string[];
  pointsAgainstFeedback: string[];
  précisRuleCompliance?: string;
  strengths: string[];
  suggestedImprovements: string[];
  modelAnswerSnippet?: string;
}

export interface Paper2Submission {
  id: string;
  topicType: Paper2Type;
  promptId: string;
  promptTitle: string;
  content: string;
  wordCount: number;
  timeSpentSeconds: number;
  submittedAt: number;
  aiFeedback?: Paper2Feedback;
}

export interface SyllabusSubtopic {
  id: string;
  title: string;
  isShared: boolean;
  examFocus: ('CAPF' | 'CPO')[];
  weightage: 'High' | 'Medium' | 'Low';
  standardRef: string;
  keyConcepts: string[];
}

export interface SyllabusModule {
  id: string;
  subject: Subject;
  iconName: string;
  description: string;
  isSharedCore: boolean;
  subtopics: SyllabusSubtopic[];
}

export type AdaptiveComplexityLevel = 'Factual Recall' | 'Foundational' | 'Standard' | 'Advanced';

export type QuestionComplexityTier = 'Simple' | 'Moderate' | 'Complex/UPSC';

export interface TopicProficiency {
  topic: string;
  totalAttempts: number;
  correctCount: number;
  accuracyRate: number; // 0 to 100
  averageTimeSeconds: number;
  conceptualGaps: number;
  misreadCount: number;
  timePanicCount: number;
  consecutiveCorrect: number;
  consecutiveIncorrect: number;
  currentLevel: AdaptiveComplexityLevel;
  statementDepth: 1 | 2 | 3 | 4;
  dominantGap: MistakeReason | 'Pacing' | 'None';
  recentOutcomes: ('CORRECT' | 'INCORRECT')[];
}

export interface AdaptiveAssessment {
  level: AdaptiveComplexityLevel;
  statementDepth: 1 | 2 | 3 | 4;
  complexityTier?: QuestionComplexityTier;
  identifiedGap: string;
  trapTypeToInject: 'Subtle Qualifier' | 'Conceptual Contrast' | 'Pacing & Elimination' | 'None';
  rationale: string;
  learningIntervention: string;
}

export interface ChapterSection {
  heading: string;
  content: string;
  keyTakeaway?: string;
  bulletPoints?: string[];
  tableData?: {
    headers: string[];
    rows: string[][];
  };
}

export interface ChapterQuizItem {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LearningChapter {
  id: string;
  subject: Subject;
  ncertBook: string;
  chapterNumber: number;
  chapterTitle: string;
  readTimeMinutes: number;
  examRelevance: ('UPSC_CAPF' | 'SSC_CPO')[];
  weightage: 'Very High' | 'High' | 'Medium';
  coreConcepts: string[];
  summaryOverview: string;
  sections: ChapterSection[];
  upscCapfAnalyticalAngle: string;
  sscCpoSpeedShortcut: string;
  examinerTraps: string[];
  highYieldMnemonics: string[];
  comprehensionQuiz: ChapterQuizItem[];
}

export interface ChapterProgress {
  chapterId: string;
  isCompleted: boolean;
  completedAt?: number;
  quizScore?: number;
  notes?: string;
}


