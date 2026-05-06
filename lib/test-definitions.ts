// Test Definitions for KineApp
// Includes FABQ (Kovaxcs), Tampa, PCS and SPADI

export type TestType = 'FABQ' | 'TAMPA' | 'PCS' | 'SPADI';

export interface TestItem {
  id: string;
  label: string;
}

export interface TestScale {
  segments: number;
  labels: string[];
  values: number[];
}

export interface TestDefinition {
  type: TestType;
  title: string;
  description: string;
  items: TestItem[];
  scale: TestScale;
  subScales?: Record<string, {
    name: string;
    calculate: (responses: Record<string, number>) => number;
  }>;
  calculateTotal: (responses: Record<string, number>, subScores?: Record<string, number>) => number;
}

// --- FABQ ---
export const FABQ_DEFINITION: TestDefinition = {
  type: 'FABQ',
  title: 'FABQ (Kovaxcs) - Fear-Avoidance Beliefs Questionnaire',
  description: 'Cuestionario de creencias de miedo-evitación para evaluar las creencias sobre el trabajo y la actividad física.',
  scale: {
    segments: 7,
    labels: ['Totalmente en desacuerdo', '', '', 'Ni de acuerdo ni en desacuerdo', '', '', 'Totalmente de acuerdo'],
    values: [0, 1, 2, 3, 4, 5, 6]
  },
  items: [
    { id: 'fabq_1', label: 'Mi dolor fue causado por una actividad física.' },
    { id: 'fabq_2', label: 'La actividad física hace que mi dolor empeore.' },
    { id: 'fabq_3', label: 'La actividad física podría dañar mi espalda.' },
    { id: 'fabq_4', label: 'No debería hacer actividades físicas que (puedan) hacer que mi dolor empeore.' },
    { id: 'fabq_5', label: 'No puedo hacer actividades físicas que (puedan) hacer que mi dolor empeore.' },
    { id: 'fabq_6', label: 'Mi dolor fue causado por mi trabajo o por un accidente laboral.' },
    { id: 'fabq_7', label: 'Mi trabajo agravó mi dolor.' },
    { id: 'fabq_8', label: 'Tengo un reclamo de compensación por mi dolor.' },
    { id: 'fabq_9', label: 'Mi trabajo es demasiado pesado para mí.' },
    { id: 'fabq_10', label: 'Mi trabajo hace o haría que mi dolor empeore.' },
    { id: 'fabq_11', label: 'Mi trabajo podría dañar mi espalda.' },
    { id: 'fabq_12', label: 'No debería hacer mi trabajo normal con mi dolor actual.' },
    { id: 'fabq_13', label: 'No puedo hacer mi trabajo normal con mi dolor actual.' },
    { id: 'fabq_14', label: 'No puedo hacer mi trabajo normal hasta que mi dolor sea tratado.' },
    { id: 'fabq_15', label: 'No creo que vuelva a mi trabajo normal en 3 meses.' },
    { id: 'fabq_16', label: 'No creo que alguna vez pueda volver a ese trabajo.' },
  ],
  subScales: {
    physical: {
      name: 'Actividad Física',
      calculate: (res) => (res.fabq_2 || 0) + (res.fabq_3 || 0) + (res.fabq_4 || 0) + (res.fabq_5 || 0)
    },
    work: {
      name: 'Trabajo',
      calculate: (res) => (res.fabq_6 || 0) + (res.fabq_7 || 0) + (res.fabq_9 || 0) + (res.fabq_10 || 0) + (res.fabq_11 || 0) + (res.fabq_12 || 0) + (res.fabq_15 || 0)
    }
  },
  calculateTotal: (res, subs) => (subs?.physical || 0) + (subs?.work || 0)
};

// --- TAMPA ---
export const TAMPA_DEFINITION: TestDefinition = {
  type: 'TAMPA',
  title: 'TAMPA Scale of Kinesiophobia',
  description: 'Escala para medir el miedo irracional al movimiento o a la actividad física.',
  scale: {
    segments: 5,
    labels: ['Nada', 'Casi nunca', 'A veces', 'Muchas veces', 'Siempre'],
    values: [0, 1, 2, 3, 4]
  },
  items: [
    { id: 't_1', label: 'Tengo miedo de lesionarme si hago ejercicio.' },
    { id: 't_2', label: 'Si superara el dolor, este aumentaría.' },
    { id: 't_3', label: 'Mi cuerpo me dice que tengo algo grave.' },
    { id: 't_4', label: 'El dolor siempre significa que hay una lesión.' },
    { id: 't_5', label: 'Tengo miedo de lesionarme accidentalmente.' },
    { id: 't_6', label: 'La forma más segura de evitar que el dolor aumente es tener cuidado.' },
    { id: 't_7', label: 'No me dolería tanto si no tuviera algo grave.' },
    { id: 't_8', label: 'El dolor me dice cuándo debo detener la actividad.' },
    { id: 't_9', label: 'No es seguro hacer actividades físicas con mi condición.' },
    { id: 't_10', label: 'No puedo hacer todo lo que hacen las personas normales.' },
    { id: 't_11', label: 'Nadie debería hacer actividades físicas cuando tiene dolor.' },
  ],
  calculateTotal: (res) => Object.values(res).reduce((a, b) => a + b, 0)
};

// --- PCS ---
export const PCS_DEFINITION: TestDefinition = {
  type: 'PCS',
  title: 'PCS - Pain Catastrophizing Scale',
  description: 'Escala para evaluar los pensamientos y sentimientos catastróficos ante el dolor.',
  scale: {
    segments: 5,
    labels: ['Nada', 'Casi nunca', 'A veces', 'Muchas veces', 'Siempre'],
    values: [0, 1, 2, 3, 4]
  },
  items: [
    { id: 'p_1', label: 'Me preocupa todo el tiempo si el dolor va a terminar.' },
    { id: 'p_2', label: 'Siento que no puedo soportarlo más.' },
    { id: 'p_3', label: 'Es terrible y pienso que nunca va a mejorar.' },
    { id: 'p_4', label: 'Es espantoso y siento que me sobrepasa.' },
    { id: 'p_5', label: 'Siento que no puedo soportarlo más.' },
    { id: 'p_6', label: 'Tengo miedo de que el dolor empeore.' },
    { id: 'p_7', label: 'Pienso en otras situaciones dolorosas.' },
    { id: 'p_8', label: 'Deseo desesperadamente que el dolor se vaya.' },
    { id: 'p_9', label: 'No puedo sacarme el dolor de la cabeza.' },
    { id: 'p_10', label: 'Pienso constantemente en lo mucho que me duele.' },
    { id: 'p_11', label: 'Pienso constantemente en cuánto deseo que el dolor cese.' },
    { id: 'p_12', label: 'Siento que no hay nada que pueda hacer para reducirlo.' },
    { id: 'p_13', label: 'Me pregunto si podría ocurrir algo grave.' },
  ],
  calculateTotal: (res) => Object.values(res).reduce((a, b) => a + b, 0)
};

// --- SPADI ---
export const SPADI_DEFINITION: TestDefinition = {
  type: 'SPADI',
  title: 'SPADI - Shoulder Pain and Disability Index',
  description: 'Índice de dolor y discapacidad de hombro.',
  scale: {
    segments: 11,
    labels: ['Sin dolor / Sin dificultad', 'El peor dolor imaginable / Dificultad extrema'],
    values: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
  },
  items: [
    { id: 'p1', label: '¿Cuál es la intensidad de su dolor en su grado máximo?' },
    { id: 'p2', label: '¿Cuál es la intensidad de su dolor cuando duerme sobre el lado afectado?' },
    { id: 'p3', label: '¿Cuál es la intensidad de su dolor al alcanzar algo en un estante alto?' },
    { id: 'p4', label: '¿Cuál es la intensidad de su dolor al tocarse la nuca?' },
    { id: 'p5', label: '¿Cuál es la intensidad de su dolor al empujar con el brazo afectado?' },
    { id: 'd1', label: 'Lavarse el pelo' },
    { id: 'd2', label: 'Lavarse la espalda' },
    { id: 'd3', label: 'Ponerse una camiseta o jersey' },
    { id: 'd4', label: 'Ponerse una camisa que se abroche por delante' },
    { id: 'd5', label: 'Ponerse los pantalones' },
    { id: 'd6', label: 'Alcanzar un objeto en un estante alto' },
    { id: 'd7', label: 'Llevar un objeto pesado (4.5 kg)' },
    { id: 'd8', label: 'Quitarse algo del bolsillo trasero' },
  ],
  subScales: {
    pain: {
      name: 'Dolor',
      calculate: (res) => {
        const ids = ['p1', 'p2', 'p3', 'p4', 'p5'];
        const sum = ids.reduce((a, id) => a + (res[id] || 0), 0);
        return (sum / 50) * 100;
      }
    },
    disability: {
      name: 'Discapacidad',
      calculate: (res) => {
        const ids = ['d1', 'd2', 'd3', 'd4', 'd5', 'd6', 'd7', 'd8'];
        const sum = ids.reduce((a, id) => a + (res[id] || 0), 0);
        return (sum / 80) * 100;
      }
    }
  },
  calculateTotal: (res, subs) => ((subs?.pain || 0) + (subs?.disability || 0)) / 2
};

export const TEST_DEFINITIONS: Record<TestType, TestDefinition> = {
  FABQ: FABQ_DEFINITION,
  TAMPA: TAMPA_DEFINITION,
  PCS: PCS_DEFINITION,
  SPADI: SPADI_DEFINITION
};

export const TEST_TYPES_LIST = [
  { type: "FABQ" as TestType, title: FABQ_DEFINITION.title, description: FABQ_DEFINITION.description },
  { type: "TAMPA" as TestType, title: TAMPA_DEFINITION.title, description: TAMPA_DEFINITION.description },
  { type: "PCS" as TestType, title: PCS_DEFINITION.title, description: PCS_DEFINITION.description },
  { type: "SPADI" as TestType, title: SPADI_DEFINITION.title, description: SPADI_DEFINITION.description },
];

export function getTestDefinition(testType: TestType): TestDefinition {
  return TEST_DEFINITIONS[testType];
}

export function calculateScores(testType: TestType, answers: Record<string, number>): Record<string, number> {
  const def = TEST_DEFINITIONS[testType];
  const subScores: Record<string, number> = {};
  
  if (def.subScales) {
    Object.entries(def.subScales).forEach(([key, sub]) => {
      subScores[key] = sub.calculate(answers);
    });
  }
  
  const total = def.calculateTotal(answers, subScores);
  return { total, ...subScores };
}
