/* ── Test Configuration & Scoring ── */

export type TestType = 'FABQ' | 'TAMPA' | 'PCS';

export interface TestQuestion {
  id: string;
  label: string;
}

export interface TestConfig {
  type: TestType;
  title: string;
  description: string;
  scaleOptions: { value: number; label: string }[];
  questions: TestQuestion[];
  calculateScore: (responses: Record<string, number>) => Record<string, number>;
  subScales?: { label: string; itemIds: string[]; score: number }[];
}

/* ── FABQ (Fear-Avoidance Beliefs Questionnaire) ── */
const FABQ_QUESTIONS: TestQuestion[] = [
  { id: 'pain_caused_by_activity', label: 'My pain was caused by physical activity.' },
  { id: 'activity_makes_worse', label: 'Physical activity makes my pain worse.' },
  { id: 'activity_could_harm', label: 'Physical activity could harm my back.' },
  { id: 'should_not_do_worse', label: 'I should not do physical activities which (might) make my pain worse.' },
  { id: 'cannot_do_worse', label: 'I cannot do physical activities which (might) make my pain worse.' },
  { id: 'pain_caused_by_work', label: 'My pain was caused by my work or by an accident at work.' },
  { id: 'work_aggravated', label: 'My work aggravated my pain.' },
  { id: 'work_claim', label: 'I have a claim for compensation for my pain.' },
  { id: 'work_too_heavy', label: 'My work is too heavy for me.' },
  { id: 'work_makes_worse', label: 'My work makes or would make my pain worse.' },
  { id: 'work_might_harm', label: 'My work might harm my back.' },
  { id: 'should_not_work', label: 'I should not do my normal work with my present pain.' },
  { id: 'cannot_work', label: 'I cannot do my normal work with my present pain.' },
  { id: 'cannot_work_until', label: 'I cannot do my normal work until my pain is treated.' },
  { id: 'not_back_3m', label: 'I do not think I will be back to my normal work within 3 months.' },
  { id: 'never_back', label: 'I do not think I will ever be able to go back to that work.' },
];

const calculateFABQ = (responses: Record<string, number>) => {
  const paIds = ['activity_makes_worse', 'activity_could_harm', 'should_not_do_worse', 'cannot_do_worse'];
  const wIds = ['pain_caused_by_work', 'work_aggravated', 'work_too_heavy', 'work_makes_worse', 'work_might_harm', 'should_not_work', 'cannot_work'];

  const fabqPa = paIds.reduce((sum, id) => sum + (responses[id] || 0), 0);
  const fabqW = wIds.reduce((sum, id) => sum + (responses[id] || 0), 0);

  return {
    ...responses,
    fabqPa,
    fabqW,
  };
};

/* ── Tampa Scale of Kinesiophobia ── */
const TAMPA_QUESTIONS: TestQuestion[] = [
  { id: 't1', label: 'I\'m afraid I might injure myself if I exercise.' },
  { id: 't2', label: 'If I were to overcome the pain, it would increase.' },
  { id: 't3', label: 'My body is telling me I have something serious.' },
  { id: 't4', label: 'Pain always means there is an injury in the body.' },
  { id: 't5', label: 'I\'m afraid of accidentally injuring myself.' },
  { id: 't6', label: 'The safest way to prevent pain from increasing is to be careful and avoid unnecessary movements.' },
  { id: 't7', label: 'It wouldn\'t hurt so much if I didn\'t have something serious in my body.' },
  { id: 't8', label: 'Pain tells me when to stop activity so as not to injure myself.' },
  { id: 't9', label: 'It is not safe for a person with my condition to do physical activities.' },
  { id: 't10', label: 'I can\'t do everything normal people do because I could easily get injured.' },
  { id: 't11', label: 'No one should do physical activities when they have pain.' },
];

const calculateTampa = (responses: Record<string, number>) => {
  const total = TAMPA_QUESTIONS.reduce((sum, q) => sum + (responses[q.id] || 0), 0);
  return { ...responses, tampaTotal: total };
};

/* ── PCS (Pain Catastrophizing Scale) ── */
const PCS_QUESTIONS: TestQuestion[] = [
  { id: 'p1', label: 'I worry all the time about whether the pain will end.' },
  { id: 'p2', label: 'I feel I can\'t stand the pain anymore.' },
  { id: 'p3', label: 'It\'s terrible and I think it\'s never going to get better.' },
  { id: 'p4', label: 'It\'s awful and I feel that it overwhelms me.' },
  { id: 'p5', label: 'I feel I can\'t go on.' },
  { id: 'p6', label: 'I fear that something serious may happen.' },
  { id: 'p7', label: 'I keep thinking of other painful experiences.' },
  { id: 'p8', label: 'I anxiously wait until the pain goes away.' },
  { id: 'p9', label: 'I can\'t seem to keep it out of my mind.' },
  { id: 'p10', label: 'I keep thinking about how much it hurts.' },
  { id: 'p11', label: 'I keep thinking about how much I want the pain to stop.' },
  { id: 'p12', label: 'There\'s nothing I can do to reduce the intensity of the pain.' },
  { id: 'p13', label: 'I wonder whether something serious may happen.' },
];

const calculatePCS = (responses: Record<string, number>) => {
  const total = PCS_QUESTIONS.reduce((sum, q) => sum + (responses[q.id] || 0), 0);
  return { ...responses, pcsTotal: total };
};

/* ── Exports ── */
export const TEST_CONFIGS: Record<TestType, TestConfig> = {
  FABQ: {
    type: 'FABQ',
    title: 'FABQ',
    description: 'Fear-Avoidance Beliefs Questionnaire',
    scaleOptions: [
      { value: 0, label: 'Totalmente en desacuerdo' },
      { value: 1, label: 'Algo en desacuerdo' },
      { value: 2, label: 'Algo de acuerdo' },
      { value: 3, label: 'Totalmente de acuerdo' },
    ],
    questions: FABQ_QUESTIONS,
    calculateScore: calculateFABQ,
  },
  TAMPA: {
    type: 'TAMPA',
    title: 'Tampa Scale',
    description: 'Tampa Scale of Kinesiophobia',
    scaleOptions: [
      { value: 0, label: 'Totalmente en desacuerdo' },
      { value: 1, label: 'Algo en desacuerdo' },
      { value: 2, label: 'Algo de acuerdo' },
      { value: 3, label: 'Totalmente de acuerdo' },
    ],
    questions: TAMPA_QUESTIONS,
    calculateScore: calculateTampa,
  },
  PCS: {
    type: 'PCS',
    title: 'PCS',
    description: 'Pain Catastrophizing Scale',
    scaleOptions: [
      { value: 0, label: 'Nunca' },
      { value: 1, label: 'Casi nunca' },
      { value: 2, label: 'A veces' },
      { value: 3, label: 'Muchas veces' },
      { value: 4, label: 'Siempre' },
    ],
    questions: PCS_QUESTIONS,
    calculateScore: calculatePCS,
  },
};

export const TEST_TYPES = Object.keys(TEST_CONFIGS) as TestType[];

export type { TestConfig as TestConfigType };
