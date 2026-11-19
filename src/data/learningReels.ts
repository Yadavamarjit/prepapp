export interface ReelLesson {
  id: string;
  title: string;
  steps: [string, string, string];
  labels: [string, string, string];
  takeaway: string;
  detail: string;
  question: string;
  options: [string, string, string];
  answer: number;
  explanation: string;
}
export interface ReelChapter {
  id: string;
  number: number;
  title: string;
  source: string;
  readPath: string;
  lessons: ReelLesson[];
}
export interface ReelCourse {
  id: string;
  subject: string;
  book: string;
  description: string;
  chapters: ReelChapter[];
}

// Original introductory explanations. Each chapter is a five-reel introduction,
// not a claim to cover every section of the source textbook.
export const REEL_COURSES: ReelCourse[] = [
  {
    id: 'science-9', subject: 'Science', book: 'Class 9 · Exploration',
    description: 'Start with scientific thinking. Then look inside a cell.',
    chapters: [
      {
        id: 'science-9-1', number: 1, title: 'Exploration: Entering the World of Secondary Science',
        source: 'https://ncert.nic.in/textbook/pdf/iesc101.pdf', readPath: '/books/iesc1/1',
        lessons: [
          {
            id: 'science-observe', title: 'Notice first. Explain second.',
            labels: ['Notice', 'Measure', 'Ask'],
            steps: ['“This plant is taller” is something you can observe.', 'Measure both plants in centimetres. A number makes the comparison clearer.', '“Did more light help it grow?” is a question to investigate, not a conclusion yet.'],
            takeaway: 'An observation tells you what happened. An explanation needs evidence.',
            detail: 'Two plants may differ in water, soil or age as well as light. Seeing a difference does not by itself show its cause. Write down what you measured before proposing why it happened.',
            question: 'Which statement is a measured observation?', options: ['Sunlight caused the growth', 'The plant is 12 cm tall', 'This plant will grow fastest'], answer: 1,
            explanation: '12 cm records a measurement. The other statements explain a cause or predict an outcome.',
          },
          {
            id: 'science-model', title: 'A model keeps the useful details.',
            labels: ['Real journey', 'Useful details', 'Simple model'],
            steps: ['Imagine estimating how long a cycle ride will take.', 'Distance and average speed matter. The colour of the bicycle usually does not.', 'A model deliberately simplifies reality to answer a particular question.'],
            takeaway: 'Simple does not mean useless. Know what your model leaves out.',
            detail: 'Distance divided by average speed gives a useful time estimate. Traffic and stops may need to be added for a better estimate. A model has assumptions; adding detail is useful only when it improves the answer you need.',
            question: 'Which detail is most useful for estimating travel time?', options: ['Bicycle colour', 'Rider’s favourite song', 'Distance travelled'], answer: 2,
            explanation: 'Distance directly affects travel time. A model should keep the details relevant to its question.',
          },
          {
            id: 'science-units', title: 'A number needs a unit.',
            labels: ['5 … what?', '5 metres', 'Compare fairly'],
            steps: ['“The rope is 5 long” leaves you guessing.', '“5 metres” gives the number a shared meaning.', 'Use compatible units before comparing measurements or calculating with them.'],
            takeaway: 'Write the unit with the number, every time.',
            detail: 'A rope of 200 cm is longer than a rope of 3 cm, but shorter than one of 3 m. Convert 200 cm to 2 m before comparing it with 3 m. Standard units let people communicate measurements consistently.',
            question: 'Which is longer: 200 cm or 3 m?', options: ['3 m', '200 cm', 'They are equal'], answer: 0,
            explanation: '100 cm = 1 m, so 200 cm = 2 m. Three metres is longer.',
          },
          {
            id: 'science-theory', title: 'A scientific theory is more than a guess.',
            labels: ['Evidence', 'Explanation', 'Further tests'],
            steps: ['Scientists collect observations and look for patterns.', 'A scientific theory explains patterns using a body of evidence.', 'It remains open to testing and improvement when new evidence appears.'],
            takeaway: '“Theory” in science means an evidence-supported explanation.',
            detail: 'A law commonly describes a regular relationship; a theory provides an explanatory framework. A theory does not simply become a law after enough time. Both can have limits in where they apply.',
            question: 'What makes a scientific theory useful?', options: ['It can never change', 'It is a popular opinion', 'It explains evidence and can be tested'], answer: 2,
            explanation: 'Scientific explanations must be checked against evidence. Being open to correction is a strength.',
          },
          {
            id: 'science-predict', title: 'A failed prediction can teach you.',
            labels: ['Predict', 'Compare', 'Re-examine'],
            steps: ['Use your explanation to predict what you expect to observe.', 'Compare the prediction with actual measurements.', 'If they disagree, check the measurements, assumptions and explanation.'],
            takeaway: 'Predict → test → revise. Learning continues when a result surprises you.',
            detail: 'A weather prediction depends on measurements and a model of changing conditions. A mismatch is a reason to investigate what was missing, not to hide the result. Repeated observations help distinguish an error from a real pattern.',
            question: 'A result disagrees with your prediction. What should you do?', options: ['Check the data and assumptions', 'Delete the result', 'Keep only results that agree'], answer: 0,
            explanation: 'Investigating disagreement can improve the measurements or the explanation.',
          },
        ],
      },
      {
        id: 'science-9-2', number: 2, title: 'Cell: The Building Block of Life',
        source: 'https://ncert.nic.in/textbook/pdf/iesc102.pdf', readPath: '/books/iesc1/2',
        lessons: [
          {
            id: 'cell-unit', title: 'Life works at the level of cells.',
            labels: ['Cell', 'Tissue', 'Organ'],
            steps: ['A cell is the basic structural and functional unit of life.', 'A bacterium is a single-celled organism. Your body contains many cells.', 'In a multicellular organism, specialised cells work together in tissues and organs.'],
            takeaway: 'Cell → tissue → organ → organ system.',
            detail: '“Structural” means cells form the body. “Functional” means life processes happen in cells. In a unicellular organism, one cell carries out the functions needed for that organism’s survival.',
            question: 'What is the basic structural and functional unit of life?', options: ['Organ', 'Cell', 'Tissue'], answer: 1,
            explanation: 'Tissues and organs are made of cells. Cells are the basic units where life functions occur.',
          },
          {
            id: 'cell-microscope', title: 'Making something bigger is not the whole story.',
            labels: ['Tiny object', 'Magnification', 'Resolution'],
            steps: ['Most cells are too small to study with the unaided eye.', 'Magnification makes an image appear larger.', 'Resolution lets you distinguish two close details instead of one blur.'],
            takeaway: 'Magnification = larger. Resolution = distinguish details.',
            detail: 'Enlarging a blurry photograph does not reveal new detail. Microscopes need suitable resolution as well as magnification. Hooke used a microscope to examine cork and named the box-like compartments cells.',
            question: 'Which ability separates two closely spaced details?', options: ['Resolution', 'Image colour', 'Magnification alone'], answer: 0,
            explanation: 'Resolution is the ability to distinguish nearby details. Size alone does not guarantee clarity.',
          },
          {
            id: 'cell-membrane', title: 'A cell has a selective boundary.',
            labels: ['Outside', 'Membrane', 'Inside'],
            steps: ['The cell membrane separates the cell’s interior from its surroundings.', 'It allows some substances through more readily than others.', 'This controlled exchange helps the cell maintain its internal conditions.'],
            takeaway: 'The membrane is selective, not a sealed wall.',
            detail: 'Cells need to exchange materials with their environment. The plasma membrane is present in both plant and animal cells. Plant cells also have a cell wall outside the membrane; these are different structures.',
            question: 'Which description fits the cell membrane?', options: ['Blocks every substance', 'Exists only in plants', 'Selectively controls exchange'], answer: 2,
            explanation: 'The membrane permits selective movement of substances. Plant cells have a membrane as well as a wall.',
          },
          {
            id: 'cell-nucleus', title: 'No nucleus does not mean no DNA.',
            labels: ['DNA', 'No enclosed nucleus', 'Enclosed nucleus'],
            steps: ['DNA carries hereditary information.', 'Prokaryotic cells, such as bacteria, lack a membrane-bound nucleus.', 'Eukaryotic cells have a membrane-bound nucleus. Bacteria still have DNA.'],
            takeaway: 'Prokaryote: no membrane-bound nucleus. Eukaryote: membrane-bound nucleus.',
            detail: 'In a bacterium, genetic material occupies a region not enclosed by a nuclear membrane. In a typical plant or animal cell, the nucleus encloses most of the DNA. The distinction concerns organisation, not whether hereditary material exists.',
            question: 'Which statement about bacteria is correct?', options: ['They have no hereditary material', 'They have DNA but no membrane-bound nucleus', 'They are not made of cells'], answer: 1,
            explanation: 'Bacteria are prokaryotic cells. They have DNA without an enclosing nuclear membrane.',
          },
          {
            id: 'cell-osmosis', title: 'Water can move across a membrane.',
            labels: ['Dilute solution', 'Selective membrane', 'Concentrated solution'],
            steps: ['Imagine a membrane that lets water pass but keeps the dissolved substance out.', 'Water moves both ways, with a net flow from the more dilute side to the more concentrated side.', 'This net movement of water through a selectively permeable membrane is osmosis.'],
            takeaway: 'For this simple setup: net water flow is dilute → concentrated.',
            detail: 'This description assumes the membrane blocks the solute and there is no opposing pressure difference. A cell in a sufficiently dilute solution may take in water. A plant cell’s rigid wall limits its expansion.',
            question: 'In this setup, which way does water move overall?', options: ['From dilute to concentrated solution', 'Only from concentrated to dilute solution', 'It cannot cross the membrane'], answer: 0,
            explanation: 'With the stated conditions, net movement is toward the more concentrated solution. Individual water molecules still move in both directions.',
          },
        ],
      },
    ],
  },
  {
    id: 'history-9', subject: 'History', book: 'Class 9 · India and the Contemporary World I',
    description: 'Follow the French Revolution, then the Russian Revolution.',
    chapters: [
      {
        id: 'history-9-1', number: 1, title: 'The French Revolution',
        source: 'https://ncert.nic.in/textbook/pdf/iess301.pdf',
        readPath: 'https://sathee.iitk.ac.in/ncert-books/class-09/social-science/india-and-the-contemporary-world-1/chapter-01-the-french-revolution/',
        lessons: [
          {
            id: 'france-estates', title: 'One society. Unequal privileges.',
            labels: ['Clergy', 'Nobility', 'Third Estate'],
            steps: ['Before 1789, French society was organised into three estates.', 'The clergy and nobility enjoyed important privileges.', 'The Third Estate included peasants, workers and prosperous professionals. It was not one uniform class.'],
            takeaway: 'Third Estate means a broad social group, not just poor peasants.',
            detail: 'Estate refers to a legally recognised social order. Wealth alone did not determine membership: a wealthy merchant still belonged to the Third Estate. Unequal privileges helped generate demands for change.',
            question: 'Who could belong to the Third Estate?', options: ['Only nobles', 'Only the clergy', 'Both peasants and wealthy merchants'], answer: 2,
            explanation: 'The Third Estate included people with very different occupations and levels of wealth.',
          },
          {
            id: 'france-crisis', title: 'Why did daily life become a crisis?',
            labels: ['State debt', 'Expensive bread', 'Public anger'],
            steps: ['France faced serious financial pressure, including the costs of wars.', 'Rising bread prices made survival harder for ordinary families.', 'Economic strain combined with unequal privileges and demands for political change.'],
            takeaway: 'Several pressures combined; there was no single cause.',
            detail: 'Separate the government’s debt crisis from households’ difficulty buying food. They affected different parts of society but reinforced wider dissatisfaction. Ideas about rights also shaped how people challenged authority.',
            question: 'Which explanation best fits the revolutionary crisis?', options: ['Economic, social and political pressures combined', 'Only one bad harvest mattered', 'Everyone had equal privileges'], answer: 0,
            explanation: 'Food hardship, state finances, privilege and political ideas interacted.',
          },
          {
            id: 'france-assembly', title: 'Who had the right to speak for the nation?',
            labels: ['Estates-General', 'National Assembly', 'Constitution demand'],
            steps: ['The Estates-General met in 1789 amid a dispute about representation and voting.', 'Third Estate representatives declared themselves a National Assembly.', 'They sought a constitution to limit royal power.'],
            takeaway: '1789 brought a challenge to the king’s unrestricted authority.',
            detail: 'Voting by estate gave each order one vote, despite the much larger population represented by the Third Estate. The dispute was about how authority should be distributed, not merely how to collect more tax.',
            question: 'What did the National Assembly seek?', options: ['An unlimited monarchy', 'A constitution limiting royal power', 'A return to voting only by nobles'], answer: 1,
            explanation: 'A constitution would establish rules and limits for political power.',
          },
          {
            id: 'france-bastille', title: 'Why remember 14 July 1789?',
            labels: ['Paris', 'Bastille', 'Royal authority challenged'],
            steps: ['A Paris crowd stormed the Bastille on 14 July 1789.', 'The fortress-prison was associated with royal authority.', 'Its fall became a powerful revolutionary symbol. It did not instantly create a republic.'],
            takeaway: 'Bastille: 1789. Republic: a later stage.',
            detail: 'Historical symbols and changes in government are not the same event. Keep a timeline so a famous incident does not replace the sequence of political developments that followed.',
            question: 'What happened on 14 July 1789?', options: ['Napoleon became emperor', 'France became a republic', 'The Bastille was stormed'], answer: 2,
            explanation: 'The storming took place in 1789; the monarchy was abolished in 1792.',
          },
          {
            id: 'france-republic', title: 'A revolution changes direction over time.',
            labels: ['1789: uprising', '1791: constitution', '1792: republic'],
            steps: ['Revolutionary events in 1789 challenged the old order.', 'The constitution of 1791 established a constitutional monarchy.', 'In 1792 the monarchy was abolished and France became a republic.'],
            takeaway: '1789 → 1791 → 1792: challenge → limits → republic.',
            detail: 'A constitutional monarchy retains a monarch under constitutional limits. A republic has no hereditary monarch as head of state. Neither label alone tells you whether every adult has equal political rights.',
            question: 'Which came first?', options: ['The 1791 constitutional monarchy', 'The 1792 republic', 'Both began together'], answer: 0,
            explanation: 'The constitutional monarchy preceded the republic. The revolution passed through distinct phases.',
          },
        ],
      },
      {
        id: 'history-9-2', number: 2, title: 'Socialism in Europe and the Russian Revolution',
        source: 'https://ncert.nic.in/textbook/pdf/iess302.pdf',
        readPath: 'https://sathee.iitk.ac.in/sathee-railway-exams/student-corner/ncert-books/class-09/social-science/india-and-the-contemporary-world-1/chapter-02-socialism-in-europe-and-the-russian-revolution/',
        lessons: [
          {
            id: 'russia-ideas', title: 'Who should own productive property?',
            labels: ['Private ownership', 'Criticism', 'Collective ownership'],
            steps: ['Industrial society raised questions about wealth and working conditions.', 'Socialists criticised private ownership of productive property as a source of inequality.', 'They supported forms of collective control, but disagreed about how change should happen.'],
            takeaway: 'Socialism included different proposals, not one identical plan.',
            detail: 'Productive property means resources used to produce goods, such as factories and land. Debates included cooperative ownership and revolutionary change. Distinguish a general body of ideas from one party’s later policies.',
            question: 'What did socialist thinkers commonly question?', options: ['Whether people need food', 'Private ownership of productive property', 'Whether factories existed'], answer: 1,
            explanation: 'They connected ownership of productive resources with the distribution of power and wealth.',
          },
          {
            id: 'russia-tsar', title: 'Russia before the revolutions.',
            labels: ['Tsar', 'Peasants', 'Industrial workers'],
            steps: ['Tsar Nicholas II ruled the Russian Empire.', 'Most people depended on agriculture, while industry was concentrated in particular areas.', 'Peasants’ demands for land and workers’ demands over conditions challenged the existing order.'],
            takeaway: 'Think of peasants and workers as distinct groups with overlapping grievances.',
            detail: 'Russia was not simply an industrial society like an enlarged factory. The large rural population mattered greatly. Understanding the social groups helps explain why land, bread and working conditions became political issues.',
            question: 'What supported most people’s livelihoods in Russia?', options: ['Agriculture', 'Space exploration', 'Factory ownership'], answer: 0,
            explanation: 'Agriculture dominated livelihoods, even though urban workers played a major revolutionary role.',
          },
          {
            id: 'russia-war', title: 'War intensified existing pressures.',
            labels: ['War losses', 'Shortages', 'Discontent'],
            steps: ['Russia entered the First World War in 1914.', 'Military losses and economic disruption increased hardship.', 'Food shortages and distrust of the government helped deepen the crisis by 1917.'],
            takeaway: 'War intensified problems that already existed.',
            detail: 'A trigger is not the same as the only cause. Connect wartime disruption to earlier grievances over authority, land and labour. This makes the revolution easier to explain than memorising isolated dates.',
            question: 'How did the First World War affect Russia’s crisis?', options: ['It ended all food shortages', 'It removed every earlier grievance', 'It intensified hardship and discontent'], answer: 2,
            explanation: 'Wartime losses and disruption increased pressure on an already troubled political system.',
          },
          {
            id: 'russia-february', title: 'February: the monarchy falls.',
            labels: ['Protests', 'Tsar abdicates', 'Provisional Government'],
            steps: ['Protests and strikes in Petrograd grew into the February Revolution of 1917.', 'The Tsar abdicated, ending the monarchy.', 'A Provisional Government emerged, while soviets also exercised influence.'],
            takeaway: 'February ended Tsarist rule; it was not the Bolshevik takeover.',
            detail: 'Soviets were councils of workers’ and soldiers’ representatives. Remember two centres of influence after the monarchy fell. The February and October names follow the calendar then used in Russia.',
            question: 'Which change belongs to the February Revolution?', options: ['The Tsar abdicated', 'The Bolsheviks overthrew the Provisional Government', 'Nicholas II became Tsar'], answer: 0,
            explanation: 'February brought down the monarchy. The Bolshevik seizure of power came in October.',
          },
          {
            id: 'russia-october', title: 'October: another change of power.',
            labels: ['February: monarchy ends', 'Provisional Government', 'October: Bolsheviks'],
            steps: ['The Provisional Government continued to face opposition during 1917.', 'In October, the Bolsheviks led a seizure of power against it.', 'The new government changed land and economic policies; civil war followed.'],
            takeaway: 'February: Tsar out. October: Provisional Government out.',
            detail: 'Do not compress 1917 into a single transfer of power. The Bolsheviks replaced the Provisional Government, not a still-ruling Tsar. Subsequent conflict shows that seizing power did not immediately end opposition.',
            question: 'Whom did the Bolsheviks overthrow in October 1917?', options: ['Napoleon', 'The Provisional Government', 'The French National Assembly'], answer: 1,
            explanation: 'The Tsar had already abdicated. The October uprising targeted the Provisional Government.',
          },
        ],
      },
    ],
  },
];
