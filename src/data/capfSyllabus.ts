export const CAPF_NOTICE = 'https://www.upsc.gov.in/sites/default/files/ExamNotifi_CAPF_AC_Exam_2026_Eng_20022026.pdf#page=15';
export const CAPF_YEARS = [2022, 2023, 2024, 2025, 2026];
export const CAPF_MISSING = [0, 3, 1, 1, 0];
export const CAPF_AREAS = [
  { id: 'science', title: 'Science & technology', counts: [36, 28, 27, 35, 35], subjects: ['General Science'], syllabus: 'Everyday scientific phenomena, scientific thinking, information technology, biotechnology and environmental science.', topics: ['Physics', 'Chemistry', 'Biology', 'Computers & technology'], path: '/books', action: 'Read science books' },
  { id: 'history', title: 'History & culture', counts: [19, 20, 16, 20, 15], subjects: ['Modern History'], syllabus: 'Indian history through its social, economic and political dimensions, including nationalism and the freedom movement.', topics: ['Ancient India', 'Medieval India', 'Modern India & freedom struggle', 'Art & culture'], path: '/learning', action: 'Open topic lessons' },
  { id: 'geography', title: 'Geography', counts: [19, 18, 15, 12, 14], subjects: ['Geography & Environment'], syllabus: 'Physical, social and economic geography of India and the world.', topics: ['Physical geography', 'Indian geography', 'World maps', 'Human & economic geography'], path: '/books', action: 'Read geography books' },
  { id: 'environment', title: 'Environment & ecology', counts: [3, 8, 5, 5, 7], subjects: ['Geography & Environment', 'General Science'], syllabus: 'Environmental science is included within the official General Science area. It appears separately here to match the trend index.', topics: ['Ecosystems', 'Biodiversity', 'Pollution', 'Climate & conservation'], path: '/learning', action: 'Choose an environment lesson' },
  { id: 'maths', title: 'Maths & reasoning', counts: [15, 15, 20, 15, 15], subjects: ['Quantitative Aptitude', 'Reasoning & Intelligence'], syllabus: 'Logical reasoning, quantitative and numerical ability, and interpreting data.', topics: ['Arithmetic & fractions', 'Percentages & ratios', 'Data interpretation', 'Logical reasoning'], path: '/calculation-coach', action: 'Open Calculation Coach' },
  { id: 'economy', title: 'Economy', counts: [11, 11, 18, 18, 16], subjects: [], syllabus: 'Economic development in India, within the combined official Polity and Economy area.', topics: ['Economic fundamentals', 'Development', 'Public finance', 'Banking & policy'], path: '/ai-tutor', action: 'Choose a topic to practise' },
  { id: 'polity', title: 'Polity & governance', counts: [10, 8, 7, 4, 15], subjects: ['Polity & Constitution'], syllabus: 'Constitution, political and social systems, administration, security and human rights.', topics: ['Constitution', 'Government & administration', 'Security issues', 'Human rights'], path: '/learning', action: 'Open polity lessons' },
  { id: 'current', title: 'Current affairs', counts: [12, 14, 16, 15, 8], subjects: [], syllabus: 'Important Indian and international developments across culture, sport, governance, society, industry and relations between countries.', topics: ['National developments', 'International events', 'Culture & sports', 'Governance & development'], path: '/ai-tutor', action: 'Choose a topic to practise' },
];
export type CapfArea = typeof CAPF_AREAS[number];
export type Attention = 'focus' | 'review' | 'steady' | 'unknown';
export const ATTENTION_LABELS: Record<Attention, string> = { focus: 'Needs attention', review: 'Review next', steady: 'Keep revising', unknown: 'Not assessed' };
export const CAPF_CONFIDENCE_KEY = 'dutydeck_capf_confidence_v1';
export function parseCapfConfidence(raw: string | null): Record<string, Attention> {
  try {
    const value = JSON.parse(raw || '{}');
    return Object.fromEntries(CAPF_AREAS.filter(area => ['focus', 'review', 'steady'].includes(value?.[area.id])).map(area => [area.id, value[area.id]]));
  } catch { return {}; }
}
export function capfAttention(confidence: Attention | undefined, mistakeCount: number): Attention {
  if (mistakeCount > 0 || confidence === 'focus') return 'focus';
  return confidence || 'unknown';
}
