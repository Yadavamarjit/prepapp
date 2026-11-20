import science from '../upsc_capf_science_chapterwise_pyqs.json';
import geography from '../upsc_capf_geography_chapterwise_pyqs.json';
import history from '../upsc_capf_history_chapterwise_pyqs.json';
import polity from '../upsc_capf_polity_chapterwise_pyqs.json';
import economy from '../upsc_capf_economy_chapterwise_pyqs.json';
import mentalAbility from '../upsc_capf_mental_ability_chapterwise_pyqs.json';
import currentEvents from '../upsc_capf_current_events_chapterwise_pyqs.json';

export const pyqSubjects = [
  { ...science, label: 'Science' },
  { ...geography, label: 'Geography' },
  { ...history, label: 'History' },
  { ...polity, label: 'Polity' },
  { ...economy, label: 'Economy' },
  { ...mentalAbility, label: 'Mental Ability' },
  { ...currentEvents, label: 'Current Events' },
];

export const pyqOptionKeys = ['a', 'b', 'c', 'd'] as const;
export type PyqOption = typeof pyqOptionKeys[number];
export type PyqChapter = typeof science.subSubjects[number]['chapters'][number];

export interface PyqExplanation {
  concept: string;
  reasoning: string[];
  options: Record<PyqOption, string>;
  examStrategy: string;
  practiceQuestion: string;
  practiceAnswer: string;
}
