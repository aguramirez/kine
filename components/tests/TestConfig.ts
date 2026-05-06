// Test configurations for FABQ, TAMPA, and PCS
// All test definitions with items, scales, subscales, and scoring functions

export type TestType = 'FABQ' | 'TAMPA' | 'PCS';

export interface TestItem {
  id: string;
  label: string;
  subscale?: string;
}

export interface TestConfig {
  type: TestType;
  label: string;
  description: string;
  items: TestItem[];
  scaleLabels: string[];
  scaleMin: number;
  scaleMax: number;
  segments: number;
  calculateScores: (answers: Record<string, number>) => Record<string, number>;
}

// ── FABQ (Fear-Avoidance Beliefs Questionnaire) ──
// Scale: 0-6 (7 points)
// 0: Completamente en desacuerdo
// 1: En su mayoría en desacuerdo
// 2: Ligeramente en desacuerdo
// 3: Ligeramente de acuerdo
// 4: En su mayoría de acuerdo
// 5: Totalmente de acuerdo
// 6: Totalmente de acuerdo (Strongly Agree)

const FABQ_ITEMS: TestItem[] = [
  { id: 'q1', label: 'Mi dolor fue causado por actividad física.', subscale: 'general' },
  { id: 'q2', label: 'La actividad física empeora mi dolor.', subscale: 'FABQpa' },
  { id: 'q3', label: 'La actividad física podría dañar mi espalda.', subscale: 'FABQpa' },
  { id: 'q4', label: 'No debería hacer actividades físicas que puedan empeorar mi dolor.', subscale: 'FABQpa' },
  { id: 'q5', label: 'No puedo hacer actividades físicas que puedan empeorar mi dolor.', subscale: 'FABQpa' },
  { id: 'q6', label: 'Mi dolor fue causado por mi trabajo o un accidente laboral.', subscale: 'FABQw' },
  { id: 'q7', label: 'Mi trabajo agravó mi dolor.', subscale: 'FABQw' },
  { id: 'q8', label: 'Tengo un reclamo de compensación por mi dolor.', subscale: 'FABQw' },
  { id: 'q9', label: 'Mi trabajo es demasiado pesado para mí.', subscale: 'FABQw' },
  { id: 'q10', label: 'Mi trabajo hace o haría que mi dolor empeore.', subscale: 'FABQw' },
  { id: 'q11', label: 'Mi trabajo podría dañar mi espalda.', subscale: 'FABQw' },
  { id: 'q12', label: 'No debería hacer mi trabajo normal con mi dolor actual.', subscale: 'FABQw' },
  { id: 'q13', label: 'No puedo hacer mi trabajo normal con mi dolor actual.', subscale: 'FABQw' },
  { id: 'q14', label: 'No puedo hacer mi trabajo normal hasta que mi dolor sea tratado.', subscale: 'general' },
  { id: 'q15', label: 'No creo que vuelva a mi trabajo normal en 3 meses.', subscale: 'FABQw' },
  { id: 'q16', label: 'No creo que nunca pueda volver a ese trabajo.', subscale: 'general' },
];

// ── TAMPA (Tampa Scale of Kinesiophobia) ──
// Scale: 1-4 (4 points)
// 1: Totalmente en desacuerdo (Strongly Disagree)
// 2: Algo en desacuerdo (Somewhat Disagree)
// 3: Algo de acuerdo (Somewhat Agree)
// 4: Totalmente de acuerdo (Strongly Agree)

const TAMPA_ITEMS: TestItem[] = [
  { id: 'a', label: 'Tengo miedo de lesionarme si hago ejercicio.' },
  { id: 'b', label: 'Si superara el dolor, este aumentaría.' },
  { id: 'c', label: 'Mi cuerpo me dice que tengo algo grave.' },
  { id: 'd', label: 'El dolor siempre significa que hay una lesión en el cuerpo.' },
  { id: 'e', label: 'Tengo miedo de lesionarme accidentalmente.' },
  { id: 'f', label: 'La forma más segura de evitar que el dolor aumente es tener cuidado y evitar movimientos innecesarios.' },
  { id: 'g', label: 'No me dolería tanto si no tuviera algo grave en mi cuerpo.' },
  { id: 'h', label: 'El dolor me dice cuándo debo detener la actividad para no lesionarme.' },
  { id: 'i', label: 'No es seguro que una persona con mi condición haga actividades físicas.' },
  { id: 'j', label: 'No puedo hacer todo lo que hacen las personas normales porque podría lesionarme fácilmente.' },
  { id: 'k', label: 'Nadie debería hacer actividades físicas cuando tiene dolor.' },
];

// ── PCS (Pain Catastrophizing Scale) ──
// Scale: 0-4 (5 levels)
// 0: Nunca (Never)
// 1: Casi nunca (Rarely)
// 2: A veces (Sometimes)
// 3: Muchas veces (Often)
// 4: Siempre (Always)

const PCS_ITEMS: TestItem[] = [
  { id: 'a', label: 'Me preocupa todo el tiempo...' },
  { id: 'b', label: 'Siento que no puedo soportarlo...' },
  { id: 'c', label: 'Es terrible y no mejorará...' },
  { id: 'd', label: 'Es horrible y me abruma...' },
  { id: 'e', label: 'Siento que no puedo tolerarlo más...' },
  { id: 'f', label: 'Tengo miedo de que el dolor empeore...' },
  { id: 'g', label: 'Sigo pensando en otras situaciones dolorosas...' },
  { id: 'h', label: 'No puedo esperar a que el dolor desaparezca...' },
  { id: 'i', label: 'No puedo sacármelo de la mente...' },
  { id: 'j', label: 'Sigo pensando en cuánto duele...' },
  { id: 'k', label: 'Sigo pensando en cuánto quiero que se vaya...' },
  { id: 'l', label: 'No hay nada que pueda hacer para aliviar el dolor...' },
  { id: 'm', label: 'Me pregunto si podría pasar algo grave.' },
];

// ── Scoring Functions ──

function calculateFABQ(answers: Record<string, number>) {
  const paItems = ['q2', 'q3', 'q4', 'q5'];
  const wItems = ['q6', 'q7', 'q9', 'q10', 'q11', 'q12', 'q15'];

  const fabqPa = paItems.reduce((sum, id) => sum + (answers[id] || 0), 0);
  const fabqW = wItems.reduce((sum, id) => sum + (answers[id] || 0), 0);

  return {
    ...answers,
    fabqPa,       // Sum of items 2-5 (max 24)
    fabqW,        // Sum of work items (max 42)
    total: fabqPa + fabqW,
  };
}

function calculateTAMPA(answers: Record<string, number>) {
  const total = TAMPA_ITEMS.reduce((sum, item) => sum + (answers[item.id] || 0), 0);
  return {
    ...answers,
    total,         // Sum of all 11 items (min 11, max 44)
    avg: Number((total / TAMPA_ITEMS.length).toFixed(2)),
  };
}

function calculatePCS(answers: Record<string, number>) {
  const total = PCS_ITEMS.reduce((sum, item) => sum + (answers[item.id] || 0), 0);
  return {
    ...answers,
    total,         // Sum of all 13 items (max 52)
    avg: Number((total / PCS_ITEMS.length).toFixed(2)),
  };
}

// ── Configs ──

export const FABQ_CONFIG: TestConfig = {
  type: 'FABQ',
  label: 'FABQ',
  description: 'Fear-Avoidance Beliefs Questionnaire',
  items: FABQ_ITEMS,
  scaleLabels: [
    'Completamente en desacuerdo',
    'En su mayoría en desacuerdo',
    'Ligeramente en desacuerdo',
    'Ligeramente de acuerdo',
    'En su mayoría de acuerdo',
    'Totalmente de acuerdo',
    'Totalmente de acuerdo',
  ],
  scaleMin: 0,
  scaleMax: 6,
  segments: 7,
  calculateScores: calculateFABQ,
};

export const TAMPA_CONFIG: TestConfig = {
  type: 'TAMPA',
  label: 'Tampa Scale',
  description: 'Tampa Scale of Kinesiophobia',
  items: TAMPA_ITEMS,
  scaleLabels: [
    'Totalmente en desacuerdo',
    'Algo en desacuerdo',
    'Algo de acuerdo',
    'Totalmente de acuerdo',
  ],
  scaleMin: 1,
  scaleMax: 4,
  segments: 4,
  calculateScores: calculateTAMPA,
};

export const PCS_CONFIG: TestConfig = {
  type: 'PCS',
  label: 'PCS',
  description: 'Pain Catastrophizing Scale',
  items: PCS_ITEMS,
  scaleLabels: [
    'Nunca',
    'Casi nunca',
    'A veces',
    'Muchas veces',
    'Siempre',
  ],
  scaleMin: 0,
  scaleMax: 4,
  segments: 5,
  calculateScores: calculatePCS,
};

export const TEST_CONFIGS: Record<TestType, TestConfig> = {
  FABQ: FABQ_CONFIG,
  TAMPA: TAMPA_CONFIG,
  PCS: PCS_CONFIG,
};

export const ALL_TEST_TYPES: TestConfig[] = [FABQ_CONFIG, TAMPA_CONFIG, PCS_CONFIG];
