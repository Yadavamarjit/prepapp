import { LearningChapter } from '../types';

export const LEARNING_CHAPTERS: LearningChapter[] = [
  // -------------------------------------------------------------
  // 1. POLITY & CONSTITUTION
  // -------------------------------------------------------------
  {
    id: 'pol-chap-1',
    subject: 'Polity & Constitution',
    ncertBook: 'NCERT Class 11: Indian Constitution at Work (Ch. 1 & 8)',
    chapterNumber: 1,
    chapterTitle: 'Constitution: Why & How, Historical Acts & Constituent Assembly',
    readTimeMinutes: 18,
    examRelevance: ['UPSC_CAPF', 'SSC_CPO'],
    weightage: 'Very High',
    coreConcepts: [
      'Constituent Assembly composition & Cabinet Mission Plan 1946',
      'Historical Evolution: 1773 Regulating Act, 1858 Crown Rule, 1935 GOI Act',
      'Dr. B.R. Ambedkar & Drafting Committee roles',
      'Sources borrowed: Parliamentary from UK, Fundamental Rights from USA, DPSP from Ireland',
    ],
    summaryOverview:
      'The Indian Constitution is not an overnight creation; it was deliberated over 2 years, 11 months, and 18 days by the Constituent Assembly. It synthesizes democratic universal adult suffrage with rigorous federal and unitary balances suited for India’s diversity.',
    sections: [
      {
        heading: '1. Why Do We Need a Constitution? (NCERT Foundational Thesis)',
        content:
          'A Constitution provides the primary set of basic rules that allow for minimal coordination among members of a society. Furthermore, it specifies who has the power to make decisions in society and decides how the government will be constituted. Most importantly, it sets limits on what a government can impose on its citizens through non-derogable Fundamental Rights.',
        keyTakeaway:
          'Constitutionalism means limited government: sovereignty belongs to the people, exercised within constitutional boundaries.',
      },
      {
        heading: '2. The Constituent Assembly (Genesis & Working)',
        content:
          'Drafted based on the Cabinet Mission Plan of 1946. Total initial strength was 389 (reduced to 299 after Partition). First meeting occurred on 9 December 1946 with Dr. Sachchidananda Sinha as interim President, followed by Dr. Rajendra Prasad elected as permanent President. On 13 December 1946, Jawaharlal Nehru moved the historic "Objectives Resolution", which subsequently became the philosophical beacon for the Preamble.',
        tableData: {
          headers: ['Committee', 'Chairman', 'Key Mandate'],
          rows: [
            ['Drafting Committee', 'Dr. B.R. Ambedkar', 'Drafted the primary text (7 members)'],
            ['Union Powers Committee', 'Jawaharlal Nehru', 'Federal vs central list demarcation'],
            ['Provincial Constitution', 'Sardar Vallabhbhai Patel', 'Integration of princely states'],
            ['Fundamental Rights Sub-Com.', 'J.B. Kripalani', 'Justiciable fundamental rights formulation'],
          ],
        },
      },
      {
        heading: '3. Structural Borrowings from World Constitutions',
        content:
          'The Indian Constitution is termed an "Eclectic Document" because the framers ransacked world constitutions to adopt proven mechanisms while adjusting them for Indian conditions. Over 60% of administrative provisions stem directly from the Government of India Act 1935 (Federal Scheme, Office of Governor, Judiciary, Public Service Commissions).',
        bulletPoints: [
          'UK: Parliamentary form, Rule of Law, Single Citizenship, Bicameralism, Cabinet system.',
          'USA: Fundamental Rights, Independence of Judiciary, Judicial Review, Impeachment of President.',
          'Ireland (Irish Constitution): Directive Principles of State Policy (DPSP), Nomination of Rajya Sabha members.',
          'Canada: Federation with a strong Centre, Residuary powers to Centre (Art 248), Advisory jurisdiction of SC (Art 143).',
          'Australia: Concurrent List (Seventh Schedule), Freedom of Trade and Commerce, Joint Sitting of Parliament (Art 108).',
          'Germany (Weimar): Suspension of Fundamental Rights during National Emergency.',
          'USSR: Fundamental Duties (Art 51A), Ideals of Justice (Social, Economic, Political in Preamble).',
        ],
      },
    ],
    upscCapfAnalyticalAngle:
      'In CAPF Paper 1, question setters frequently test whether the Constituent Assembly was directly elected (FALSE: it was indirectly elected by provincial assemblies via single transferable vote). In Paper 2 essays, use the "Constitutional Morality" concept (Dr. Ambedkar) to argue for institutional integrity over raw executive discretion.',
    sscCpoSpeedShortcut:
      'CPO Flash Fact: Time taken = 2 yrs 11 mos 18 days. Enacted on 26 Nov 1949 (Constitution Day); fully commenced on 26 Jan 1950 (commemorating 1930 Purna Swaraj Day). Drafting Committee had 7 members.',
    examinerTraps: [
      'Claiming the Constituent Assembly was elected on Universal Adult Suffrage (Trap: Suffrage was limited by property, tax, and education under the 1935 Act).',
      'Confusing the Joint Sitting origin (Australia) with Parliamentary System origin (UK).',
    ],
    highYieldMnemonics: [
      'Mnemonic for Borrowed Rights & Judicial Review: "US-JUDGE-RIGHTS" (USA = Judicial Review + Fundamental Rights).',
      'Mnemonic for DPSP: "IRISH-PRINCIPLES" (Ireland = Directive Principles).',
    ],
    comprehensionQuiz: [
      {
        question: 'Who moved the historic "Objectives Resolution" in the Constituent Assembly on December 13, 1946?',
        options: ['Dr. B.R. Ambedkar', 'Jawaharlal Nehru', 'Sardar Vallabhbhai Patel', 'Dr. Rajendra Prasad'],
        correctIndex: 1,
        explanation: 'Jawaharlal Nehru moved the Objectives Resolution on 13 December 1946, which later became the foundation of the Preamble.',
      },
      {
        question: 'Which of the following constitutional features was borrowed from the Weimar Constitution of Germany?',
        options: [
          'Advisory Jurisdiction of Supreme Court',
          'Suspension of Fundamental Rights during Emergency',
          'Joint Sitting of the two Houses of Parliament',
          'Directive Principles of State Policy',
        ],
        correctIndex: 1,
        explanation: 'The mechanism for the suspension of Fundamental Rights during a National Emergency was borrowed from Germany (Weimar).',
      },
    ],
  },

  {
    id: 'pol-chap-2',
    subject: 'Polity & Constitution',
    ncertBook: 'NCERT Class 11: Indian Constitution at Work (Ch. 2) & Laxmikanth Ch. 7',
    chapterNumber: 2,
    chapterTitle: 'Fundamental Rights (Articles 12-35) & Armed Forces Special Powers (Articles 33-35)',
    readTimeMinutes: 24,
    examRelevance: ['UPSC_CAPF', 'SSC_CPO'],
    weightage: 'Very High',
    coreConcepts: [
      'Definition of State (Article 12) & Laws Inconsistent with FRs (Article 13)',
      'Right to Equality (Articles 14-18) & Right to Freedom (Articles 19-22)',
      'Article 21: Protection of Life, Personal Liberty & the Maneka Gandhi Test',
      'Constitutional Remedies & 5 Writs (Article 32)',
      'Article 33: Restriction of FRs for Armed & Police Forces (CAPF Core Mandate)',
      'Article 34: Martial Law vs National Emergency & Indemnity Acts',
    ],
    summaryOverview:
      'Part III (Articles 12-35) forms the "Magna Carta of India". While rights are guaranteed against arbitrary state action, Article 33 gives Parliament exclusive power to restrict rights for armed forces and CAPFs to maintain discipline, and Article 34 indemnifies acts during Martial Law.',
    sections: [
      {
        heading: '1. The Six Broad Categories of Fundamental Rights',
        content:
          'Originally 7 rights; Right to Property (Article 31) was deleted by the 44th Amendment Act 1978 and made a legal right under Article 300A in Part XII.',
        tableData: {
          headers: ['Right Category', 'Articles', 'Salient Protective Scope'],
          rows: [
            ['Right to Equality', 'Art 14–18', 'Rule of law, no discrimination, abolition of untouchability & titles'],
            ['Right to Freedom', 'Art 19–22', 'Six democratic freedoms, protection against conviction, Art 21 Life/Liberty'],
            ['Against Exploitation', 'Art 23–24', 'Prohibition of human trafficking, forced labor, & child labor in factories'],
            ['Freedom of Religion', 'Art 25–28', 'Conscience, practice, propagation; secular character of the Indian state'],
            ['Cultural & Educational', 'Art 29–30', 'Protection of language, script, culture of religious/linguistic minorities'],
            ['Constitutional Remedies', 'Art 32', 'Heart and Soul of the Constitution (Dr. Ambedkar); writ jurisdiction'],
          ],
        },
      },
      {
        heading: '2. The 5 Prerogative Writs under Article 32 & 226',
        content:
          'Article 32 is itself a Fundamental Right (Supreme Court jurisdiction), whereas Article 226 is a constitutional power (High Courts). High Courts have wider writ jurisdiction because they can issue writs for both Fundamental Rights and ordinary legal rights.',
        bulletPoints: [
          'Habeas Corpus ("To have the body of"): Against unlawful detention; applicable against both state and private individuals.',
          'Mandamus ("We command"): Directs public official/body to perform mandatory statutory duty; CANNOT be issued against President, Governor, or private entities.',
          'Prohibition ("To forbid"): Issued by higher court to lower judicial/quasi-judicial tribunal to stop exceeding jurisdiction.',
          'Certiorari ("To be certified"): Quashes order of inferior court/tribunal for excess of jurisdiction or error of law on the face of the record.',
          'Quo-Warranto ("By what authority"): Prevents unlawful usurpation of public office; can be sought by any interested person, not only the aggrieved.',
        ],
      },
      {
        heading: '3. Article 33 & 34: The Armed Forces & Security Mandate (CAPF Essential)',
        content:
          'Article 33 empowers PARLIAMENT ALONE (State Legislatures have no power) to restrict or abrogate the Fundamental Rights of members of the Armed Forces, Paramilitary Forces (BSF, CRPF, CISF, ITBP, SSB), police forces, intelligence agencies, and telecommunication systems set up for forces.',
        keyTakeaway:
          'Non-combatants (cooks, tailors, carpenters, mechanics attached to armed forces) ARE covered under Article 33 as held by the Supreme Court in Viswan v. Union of India.',
      },
    ],
    upscCapfAnalyticalAngle:
      'In CAPF Paper 1: Remember that laws passed under Article 33 cannot be challenged in any court on the ground of contravention of any Fundamental Right (e.g. BSF Act 1968, CRPF Act 1949 restrict unionization, public speech, and press interactions). In Paper 2, cite Article 33 when justifying why uniform personnel must remain apolitical.',
    sscCpoSpeedShortcut:
      'CPO Direct Rules: Untouchability abolished = Art 17. Right to Education (6-14 yrs) = Art 21A (86th Act 2002). Heart & Soul of Constitution = Art 32. Right to Property = Legal right under Art 300A (44th Act 1978).',
    examinerTraps: [
      'Assuming High Court writ jurisdiction (Art 226) is narrower than Supreme Court (Art 32) (Trap: Art 226 is WIDER because it covers both FRs and legal rights).',
      'Thinking State Legislatures can legislate on Article 33 (Trap: Parliament alone has exclusive power under Article 35).',
    ],
    highYieldMnemonics: [
      'Writs Order Mnemonic: "H-M-P-C-Q" (Habeas Corpus, Mandamus, Prohibition, Certiorari, Quo-Warranto).',
      'Articles 20 & 21 Mnemonic: "UNTOUCHABLE 20-21" (Can never be suspended even in Emergency).',
    ],
    comprehensionQuiz: [
      {
        question: 'Which constitutional writ can be issued against private individuals as well as public authorities?',
        options: ['Mandamus', 'Habeas Corpus', 'Quo-Warranto', 'Prohibition'],
        correctIndex: 1,
        explanation: 'Habeas Corpus can be issued against both public authorities and private individuals who unlawfully detain someone.',
      },
      {
        question: 'Under Article 33 of the Constitution, who possesses the exclusive power to restrict the fundamental rights of members of the Armed Forces and Police?',
        options: ['The President of India', 'Parliament alone', 'State Legislative Assemblies', 'The Supreme Court of India'],
        correctIndex: 1,
        explanation: 'Article 33 confers the power exclusively upon Parliament to restrict or abrogate the fundamental rights of armed/police forces.',
      },
    ],
  },

  {
    id: 'pol-chap-3',
    subject: 'Polity & Constitution',
    ncertBook: 'NCERT Class 11 (Ch. 6) & Laxmikanth Ch. 16',
    chapterNumber: 3,
    chapterTitle: 'Emergency Provisions (Articles 352, 356, 360) & Federal Impacts',
    readTimeMinutes: 20,
    examRelevance: ['UPSC_CAPF', 'SSC_CPO'],
    weightage: 'Very High',
    coreConcepts: [
      'National Emergency (Art 352): War, External Aggression, Armed Rebellion',
      'President’s Rule / State Emergency (Art 356 & Art 365)',
      'Financial Emergency (Art 360) - Never declared in India',
      'The 44th Constitutional Amendment Act 1978 safeguards',
      'Suspension of Article 19 (Article 358) vs Other Rights (Article 359)',
      'S.R. Bommai Landmark Judicial Guidelines',
    ],
    summaryOverview:
      'Emergency provisions in Part XVIII convert India’s federal structure into a unitary state without formal constitutional amendments. The 44th Amendment Act 1978 instituted critical checks to prevent executive abuse.',
    sections: [
      {
        heading: '1. National Emergency (Article 352)',
        content:
          'Proclaimed on 3 grounds: War, External Aggression (External Emergency), or Armed Rebellion (Internal Emergency). The 44th Amendment Act 1978 replaced "Internal Disturbance" with "Armed Rebellion" and mandated the "Written recommendation of the Union Cabinet" (not PM alone). Must be approved by both Houses of Parliament within 1 MONTH by Special Majority (majority of total membership + 2/3rd present and voting). Each extension lasts 6 months.',
        keyTakeaway:
          'Article 352 approval needs 1 month & special majority. Disapproval requires only Lok Sabha with simple majority (1/10th members can notice a session).',
      },
      {
        heading: '2. President’s Rule (Article 356 & 365)',
        content:
          'Imposed when governance cannot be carried on in accordance with the Constitution (Art 356) or when a state fails to comply with Union executive directions (Art 365). Must be approved by both Houses within 2 MONTHS by Simple Majority. Maximum period is 3 years (with Election Commission certification and National Emergency in place after 1 year).',
        tableData: {
          headers: ['Feature', 'National Emergency (Art 352)', 'President’s Rule (Art 356)', 'Financial Emergency (Art 360)'],
          rows: [
            ['Approval Time', '1 Month', '2 Months', '2 Months'],
            ['Majority Needed', 'Special Majority', 'Simple Majority', 'Simple Majority'],
            ['State Legislature', 'Continues to exist (concurrent power)', 'Suspended or Dissolved', 'Not affected'],
            ['Revocation', 'Lok Sabha alone can disapprove', 'Presidential notification anytime', 'Presidential notification'],
          ],
        },
      },
      {
        heading: '3. Fundamental Rights during Emergency (Art 358 vs 359)',
        content:
          'Article 358 automatically suspends Article 19 freedoms, BUT ONLY when emergency is proclaimed on grounds of War or External Aggression (NEVER on Armed Rebellion). Article 359 empowers the President by order to suspend the right to move courts for enforcement of specified rights, BUT Articles 20 and 21 can NEVER be suspended (44th Amendment safeguard).',
        bulletPoints: [
          'Art 358 operates automatically across the entire territory of India.',
          'Art 359 requires a specific Presidential Order and can be confined to specified parts of India.',
          'Neither Art 358 nor 359 can touch Articles 20 and 21.',
        ],
      },
    ],
    upscCapfAnalyticalAngle:
      'Classic UPSC elimination trap: Statement says "During National Emergency, the state legislative assembly is dissolved." (FALSE: State legislatures continue to exist; Parliament gains concurrent legislative power under Art 250). In President’s Rule, assembly is only suspended initially and should NOT be dissolved until Parliament approves the proclamation (S.R. Bommai case).',
    sscCpoSpeedShortcut:
      '30-Second CBT Formula: "1-Month vs 2-Months". Article 352 = 1 Month (Special Maj). Articles 356 & 360 = 2 Months (Simple Maj). Financial Emergency (Art 360) has been declared ZERO times.',
    examinerTraps: [
      'Swapping "Armed Rebellion" with "Internal Disturbance" (44th Act removed internal disturbance).',
      'Confusing Art 358 (auto-suspension of Art 19) with Art 359 (Presidential order required).',
    ],
    highYieldMnemonics: [
      'Timeline Mnemonic: "352-356-360 = 1 Month, 2 Months, 2 Months".',
      'Approval Mnemonic: "Art 352 = Special; 356 & 360 = Simple".',
    ],
    comprehensionQuiz: [
      {
        question: 'Under Article 358, the six freedoms guaranteed under Article 19 are automatically suspended ONLY when National Emergency is declared on which ground?',
        options: ['Armed Rebellion', 'War or External Aggression', 'Financial Instability', 'Internal Disturbance'],
        correctIndex: 1,
        explanation: 'Article 358 operates automatically to suspend Article 19 only on grounds of War or External Aggression (External Emergency).',
      },
    ],
  },

  // -------------------------------------------------------------
  // 2. MODERN HISTORY
  // -------------------------------------------------------------
  {
    id: 'hist-chap-1',
    subject: 'Modern History',
    ncertBook: 'NCERT Class 12: Themes in Indian History (Part III) & Spectrum Ch. 15-23',
    chapterNumber: 1,
    chapterTitle: 'Government of India Acts (1909, 1919, 1935) & Constitutional Evolution',
    readTimeMinutes: 22,
    examRelevance: ['UPSC_CAPF', 'SSC_CPO'],
    weightage: 'Very High',
    coreConcepts: [
      '1909 Morley-Minto Reforms: Separate Electorates for Muslims',
      '1919 Montagu-Chelmsford Reforms: Provincial Dyarchy & Central Bicameralism',
      'Transferred vs Reserved Subjects under 1919 Act',
      '1935 Government of India Act: Provincial Autonomy & Central Dyarchy',
      'Establishment of Federal Court (1937) and Reserve Bank of India (1935)',
    ],
    summaryOverview:
      'The British colonial administration introduced constitutional reforms in three major installments (1909, 1919, 1935) to manage rising nationalist pressure while deepening communal divisions through separate electorates.',
    sections: [
      {
        heading: '1. The 1909 Act (Morley-Minto Reforms)',
        content:
          'Formally known as the Indian Councils Act 1909. Lord Minto was the Viceroy ("Father of Communal Electorates") and John Morley was Secretary of State. Introduced separate electorates for Muslims, legalizing communalism. For the first time, an Indian was appointed to the Viceroy’s Executive Council (Satyendra Prasad Sinha, appointed as Law Member).',
        keyTakeaway:
          '1909 marked the entry of communal electorates into Indian statutory law.',
      },
      {
        heading: '2. The 1919 Act (Montagu-Chelmsford Reforms)',
        content:
          'Introduced DYARCHY in Provinces: divided provincial subjects into "Transferred" (administered by Governor with ministers responsible to the Legislative Council, e.g., education, local health) and "Reserved" (administered by Governor and his Executive Council without legislative accountability, e.g., police, finance, law & order). At the Centre, it introduced Bicameralism (Council of State and Legislative Assembly) and direct elections for the first time. Extended separate electorates to Sikhs, Indian Christians, Anglo-Indians, and Europeans.',
        tableData: {
          headers: ['Feature', '1919 Act (Montford)', '1935 Act (GOI Act)'],
          rows: [
            ['Dyarchy', 'Introduced in Provinces', 'Abolished in Provinces; Proposed at Centre'],
            ['Provincial Status', 'Dyarchy division', 'Provincial Autonomy granted'],
            ['All-India Federation', 'Not contemplated', 'Provided for (never materialized)'],
            ['Franchise Extension', 'Extended to Sikhs, Anglo-Indians', 'Extended to Women, Depressed Classes, Labor'],
          ],
        },
      },
      {
        heading: '3. The 1935 Government of India Act',
        content:
          'The longest and most comprehensive colonial statute. Provided for an All-India Federation consisting of provinces and princely states (never materialized as princely states refused to join). Abolished dyarchy in provinces and introduced Provincial Autonomy. Divided legislative powers into 3 lists: Federal List (59 items), Provincial List (54 items), and Concurrent List (36 items). Residuary powers were vested in the Viceroy. Established the Federal Court (1937), Reserve Bank of India (1935), and Federal Public Service Commission.',
        bulletPoints: [
          'Federal Court was established in Delhi (1937) with Sir Maurice Gwyer as first Chief Justice.',
          'Residuary powers were given to the Governor-General (Viceroy), unlike the current Constitution where they belong to Parliament (Art 248).',
        ],
      },
    ],
    upscCapfAnalyticalAngle:
      'In CAPF Paper 1: Note that dyarchy was abolished in PROVINCES by the 1935 Act and moved to the CENTRE (though central dyarchy never operated). In Paper 2 essays on Indian Federalism, trace the 3-fold legislative division back to the 1935 Seventh Schedule prototype.',
    sscCpoSpeedShortcut:
      'CPO Rapid Rule: Dyarchy in Provinces = 1919 Act. Dyarchy at Centre & Provincial Autonomy = 1935 Act. Communal electorates for Muslims = 1909 Act. First Indian in Executive Council = S.P. Sinha (1909).',
    examinerTraps: [
      'Confusing which Act introduced provincial dyarchy (1919) with which Act abolished it (1935).',
      'Assuming the All-India Federation actually came into force under the 1935 Act (Trap: It NEVER materialized).',
    ],
    highYieldMnemonics: [
      'Dyarchy Transition: "1919 = Province Split; 1935 = Province Free (Autonomy)".',
      'Father of Communal Electorates: "Minto = Minted Communalism (1909)".',
    ],
    comprehensionQuiz: [
      {
        question: 'Under the Government of India Act 1935, where were the residuary legislative powers vested?',
        options: ['Federal Legislature', 'Provincial Legislatures', 'Governor-General (Viceroy)', 'Federal Court'],
        correctIndex: 2,
        explanation: 'Under the 1935 Act, residuary powers were vested in the Governor-General (Viceroy) at his personal discretion.',
      },
    ],
  },

  {
    id: 'hist-chap-2',
    subject: 'Modern History',
    ncertBook: 'NCERT Class 12 (Part III) & Spectrum Ch. 25-27',
    chapterNumber: 2,
    chapterTitle: 'Subhas Chandra Bose, the INA & Military Mutinies (1942–1946)',
    readTimeMinutes: 20,
    examRelevance: ['UPSC_CAPF', 'SSC_CPO'],
    weightage: 'Very High',
    coreConcepts: [
      'Formation of the Indian National Army (INA / Azad Hind Fauj)',
      'Role of Mohan Singh, Rash Behari Bose & Subhas Chandra Bose',
      'Rani of Jhansi Women’s Combat Regiment (Captain Lakshmi Sahgal)',
      '1945 Red Fort INA Trials & Mass Public Demonstrations',
      'Royal Indian Navy (RIN) Mutiny of HMIS Talwar (Feb 1946)',
    ],
    summaryOverview:
      'The military dimension of India’s freedom struggle, spearheaded by Netaji Subhas Chandra Bose’s INA and culminated by the 1946 Royal Indian Navy and Air Force mutinies, broke the colonial reliance on the armed forces and hastened British withdrawal.',
    sections: [
      {
        heading: '1. Genesis of the Azad Hind Fauj (INA)',
        content:
          'Initially conceived in Malaya by Captain Mohan Singh with Japanese Major Iwaichi Fujiwara using Indian Prisoners of War (POWs). Rash Behari Bose organized the Indian Independence League in Tokyo (1942). In July 1943, Subhas Chandra Bose arrived in Singapore and assumed supreme leadership of the Azad Hind Fauj, delivering his famous battle cry "Chalo Delhi!" and declaring the Provisional Government of Free India (Arzi Hukumat-e-Azad Hind) on 21 October 1943.',
        keyTakeaway:
          'Netaji established the Rani of Jhansi Regiment, one of the earliest all-women combat infantry units in modern Asian military history, led by Captain Lakshmi Sahgal.',
      },
      {
        heading: '2. The Red Fort Trials (1945)',
        content:
          'The British military court staged public court-martial trials at the Red Fort in late 1945 against three INA officers: Prem Kumar Sahgal (Hindu), Gurbaksh Singh Dhillon (Sikh), and Shah Nawaz Khan (Muslim). This deliberate joint trial galvanized unprecedented pan-Indian communal unity. A heavyweight legal defense team was assembled comprising Bhulabhai Desai, Tej Bahadur Sapru, Jawaharlal Nehru, and Asaf Ali.',
        bulletPoints: [
          'Massive demonstrations erupted across Bombay, Calcutta, and Delhi shouting "Lal Qile se aayi aawaz: Sahgal, Dhillon, Shahnawaz!".',
          'Viceroy Lord Wavell was compelled to use his prerogative to remit their transportation-for-life sentences due to fears of an army-wide revolt.',
        ],
      },
      {
        heading: '3. The Royal Indian Navy (RIN) Mutiny (Feb 1946)',
        content:
          'On 18 February 1946, 1,100 naval ratings on the signal training ship HMIS Talwar in Bombay went on strike against racial discrimination, unpalatable food, and the arrest of B.C. Dutt (who wrote "Quit India" on the ship’s sides). Ratings elected M.S. Khan as President of the Naval Central Strike Committee. Mutineers hoisted the tricolor, crescent, and hammer-and-sickle flags together.',
        keyTakeaway:
          'Sardar Patel and M.A. Jinnah intervened to convince the ratings to surrender on 23 February 1946, with the famous parting statement: "We surrender to India, not to Britain."',
      },
    ],
    upscCapfAnalyticalAngle:
      'High-yield CAPF question topic: Clement Attlee later admitted that the primary factor prompting the swift 1947 British transfer of power was the erosion of loyalty within the British Indian Army and Navy post-INA trials and RIN mutiny. In Paper 2 arguments on armed forces heritage, cite the INA’s secular cohesion.',
    sscCpoSpeedShortcut:
      'CPO Flash Points: HMIS Talwar rating strike = 18 Feb 1946. First head of INA = Mohan Singh. Netaji Singapore proclamation = 21 Oct 1943. INA Defense Counsel lead = Bhulabhai Desai.',
    examinerTraps: [
      'Confusing the initial founder of INA (Mohan Singh) with its subsequent supreme revitalizer (Subhas Chandra Bose).',
      'Claiming Mahatma Gandhi or Nehru represented the ratings at surrender (Trap: Sardar Vallabhbhai Patel convinced them to surrender).',
    ],
    highYieldMnemonics: [
      'Trial Trio: "S-D-S" (Sahgal, Dhillon, Shah Nawaz).',
      'Signal Ship: "TALWAR = The Sword that cut the Navy ties".',
    ],
    comprehensionQuiz: [
      {
        question: 'Who was the lead counsel in the joint defense of the INA officers at the Red Fort Trials in 1945?',
        options: ['Jawaharlal Nehru', 'Bhulabhai Desai', 'Tej Bahadur Sapru', 'Sardar Patel'],
        correctIndex: 1,
        explanation: 'Bhulabhai Desai served as the chief and lead defense counsel in the historic 1945 Red Fort court-martial trials.',
      },
    ],
  },

  // -------------------------------------------------------------
  // 3. GEOGRAPHY & ENVIRONMENT
  // -------------------------------------------------------------
  {
    id: 'geo-chap-1',
    subject: 'Geography & Environment',
    ncertBook: 'NCERT Class 11: India - Physical Environment (Ch. 2) & MHA Border Geography',
    chapterNumber: 1,
    chapterTitle: 'Border Geography of India & CAPF Security Operational Mandates',
    readTimeMinutes: 24,
    examRelevance: ['UPSC_CAPF', 'SSC_CPO'],
    weightage: 'Very High',
    coreConcepts: [
      'Land Frontiers: 15,106.7 km border shared with 7 neighboring countries',
      'The "One Border, One Force" doctrine established by the Kargil Review Committee',
      'Border Security Force (BSF): Pakistan & Bangladesh borders',
      'Indo-Tibetan Border Police (ITBP): Indo-China LAC',
      'Sashastra Seema Bal (SSB): Indo-Nepal & Indo-Bhutan friendly frontiers',
      'Assam Rifles: Indo-Myanmar border & anti-insurgency',
      'Strategic Corridors: Siliguri Corridor ("Chicken’s Neck"), Sir Creek, Kalapani, Doklam',
    ],
    summaryOverview:
      'Border management in India is partitioned among specialized Central Armed Police Forces under the Ministry of Home Affairs according to the "One Border, One Force" principle. Understanding frontier terrain, international boundary lines, and force jurisdictions is indispensable for both CAPF and CPO.',
    sections: [
      {
        heading: '1. Land Boundaries of India by Length & Demarcation',
        content:
          'India shares 15,106.7 km of land borders with 7 nations. Bangladesh shares the longest land border, followed by China, Pakistan, Nepal, Myanmar, Bhutan, and Afghanistan.',
        tableData: {
          headers: ['Neighboring Country', 'Border Length', 'Guarding Force (CAPF)', 'Boundary Line Name'],
          rows: [
            ['Bangladesh', '4,096.7 km', 'Border Security Force (BSF)', 'Radcliffe Line (Zero Line)'],
            ['China', '3,488 km', 'Indo-Tibetan Border Police (ITBP)', 'Line of Actual Control (LAC) / McMahon Line'],
            ['Pakistan', '3,323 km', 'Border Security Force (BSF)', 'Radcliffe Line / Line of Control (LoC)'],
            ['Nepal', '1,751 km', 'Sashastra Seema Bal (SSB)', 'Open & Friendly Frontier (Peace Treaty 1950)'],
            ['Myanmar', '1,643 km', 'Assam Rifles', 'Indo-Myanmar Border (Free Movement Regime)'],
            ['Bhutan', '699 km', 'Sashastra Seema Bal (SSB)', 'Open & Friendly Himalayan Frontier'],
            ['Afghanistan', '106 km', 'Under Pakistani illegal occupation (PoK)', 'Durand Line (1896)'],
          ],
        },
      },
      {
        heading: '2. The "One Border, One Force" Doctrine',
        content:
          'Post-Kargil War (1999), the Group of Ministers (GoM) recommended that to eliminate overlapping command structures, every international border must be allocated exclusively to a dedicated central border-guarding force.',
        bulletPoints: [
          'BSF (Estd. 1965 after Indo-Pak War; K.F. Rustamji founding DG): Guarding Western frontier (Thar Desert, Rann of Kutch, Punjab plains, J&K International Border) and Eastern frontier (Sundarbans riverine, Bengal, Tripura, Meghalaya, Assam).',
          'ITBP (Estd. 24 Oct 1962 during Sino-Indian War): High-altitude mountain force guarding Karakoram Pass (Ladakh) to Jachep La (Arunachal Pradesh) at altitudes ranging from 9,000 to 18,700 ft.',
          'SSB (Estd. 1963 as Special Service Bureau, designated border force 2001): Mandated to guard peaceful frontiers of Nepal and Bhutan while promoting border citizen affinity.',
          'Assam Rifles (Estd. 1835 as Cachar Levy): The oldest paramilitary force in India, dual control (administrative under MHA, operational under Indian Army).',
        ],
      },
      {
        heading: '3. Strategic Geographic Chokepoints',
        content:
          'Candidates must master India’s sensitive geopolitical flashpoints: The Siliguri Corridor (a 20-22 km narrow strip in West Bengal connecting Mainland India to 8 Northeast States); Sir Creek (a 96-km tidal estuary in Rann of Kutch marshlands disputed by Pakistan); Doklam Plateau (trijunction of India, Bhutan, and China); and Lipulekh Pass (Uttarakhand trijunction border with Tibet and Nepal).',
        keyTakeaway:
          'Ten Degree Channel separates the Andaman Islands from the Nicobar Islands. Duncan Passage separates South Andaman from Little Andaman.',
      },
    ],
    upscCapfAnalyticalAngle:
      'Direct Paper 1 staple: Border length ranking (Trick: "Bachpan = B-Ch-P-N" -> Bangladesh > China > Pakistan > Nepal). In Paper 2 reports and security arguments, discuss the Comprehensive Integrated Border Management System (CIBMS) and smart fencing along riverine stretches.',
    sscCpoSpeedShortcut:
      'CPO Flash Facts: Longest border = Bangladesh (4,096.7 km). Shortest border = Afghanistan (106 km). ITBP founded = 1962. BSF founded = 1965. Oldest force = Assam Rifles (1835).',
    examinerTraps: [
      'Assuming China has the longest border with India (Trap: Bangladesh is significantly longer due to its undulating riverine boundary).',
      'Confusing which force guards Indo-Myanmar border (It is Assam Rifles, NOT BSF).',
    ],
    highYieldMnemonics: [
      'Border Length Decreasing Order: "BA-CH-PA-N MEIN M-B-A" (Bangladesh, China, Pakistan, Nepal, Myanmar, Bhutan, Afghanistan).',
      'Islands Separation: "10 Degree = Andaman from Nicobar".',
    ],
    comprehensionQuiz: [
      {
        question: 'Which Central Armed Police Force is deployed along the friendly borders of India with Nepal and Bhutan?',
        options: ['Border Security Force (BSF)', 'Indo-Tibetan Border Police (ITBP)', 'Sashastra Seema Bal (SSB)', 'Central Reserve Police Force (CRPF)'],
        correctIndex: 2,
        explanation: 'Sashastra Seema Bal (SSB) is mandated to guard the international borders of India with Nepal (1,751 km) and Bhutan (699 km).',
      },
      {
        question: 'Which narrow geographic strip connects mainland India to the Northeastern states?',
        options: ['Duncan Passage', 'Sir Creek Corridor', 'Siliguri Corridor', 'Palk Strait'],
        correctIndex: 2,
        explanation: 'The Siliguri Corridor (also known as the "Chicken’s Neck") in West Bengal connects mainland India to the 8 Northeastern states.',
      },
    ],
  },

  // -------------------------------------------------------------
  // 4. QUANTITATIVE APTITUDE
  // -------------------------------------------------------------
  {
    id: 'quant-chap-1',
    subject: 'Quantitative Aptitude',
    ncertBook: 'High-Speed Quantitative Handbook for SSC CPO & CAPF P1',
    chapterNumber: 1,
    chapterTitle: 'Compound vs Simple Interest: Derivations & 30-Second Delta Shortcuts',
    readTimeMinutes: 20,
    examRelevance: ['SSC_CPO', 'UPSC_CAPF'],
    weightage: 'Very High',
    coreConcepts: [
      'Fundamental difference: Simple Interest is linear, Compound Interest is exponential',
      'The 2-Year Difference Formula: D = P * (R/100)^2',
      'The 3-Year Difference Formula: D = P * (R/100)^2 * (3 + R/100)',
      'Compounding periods: Half-Yearly (R/2, Time*2) & Quarterly (R/4, Time*4)',
      'Effective Annual Rate (Successive Percentage formula: a + b + ab/100)',
    ],
    summaryOverview:
      'In SSC CPO (50 Quant questions) and CAPF Paper 1, CI and SI problems are guaranteed high-weightage questions. Traditional long-division formulas take 3 minutes; utilizing the difference formula and fractional multipliers solves them in 25–40 seconds.',
    sections: [
      {
        heading: '1. The Core 2-Year Difference Shortcut',
        content:
          'When the difference between Compound Interest and Simple Interest for 2 years at an annual rate R% on principal P is given, bypass calculating SI and CI separately. Use the exact delta equation:',
        tableData: {
          headers: ['Duration', 'Shortcut Formula', 'Application Example'],
          rows: [
            ['2 Years', 'D = P × (R / 100)²', 'If P = ₹10,000, R = 10%, D = 10,000 × (10/100)² = ₹100'],
            ['3 Years', 'D = P × (R / 100)² × (3 + R / 100)', 'If P = ₹10,000, R = 10%, D = 100 × (3 + 0.10) = ₹310'],
          ],
        },
        keyTakeaway:
          'For 2 years, D is simply the interest on the first year’s simple interest: D = SI_1year × (R / 100).',
      },
      {
        heading: '2. The Fractional Multiplier & Successive Percent Method',
        content:
          'Convert standard percentages into irreducible fractions: 5% = 1/20, 10% = 1/10, 12.5% = 1/8, 16.67% = 1/6, 20% = 1/5. If rate is 10%, the principal grows from 10 to 11 in Year 1, and 100 to 121 in Year 2. The interest in 2 years is 21 units on 100 principal (21% effective rate).',
        bulletPoints: [
          'Effective CI rate for 2 years at R%: E = 2R + (R² / 100)%.',
          'Example: For R = 8%, SI in 2 yrs = 16%. CI in 2 yrs = 2(8) + 64/100 = 16.64%. The difference is exactly 0.64% of P.',
          'Half-Yearly Compounding: Always halve the rate (R/2) and double the compounding periods (2T).',
        ],
      },
    ],
    upscCapfAnalyticalAngle:
      'In CAPF Paper 1, question setters like word problems where money doubles in N years under compound interest and asks when it will become 8 times. Shortcut rule: If P becomes 2P in N years, it becomes 2^k * P in k * N years. To become 8 times (2^3), it takes 3 * N years.',
    sscCpoSpeedShortcut:
      'CPO Rapid Trick: If a sum doubles in 4 years under CI, it becomes 8 times (2³) in 4 × 3 = 12 years. Under SI, it becomes 8 times (adding 7P) in 4 × 7 = 28 years!',
    examinerTraps: [
      'Forgetting to double the time when compounding is half-yearly (e.g. 1.5 years becomes 3 periods).',
      'Confusing CI doubling time with SI doubling time.',
    ],
    highYieldMnemonics: [
      '2-Yr Delta: "Delta = Principal times Rate-squared over Ten-Thousand".',
      '3-Yr Delta: "2-Yr Delta times (3 + R/100)".',
    ],
    comprehensionQuiz: [
      {
        question: 'If the difference between CI and SI on a certain sum of money for 2 years at 5% per annum is ₹25, what is the principal?',
        options: ['₹5,000', '₹10,000', '₹12,000', '₹15,000'],
        correctIndex: 1,
        explanation: 'D = P(R/100)². 25 = P(5/100)² = P(1/400). P = 25 × 400 = ₹10,000.',
      },
    ],
  },

  // -------------------------------------------------------------
  // 5. REASONING & GENERAL INTELLIGENCE
  // -------------------------------------------------------------
  {
    id: 'reas-chap-1',
    subject: 'Reasoning & Intelligence',
    ncertBook: 'Master Deductive Logic & Pattern Recognition for SSC CPO',
    chapterNumber: 1,
    chapterTitle: 'Syllogisms: Venn Diagrams, Either-Or Cases & Possibility Rules',
    readTimeMinutes: 16,
    examRelevance: ['SSC_CPO', 'UPSC_CAPF'],
    weightage: 'High',
    coreConcepts: [
      'The 4 Classical Propositions: A (All), E (No), I (Some), O (Some Not)',
      'The 3 Strict Conditions for "Either-Or" Complimentary Pairs',
      'Possibility Statements vs Definite Deductions',
      'Modern qualifiers: "Only a few" vs "Few" vs "At least some"',
    ],
    summaryOverview:
      'Syllogism questions test deductive validity, not empirical truth. Aspirants must master standard Venn overlaps and the precise conditions that trigger an "Either I or II follows" complementary answer.',
    sections: [
      {
        heading: '1. The 3 Golden Rules for "Either-Or" Pairs',
        content:
          'When two individual conclusions are individually FALSE (or indeterminate in a definite sense), they form an "Either-Or" pair ONLY if all three conditions are satisfied:',
        bulletPoints: [
          'Condition 1: Both conclusions must have the EXACT SAME subject and predicate.',
          'Condition 2: Both conclusions must be individually INDETERMINATE (neither definitively true nor false on its own).',
          'Condition 3: One conclusion must be positive and the other negative. Permissible pairs are: (Some + No) or (All + Some Not). Note: (All + No) NEVER forms an Either-Or pair!',
        ],
        keyTakeaway:
          '(All + No) is NOT a complementary pair because both can be false simultaneously.',
      },
      {
        heading: '2. Handling "Only a Few" in Modern Examinations',
        content:
          'The statement "Only a few A are B" contains TWO hidden truths: 1. "Some A are B" AND 2. "Some A are NOT B". Therefore, a conclusion stating "All A can be B" is strictly FALSE.',
      },
    ],
    upscCapfAnalyticalAngle:
      'CAPF P1 frequently uses multi-statement syllogisms with 3 premises. Always draw the minimal Venn diagram (the diagram with the least possible overlaps) to test whether a conclusion is universally valid.',
    sscCpoSpeedShortcut:
      'CPO 15-second Rule: If all premises are POSITIVE ("All", "Some"), no negative conclusion ("No", "Some not") can ever be definitely true!',
    examinerTraps: [
      'Treating (All + No) as an Either-Or pair (It is NOT an Either-Or pair).',
      'Assuming "Only a few" means "All" (It implies "Some are not").',
    ],
    highYieldMnemonics: [
      'Positive-Positive Rule: "Positive Premises = Positive Conclusions Only".',
      'Either-Or Law: "Same Elements + Both Doubtful + (Some + No) or (All + Some Not)".',
    ],
    comprehensionQuiz: [
      {
        question: 'Which of the following pairs of statements CANNOT form an "Either-Or" complementary pair in syllogisms?',
        options: ['Some A are B and No A is B', 'All A are B and Some A are not B', 'All A are B and No A is B', 'Some A are B and Some A are not B'],
        correctIndex: 2,
        explanation: 'All A are B and No A is B cannot form an Either-Or pair because both can be false at the same time.',
      },
    ],
  },

  // -------------------------------------------------------------
  // 6. PAPER 2 SUBJECTIVE WRITING ACADEMY
  // -------------------------------------------------------------
  {
    id: 'p2-chap-1',
    subject: 'Paper 2 (Subjective)',
    ncertBook: 'UPSC CAPF Paper 2 Official Rubrics & Descriptive Writing Framework',
    chapterNumber: 1,
    chapterTitle: 'Counter-Argument Architecture (40 Marks): For, Against & Way Forward',
    readTimeMinutes: 20,
    examRelevance: ['UPSC_CAPF'],
    weightage: 'Very High',
    coreConcepts: [
      'UPSC Question Format: "Write arguments for and against the statement" (2 questions × 20M = 40M)',
      'The 3-Part Architecture: Introduction -> Arguments FOR -> Arguments AGAINST -> Balanced Conclusion',
      'Eliminating emotional, partisan, or colloquial language in favor of administrative tone',
      'Substantiating every point with constitutional articles, committees, or economic data',
      'Time management: 15–18 minutes per 20-mark argument',
    ],
    summaryOverview:
      'Counter-argument writing tests an aspiring Assistant Commandant’s cognitive objectivity. Evaluators strictly penalize candidates who take a one-sided, polemical stance. A high-scoring answer presents equal evidentiary rigor for both sides before delivering a pragmatic administrative synthesis.',
    sections: [
      {
        heading: '1. The Standard 3-Part Structural Blueprint',
        content:
          'To score 13+ out of 20 marks, structure your answer following this rigorous format:',
        tableData: {
          headers: ['Section', 'Recommended Words', 'Key Mandate'],
          rows: [
            ['Introduction', '30–40 words', 'Define terms neutrally; explain why the issue is in the national spotlight without taking sides.'],
            ['Arguments FOR', '80–100 words', 'Provide 3 distinct, numbered bullet points with factual, legal, or operational rationale.'],
            ['Arguments AGAINST', '80–100 words', 'Provide 3 distinct, numbered counter-points highlighting federal, economic, or human rights friction.'],
            ['Conclusion / Way Forward', '40–50 words', 'A pragmatic synthesis that balances national security imperatives with democratic safeguards.'],
          ],
        },
        keyTakeaway:
          'Do NOT merge arguments for and against into single narrative paragraphs. Always use explicit sub-headings: "Arguments For:" and "Arguments Against:".',
      },
      {
        heading: '2. High-Yield Authority Sources to Cite',
        content:
          'An answer that merely lists opinions receives 6–8 marks. An answer that cites standard authorities scores 14–16 marks. Keep this list in your muscle memory:',
        bulletPoints: [
          'Federalism & Inter-State Relations: Sarkaria Commission (1987) & Punchhi Commission (2010).',
          'Internal Security & Border Management: Madhav Godbole Committee & Kargil Review Committee (2000).',
          'Police Reforms: Prakash Singh v. Union of India (2006 Supreme Court directives).',
          'Constitutional Principles: S.R. Bommai case (1994), K.S. Puttaswamy (Right to Privacy 2017), Minerva Mills (1980).',
        ],
      },
    ],
    upscCapfAnalyticalAngle:
      'Evaluation Rubric in CAPF Paper 2: 6 marks for Structure & Formatter adherence; 8 marks for Factual & Institutional Depth; 6 marks for Objective Administrative Tone. Never use words like "corrupt", "idiotic", or "tyrannical". Use "institutional inadequacy", "regulatory deficit", or "operational friction".',
    sscCpoSpeedShortcut:
      'Paper 2 is UPSC CAPF exclusive (200 marks). Time discipline: Allocate exactly 16 minutes per 20-mark argument in the 3-hour examination.',
    examinerTraps: [
      'Writing an essay instead of a split argument (Zero marks for structure if "Arguments For" and "Arguments Against" are not clearly delineated).',
      'Using partisan political rhetoric against specific political parties instead of analyzing policy.',
    ],
    highYieldMnemonics: [
      'Structure Mnemonic: "I-F-A-C" (Intro, For, Against, Conclusion).',
      'The 3-Point Rule: "Rule of 3: Exactly 3 solid points For and 3 solid points Against".',
    ],
    comprehensionQuiz: [
      {
        question: 'In UPSC CAPF Paper 2 Counter-Argument writing, what is the recommended point structure for the body?',
        options: [
          'One long narrative essay without headings',
          'Distinct sub-headings with 3 points FOR and 3 points AGAINST',
          'Only arguments supporting the candidate’s personal opinion',
          'A table with bullet points without introduction or conclusion',
        ],
        correctIndex: 1,
        explanation: 'The standard UPSC counter-argument format requires clear sub-headings with exactly 3 well-substantiated points FOR and 3 points AGAINST, followed by a balanced conclusion.',
      },
    ],
  },
];
