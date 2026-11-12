import { Paper2Type } from '../types';

export function getScaffoldTemplate(type: Paper2Type, title: string): string {
  switch (type) {
    case 'ARGUMENT':
      return `### TOPIC: ${title}

#### 1. Introduction / Context
[Briefly define the context, constitutional provisions, or national security/economic background in 2-3 sentences.]

#### 2. Arguments FOR the Statement
- **Point 1:** [Primary pillar, institutional or operational benefit, empirical data]
- **Point 2:** [Constitutional validity or strategic advantage]
- **Point 3:** [Long-term societal/administrative impact]

#### 3. Arguments AGAINST the Statement
- **Point 1:** [Operational vulnerabilities, federalism or human rights concerns]
- **Point 2:** [Fiscal burdens or enforcement bottlenecks]
- **Point 3:** [Alternative mechanisms or unintended consequences]

#### 4. Balanced Conclusion (Way Forward)
[Constructive middle ground maintaining institutional equilibrium and constitutional principles.]`;

    case 'REPORT':
      const today = new Date().toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
      return `### REPORT ON: ${title.toUpperCase()}
**NEW DELHI | ${today}**
*By Special Correspondent*

**1. The Incident / Background:**
[State the exact what, when, where, and who in objective journalistic voice.]

**2. Key Developments & Evidentiary Details:**
[Factual breakdown, government responses, commissions instituted, or technical findings.]

**3. Current Status & Official Response:**
[MHA statements, judicial interventions, or standard operating procedures deployed.]

**4. Public & Policy Implications:**
[Broader security ramifications or ongoing reform measures.]`;

    case 'PRECIS':
      return `### PRÉCIS
**Title:** [Provide a crisp, analytical 3-5 word title]

[Write your condensed passage here. Remember to capture all essential arguments in your own words, using strictly about one-third of the original passage's word count.]`;

    case 'ESSAY':
    default:
      return `### ESSAY: ${title}

**Introduction:**
[Hook, historical context, constitutional backing, and problem statement.]

**Body Paragraph 1 - Core Dimensions:**
[Internal security, administrative setup, or economic underpinnings.]

**Body Paragraph 2 - Critical Challenges:**
[Technological hurdles, cross-border or inter-state friction, capacity constraints.]

**Body Paragraph 3 - Global / Comparative Precedents:**
[Best practices, Supreme Court judgments, or Law Commission / Punchhi Commission recommendations.]

**Way Forward & Conclusion:**
[Optimistic, constitution-aligned roadmap with pragmatic actionable steps.]`;
  }
}

export function countWords(text: string): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

export function checkPrecisCompliance(originalWords: number, writtenWords: number) {
  const targetWords = Math.round(originalWords / 3);
  const minAllowed = Math.round(targetWords * 0.9);
  const maxAllowed = Math.round(targetWords * 1.1);
  const isCompliant = writtenWords >= minAllowed && writtenWords <= maxAllowed;
  const percentOfOriginal = originalWords > 0 ? Math.round((writtenWords / originalWords) * 100) : 0;

  return {
    targetWords,
    minAllowed,
    maxAllowed,
    isCompliant,
    percentOfOriginal,
  };
}

export function analyzeArgumentSections(text: string) {
  const lower = text.toLowerCase();
  const hasIntro = lower.includes('intro') || lower.includes('context');
  const hasFor = lower.includes('for') || lower.includes('in favour') || lower.includes('arguments for');
  const hasAgainst = lower.includes('against') || lower.includes('counter') || lower.includes('arguments against');
  const hasConclusion = lower.includes('conclusion') || lower.includes('way forward');

  const score = (hasIntro ? 25 : 0) + (hasFor ? 25 : 0) + (hasAgainst ? 25 : 0) + (hasConclusion ? 25 : 0);

  return {
    hasIntro,
    hasFor,
    hasAgainst,
    hasConclusion,
    scaffoldScore: score,
  };
}
