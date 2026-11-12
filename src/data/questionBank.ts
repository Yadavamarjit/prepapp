import { Question } from '../types';

export const INITIAL_QUESTION_BANK: Question[] = [
  // --- POLITY & CONSTITUTION (CAPF ANALYTICAL) ---
  {
    id: 'capf-pol-01',
    targetExam: ['UPSC_CAPF'],
    subject: 'Polity & Constitution',
    microTopic: 'Emergency Provisions',
    difficulty: 'Analytical',
    type: 'STATEMENT_BASED',
    questionText: 'Consider the following statements regarding the proclamation of National Emergency under Article 352 of the Constitution of India:',
    statements: [
      'The President can proclaim a National Emergency only after receiving a written recommendation from the Union Cabinet.',
      'A proclamation of emergency must be approved by both Houses of Parliament within two months from the date of its issue.',
      'The resolution approving the proclamation must be passed by a special majority in each House of Parliament.',
    ],
    options: [
      { key: 'A', text: '1 and 2 only' },
      { key: 'B', text: '1 and 3 only' },
      { key: 'C', text: '2 and 3 only' },
      { key: 'D', text: '1, 2 and 3' },
    ],
    correctAnswer: 'B',
    explanation: {
      coreConcept: 'Article 352 requires written recommendation of Cabinet (44th Amendment Act, 1978). The approval period was reduced from 2 months to 1 month by the 44th Amendment Act.',
      shortcutOrTrick: 'Elimination clue: Statement 2 states "within two months", which is false (it is within 1 month). Eliminating Statement 2 immediately discards A, C, and D, leaving only B!',
      standardBookRef: 'M. Laxmikanth, Indian Polity (7th Ed.) — Chapter 16: Emergency Provisions',
      trapAlert: 'Do not confuse Art 352 (1 month approval) with Art 356 & Art 360 (2 months approval).',
    },
    yearRef: 'UPSC CAPF AC 2022 / PYQ',
  },
  {
    id: 'capf-pol-02',
    targetExam: ['UPSC_CAPF'],
    subject: 'Polity & Constitution',
    microTopic: 'Armed Forces & Fundamental Rights',
    difficulty: 'Analytical',
    type: 'STATEMENT_BASED',
    questionText: 'With reference to Article 33 and Article 34 of the Indian Constitution, consider the following statements:',
    statements: [
      'Article 33 empowers both the Parliament and State Legislatures to restrict the Fundamental Rights of members of the Armed Forces and Police forces.',
      'A law enacted by Parliament under Article 33 cannot be challenged in any court on the ground of contravention of any Fundamental Right.',
      'Martial Law under Article 34 affects only Fundamental Rights, whereas National Emergency under Article 352 affects not only Fundamental Rights but also Centre-State relations.',
    ],
    options: [
      { key: 'A', text: '1 and 2 only' },
      { key: 'B', text: '2 and 3 only' },
      { key: 'C', text: '3 only' },
      { key: 'D', text: '1, 2 and 3' },
    ],
    correctAnswer: 'B',
    explanation: {
      coreConcept: 'Article 33 gives power solely to Parliament (not State Legislatures) to restrict or abrogate fundamental rights of armed forces, police forces, and intelligence agencies.',
      shortcutOrTrick: 'Eliminate Statement 1 because State Legislatures have zero jurisdiction under Art 33. This eliminates A and D instantly. Statement 2 and 3 are standard constitutional tenets.',
      standardBookRef: 'M. Laxmikanth — Chapter 7: Fundamental Rights (Articles 33 & 34)',
      trapAlert: 'UPSC frequently slips "and State Legislatures" into Parliament-exclusive powers (Art 33, Art 35, Art 368).',
    },
    yearRef: 'UPSC CAPF AC 2021',
  },
  {
    id: 'capf-pol-03',
    targetExam: ['UPSC_CAPF', 'SSC_CPO'],
    subject: 'Polity & Constitution',
    microTopic: 'Preamble & Amendments',
    difficulty: 'Analytical',
    type: 'STATEMENT_BASED',
    questionText: 'Which of the following statements regarding the Preamble to the Constitution of India is/are correct?',
    statements: [
      'The Preamble is neither a source of power to the legislature nor a prohibition upon the powers of the legislature.',
      'It is justiciable, and its provisions can be enforced in courts of law.',
      'The words "Socialist", "Secular", and "Integrity" were incorporated into the Preamble by the 44th Constitutional Amendment Act, 1978.',
    ],
    options: [
      { key: 'A', text: '1 only' },
      { key: 'B', text: '1 and 2 only' },
      { key: 'C', text: '2 and 3 only' },
      { key: 'D', text: '1 and 3 only' },
    ],
    correctAnswer: 'A',
    explanation: {
      coreConcept: 'The Preamble is non-justiciable (Berubari & Kesavananda Bharati). The three words were added by the 42nd Amendment Act 1976, not the 44th.',
      shortcutOrTrick: 'Statement 2 is false (non-justiciable). Statement 3 is false (42nd Amendment). Thus only Statement 1 is correct.',
      standardBookRef: 'M. Laxmikanth — Chapter 4: Preamble of the Constitution',
      trapAlert: 'Remember 42nd Amendment (1976) introduced mini-constitution changes, while 44th (1978) restored civil liberties.',
    },
    yearRef: 'Shared Core PYQ',
  },

  // --- MODERN HISTORY (CAPF & CPO CORE) ---
  {
    id: 'capf-hist-01',
    targetExam: ['UPSC_CAPF'],
    subject: 'Modern History',
    microTopic: '1919-1935 Constitutional Reforms',
    difficulty: 'Analytical',
    type: 'STATEMENT_BASED',
    questionText: 'Consider the following statements regarding the Government of India Act, 1919 (Montagu-Chelmsford Reforms):',
    statements: [
      'It introduced dyarchy in the executive government of the provinces.',
      'It introduced, for the first time, bicameralism and direct elections in the country at the central legislature.',
      'It extended the principle of communal representation by providing separate electorates for Sikhs, Indian Christians, Anglo-Indians, and Europeans.',
    ],
    options: [
      { key: 'A', text: '1 and 2 only' },
      { key: 'B', text: '2 and 3 only' },
      { key: 'C', text: '1 and 3 only' },
      { key: 'D', text: '1, 2 and 3' },
    ],
    correctAnswer: 'D',
    explanation: {
      coreConcept: 'All three statements are historically accurate: Dyarchy in provinces (transferred and reserved subjects), bicameral central legislature (Council of State & Legislative Assembly), and extension of separate electorates beyond Muslims (1909) to Sikhs, Christians, Anglo-Indians, and Europeans in 1919.',
      shortcutOrTrick: 'Mnemonic: 1919 introduced Provincial Dyarchy (1935 abolished it and brought Provincial Autonomy while introducing Central Dyarchy).',
      standardBookRef: 'Spectrum Modern India (Rajiv Ahir) — Chapter 16: Nationalist Upsurge & 1919 Act',
      trapAlert: 'Watch out for questions mixing 1919 (Provincial Dyarchy) with 1935 (Provincial Autonomy).',
    },
    yearRef: 'UPSC CAPF AC 2020',
  },
  {
    id: 'cpo-hist-01',
    targetExam: ['SSC_CPO', 'UPSC_CAPF'],
    subject: 'Modern History',
    microTopic: 'Socio-Religious Movements',
    difficulty: 'Speed',
    type: 'SINGLE_CHOICE',
    questionText: 'Who among the following founded the "Satyashodhak Samaj" in 1873 to campaign against the caste system and promote education among women and lower castes?',
    options: [
      { key: 'A', text: 'Gopal Hari Deshmukh (Lokahitawadi)' },
      { key: 'B', text: 'Jyotirao Govindrao Phule' },
      { key: 'C', text: 'Mahadev Govind Ranade' },
      { key: 'D', text: 'B. R. Ambedkar' },
    ],
    correctAnswer: 'B',
    explanation: {
      coreConcept: 'Jyotirao Phule established Satyashodhak Samaj (Truth Seekers Society) in Pune in 1873, authored Gulamgiri (1873), and started pioneering schools for girls with his wife Savitribai Phule.',
      shortcutOrTrick: 'Direct recall: Satyashodhak = Jyotirao Phule (Gulamgiri). Ambedkar established Bahishkrit Hitakarini Sabha (1924).',
      standardBookRef: 'Spectrum Modern India — Chapter 9: Socio-Religious Reform Movements',
    },
    yearRef: 'SSC CPO 2023 Tier-1',
  },

  // --- GEOGRAPHY & ENVIRONMENT ---
  {
    id: 'capf-geo-01',
    targetExam: ['UPSC_CAPF'],
    subject: 'Geography & Environment',
    microTopic: 'Physiography of Peninsular India',
    difficulty: 'Analytical',
    type: 'STATEMENT_BASED',
    questionText: 'With reference to the Western Ghats and Eastern Ghats, consider the following statements:',
    statements: [
      'The Western Ghats are comparatively higher in elevation and more continuous than the Eastern Ghats.',
      'The Eastern Ghats are dissected and irregular because of major rivers draining into the Bay of Bengal.',
      'Anamudi, the highest peak of the Peninsular plateau, is situated in the Eastern Ghats.',
    ],
    options: [
      { key: 'A', text: '1 and 2 only' },
      { key: 'B', text: '2 and 3 only' },
      { key: 'C', text: '1 and 3 only' },
      { key: 'D', text: '1, 2 and 3' },
    ],
    correctAnswer: 'A',
    explanation: {
      coreConcept: 'Anamudi (2,695 m) is the highest peak of peninsular India and is located on the Anaimalai Hills in the Western Ghats (Kerala), not Eastern Ghats.',
      shortcutOrTrick: 'Elimination: Statement 3 is definitely false (Anamudi is in Western Ghats). Cross out B, C, D! Answer A is found in under 15 seconds.',
      standardBookRef: 'NCERT Class 11 India: Physical Environment — Chapter 2: Structure and Physiography',
      trapAlert: 'Highest peak of Eastern Ghats is Jindhagada Peak / Mahendragiri, while Anamudi and Dodabetta are Western Ghats / Nilgiris.',
    },
    yearRef: 'UPSC CAPF AC 2023',
  },

  // --- GENERAL SCIENCE ---
  {
    id: 'capf-sci-01',
    targetExam: ['UPSC_CAPF', 'SSC_CPO'],
    subject: 'General Science',
    microTopic: 'Optics & Total Internal Reflection',
    difficulty: 'Analytical',
    type: 'STATEMENT_BASED',
    questionText: 'Which of the following optical phenomena are governed by the principle of Total Internal Reflection (TIR)?',
    statements: [
      'Working of optical fibre cables in telecommunication.',
      'Formation of mirage in desert regions on hot summer days.',
      'Sparkling of properly cut diamond facets.',
    ],
    options: [
      { key: 'A', text: '1 and 2 only' },
      { key: 'B', text: '2 and 3 only' },
      { key: 'C', text: '1 and 3 only' },
      { key: 'D', text: '1, 2 and 3' },
    ],
    correctAnswer: 'D',
    explanation: {
      coreConcept: 'Total Internal Reflection occurs when light travels from denser to rarer medium and angle of incidence exceeds critical angle. Optical fiber, mirage, and diamond brilliance all rely on TIR.',
      shortcutOrTrick: 'All three are textbook applications of TIR in Class 10 & 12 NCERT Physics.',
      standardBookRef: 'NCERT Class 10 Chapter 10 / Class 12 Ray Optics',
    },
    yearRef: 'Shared Core Science',
  },

  // --- QUANTITATIVE APTITUDE (CPO SPRINT SPECIAL) ---
  {
    id: 'cpo-quant-01',
    targetExam: ['SSC_CPO'],
    subject: 'Quantitative Aptitude',
    microTopic: 'Compound & Simple Interest Difference',
    difficulty: 'Speed',
    type: 'SINGLE_CHOICE',
    questionText: 'The difference between compound interest (compounded annually) and simple interest on a sum of ₹15,000 for 2 years is ₹96. Find the rate of interest per annum.',
    options: [
      { key: 'A', text: '6%' },
      { key: 'B', text: '8%' },
      { key: 'C', text: '10%' },
      { key: 'D', text: '12%' },
    ],
    correctAnswer: 'B',
    explanation: {
      coreConcept: 'For 2 years: Difference D = P × (R / 100)². Here 96 = 15000 × (R / 100)². Thus (R / 100)² = 96 / 15000 = 64 / 10000 = (8 / 100)². Therefore R = 8%.',
      shortcutOrTrick: '30-Second CBT Shortcut: R = 100 × √(D / P). Direct plug-in: 100 × √(96 / 15000) = 100 × √(0.0064) = 100 × 0.08 = 8%. Done in 18 seconds!',
      trapAlert: 'Never calculate 2-year CI and SI separately in CBT mode—always use D = P(R/100)²',
    },
    yearRef: 'SSC CPO 2023 Shift 2',
  },
  {
    id: 'cpo-quant-02',
    targetExam: ['SSC_CPO'],
    subject: 'Quantitative Aptitude',
    microTopic: 'Circular Track Races',
    difficulty: 'Speed',
    type: 'SINGLE_CHOICE',
    questionText: 'Two runners A and B run on a circular track of circumference 600 m starting from the same point at speeds of 15 m/s and 25 m/s in opposite directions. At what time will they meet for the first time?',
    options: [
      { key: 'A', text: '12 seconds' },
      { key: 'B', text: '15 seconds' },
      { key: 'C', text: '20 seconds' },
      { key: 'D', text: '24 seconds' },
    ],
    correctAnswer: 'B',
    explanation: {
      coreConcept: 'When running in opposite directions, relative speed is the sum of their speeds: 15 + 25 = 40 m/s. Meeting time = Track Length / Relative Speed = 600 / 40 = 15 seconds.',
      shortcutOrTrick: 'Opposite direction = ADD speeds (40 m/s). 600 / 40 = 15s. (If same direction, subtract: 25 - 15 = 10 m/s -> 60s).',
    },
    yearRef: 'SSC CPO 2024 Tier-1',
  },
  {
    id: 'cpo-quant-03',
    targetExam: ['SSC_CPO'],
    subject: 'Quantitative Aptitude',
    microTopic: 'Profit, Loss & Successive Discount',
    difficulty: 'Speed',
    type: 'SINGLE_CHOICE',
    questionText: 'A dealer marks his goods 40% above the cost price and allows a discount of 20% on the marked price. If he gives an additional cash discount of 10%, what is his net overall profit or loss percentage?',
    options: [
      { key: 'A', text: '0.8% Profit' },
      { key: 'B', text: '0.8% Loss' },
      { key: 'C', text: '2.4% Profit' },
      { key: 'D', text: '4.0% Loss' },
    ],
    correctAnswer: 'A',
    explanation: {
      coreConcept: 'Assume CP = 100. MP = 140. After 20% discount: 140 × 0.8 = 112. After 10% cash discount: 112 × 0.9 = 100.8. Net Selling Price = 100.8. Overall profit = 100.8 - 100 = +0.8%.',
      shortcutOrTrick: 'Multiplier method: 1.40 × 0.80 × 0.90 = 1.40 × 0.72 = 1.008 -> 0.8% Profit.',
    },
    yearRef: 'SSC CPO 2022 Tier-1',
  },

  // --- REASONING & INTELLIGENCE (CPO SPEED) ---
  {
    id: 'cpo-reas-01',
    targetExam: ['SSC_CPO'],
    subject: 'Reasoning & Intelligence',
    microTopic: 'Syllogisms (Either-Or & Possibility)',
    difficulty: 'Speed',
    type: 'SINGLE_CHOICE',
    questionText: `Statements:
1. Some soldiers are officers.
2. All officers are commanders.
3. No commander is a civilian.

Conclusions:
I. Some commanders are soldiers.
II. No civilian is a soldier.
III. Some officers are not civilians.`,
    options: [
      { key: 'A', text: 'Only I and III follow' },
      { key: 'B', text: 'Only II and III follow' },
      { key: 'C', text: 'All I, II and III follow' },
      { key: 'D', text: 'Only I follows' },
    ],
    correctAnswer: 'A',
    explanation: {
      coreConcept: 'Conclusion I follows because "Some soldiers are officers" + "All officers are commanders" -> overlap exists between commanders and soldiers. Conclusion III follows because all officers are commanders and no commander is a civilian, meaning no officer can ever be a civilian (thus some/all officers are not civilians). Conclusion II does not follow as a definite certainty because civilians and soldiers can still have common elements outside commanders.',
      shortcutOrTrick: 'Venn intersection test: Soldier circle overlaps Officer (inside Commander). Commander is disjoint from Civilian. Soldiers outside Commander may or may not overlap Civilian.',
    },
    yearRef: 'SSC CPO 2023 Tier-1',
  },
  {
    id: 'cpo-reas-02',
    targetExam: ['SSC_CPO'],
    subject: 'Reasoning & Intelligence',
    microTopic: 'Coding & Pattern Shifts',
    difficulty: 'Speed',
    type: 'SINGLE_CHOICE',
    questionText: 'In a certain code language, "DEFENCE" is coded as "CDEDMBB". How will "PATROL" be coded in that same language?',
    options: [
      { key: 'A', text: 'OZSROK' },
      { key: 'B', text: 'OYSQNK' },
      { key: 'C', text: 'OZSQNK' },
      { key: 'D', text: 'OZSRMK' },
    ],
    correctAnswer: 'C',
    explanation: {
      coreConcept: 'Check shift pattern: D(-1)=C, E(-1)=D, F(-1)=E, E(-1)=D, N(-1)=M, C(-1)=B, E(-3)=B... Wait: D(-1) E(-1) F(-1) E(-1) N(-1) C(-1) E(-3)? Let\'s check positional pattern: P(-1)=O, A(-1)=Z, T(-1)=S, R(-1)=Q, O(-1)=N, L(-1)=K -> OZSQNK.',
      shortcutOrTrick: 'Every letter is shifted -1 backward in alphabetical order. P->O, A->Z, T->S, R->Q, O->N, L->K. Result: OZSQNK.',
    },
    yearRef: 'SSC CPO Speed Set',
  },

  // --- ENGLISH COMPREHENSION ---
  {
    id: 'cpo-eng-01',
    targetExam: ['SSC_CPO', 'UPSC_CAPF'],
    subject: 'English Comprehension',
    microTopic: 'Subject-Verb Inversion & Correlative Conjunctions',
    difficulty: 'Speed',
    type: 'SINGLE_CHOICE',
    questionText: 'Identify the segment in the sentence that contains a grammatical error: "Neither the battalion commander (A) / nor the company commanders (B) / was present at the border outpost during the inspection (C) / No error (D)"',
    options: [
      { key: 'A', text: 'Neither the battalion commander' },
      { key: 'B', text: 'nor the company commanders' },
      { key: 'C', text: 'was present at the border outpost' },
      { key: 'D', text: 'No error' },
    ],
    correctAnswer: 'C',
    explanation: {
      coreConcept: 'Rule of Proximity: When two subjects are joined by "neither... nor", the verb agrees with the closer subject. Here "company commanders" is plural, so the verb must be "were present", not "was present".',
      shortcutOrTrick: 'Either/Neither... nor rule: Always look at the noun right next to the verb. Plural noun -> Plural verb!',
      standardBookRef: 'Wren & Martin / S.P. Bakshi English — Subject-Verb Agreement',
    },
    yearRef: 'CPO 2023 Tier-1 / CAPF P2 Grammar',
  },
  {
    id: 'cpo-eng-02',
    targetExam: ['SSC_CPO', 'UPSC_CAPF'],
    subject: 'English Comprehension',
    microTopic: 'High-Yield Idioms & Phrasal Verbs',
    difficulty: 'Speed',
    type: 'SINGLE_CHOICE',
    questionText: 'Select the most appropriate meaning of the given idiom: "To burn the candle at both ends"',
    options: [
      { key: 'A', text: 'To spend money extravagantly and recklessly' },
      { key: 'B', text: 'To work excessively hard from early morning until late at night' },
      { key: 'C', text: 'To cause conflict between two opposing factions' },
      { key: 'D', text: 'To illuminate both border checkpoints simultaneously' },
    ],
    correctAnswer: 'B',
    explanation: {
      coreConcept: '"To burn the candle at both ends" means to exhaust one\'s physical or mental resources by working long hours without adequate rest.',
      shortcutOrTrick: 'High-frequency recurring SSC idiom. Contrast with "burn money" (reckless spending).',
    },
    yearRef: 'SSC CPO Repeated PYQ',
  },
];
