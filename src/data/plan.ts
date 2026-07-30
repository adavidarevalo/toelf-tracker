import type { CheckpointId, DayCode } from "@/lib/types";

export type WeekSkill = "r" | "l" | "s" | "w" | "g" | "mix";

/** The specific book or course a resource item comes from — `null` means self-directed review. */
export type ResourceSource = "libro1" | "libro2" | "curso-modular" | "curso-emergencia" | null;

export const RESOURCE_SOURCE_LABELS: Record<Exclude<ResourceSource, null>, string> = {
  libro1: "TOEFL iBT Preparation Book 2025–2026",
  libro2: "The Official Guide to the TOEFL iBT Test, 7th Ed.",
  "curso-modular": "New TOEFL iBT 2026 Enhanced: Modular System",
  "curso-emergencia": "Emergency Course for the TOEFL (2026)",
};

export interface WeekResource {
  source: ResourceSource;
  detail: string;
}

export interface WeekEntry {
  week: number;
  skill: WeekSkill;
  focus: string;
  resources: WeekResource[];
  hours: string;
}

export interface Phase {
  monthLabel: string;
  title: string;
  weeksTag: string;
  description: string;
  weeks: WeekEntry[];
}

export const PHASES: Phase[] = [
  {
    monthLabel: "MES 1 · AGOSTO",
    title: "Diagnóstico + cimientos de Lectura y Gramática",
    weeksTag: "Semanas 1–4",
    description:
      "Mide dónde estás, luego arranca por Reading porque su vocabulario y gramática sostienen las otras tres secciones.",
    weeks: [
      {
        week: 1,
        skill: "mix",
        focus: "Diagnóstico completo",
        resources: [
          { source: "libro1", detail: "Test completo 1 (una sección/día)" },
          { source: "curso-modular", detail: '"Quick overview" de cada sección' },
        ],
        hours: "~7h",
      },
      {
        week: 2,
        skill: "r",
        focus: "Reading — vocabulario en contexto",
        resources: [
          { source: "curso-modular", detail: '"Complete the words" overview + Timed practice 1–3' },
          { source: "curso-modular", detail: '"Read in daily life" overview + práctica 1–2' },
        ],
        hours: "6h",
      },
      {
        week: 3,
        skill: "r",
        focus: "Reading — textos académicos",
        resources: [
          {
            source: "curso-modular",
            detail: "Academic reading strategies (first + detailed reading) + Sample 1–2 + Timed practice 1 (Microplastics)",
          },
        ],
        hours: "6h",
      },
      {
        week: 4,
        skill: "g",
        focus: "Gramática base + Checkpoint 1",
        resources: [
          { source: "curso-modular", detail: "Basic sentence/question structure, Adjective Clauses Parte 1–2" },
          { source: "libro1", detail: "Repetir Reading del Test 2 (checkpoint)" },
        ],
        hours: "6h",
      },
    ],
  },
  {
    monthLabel: "MES 2 · SEPTIEMBRE",
    title: "Listening + Writing base",
    weeksTag: "Semanas 5–8",
    description:
      "Listening alimenta directamente el Speaking (Take an interview) y el Writing (Academic discussion).",
    weeks: [
      {
        week: 5,
        skill: "l",
        focus: "Listening — respuestas cortas",
        resources: [{ source: "curso-modular", detail: '"Listen and choose a response" overview + Practice tests 1–4' }],
        hours: "6h",
      },
      {
        week: 6,
        skill: "l",
        focus: "Listening — conversación y anuncios",
        resources: [
          {
            source: "curso-modular",
            detail: '"Listen to a conversation" (overview + práctica 1–2), "Listen to an announcement" (overview + práctica 1)',
          },
        ],
        hours: "6h",
      },
      {
        week: 7,
        skill: "g",
        focus: "Listening académico + Gramática",
        resources: [
          { source: "curso-modular", detail: '"Listen to an academic talk" overview + Lecture práctica 1–2' },
          { source: "curso-modular", detail: "Noun clauses Parte 1–2" },
        ],
        hours: "7h",
      },
      {
        week: 8,
        skill: "w",
        focus: "Writing base + Checkpoint 2",
        resources: [
          { source: "curso-modular", detail: '"Build a sentence" + "Write an email" (overview, estrategias, práctica 1–2)' },
          { source: "libro1", detail: "Checkpoint: Listening y Writing del Test 2" },
        ],
        hours: "7h",
      },
    ],
  },
  {
    monthLabel: "MES 3 · OCTUBRE",
    title: "Writing integrado + Speaking + Gramática avanzada",
    weeksTag: "Semanas 9–12",
    description:
      "Speaking suele ser la sección más incómoda — dale dos semanas completas y grábate desde el primer día.",
    weeks: [
      {
        week: 9,
        skill: "w",
        focus: "Writing — discusión académica",
        resources: [{ source: "curso-modular", detail: '"Write for academic discussion" overview + Timed practice 1–2' }],
        hours: "6h",
      },
      {
        week: 10,
        skill: "s",
        focus: "Speaking — listen and repeat",
        resources: [{ source: "curso-modular", detail: '"Listen and repeat" overview + Timed practice 1–3' }],
        hours: "6h",
      },
      {
        week: 11,
        skill: "s",
        focus: "Speaking — entrevista",
        resources: [{ source: "curso-modular", detail: '"Take an interview" overview + estrategias + Timed practice 1–2' }],
        hours: "6h",
      },
      {
        week: 12,
        skill: "g",
        focus: "Gramática avanzada + Checkpoint 3",
        resources: [
          {
            source: "curso-modular",
            detail: "If Type 0/1/2/3, Linkers (tiempo/razón/resultado/propósito/contraste)",
          },
          { source: "libro1", detail: "Grabar y autoevaluar Speaking/Writing con la rúbrica oficial" },
        ],
        hours: "7h",
      },
    ],
  },
  {
    monthLabel: "MES 4 · NOVIEMBRE",
    title: "Simulacros completos y repaso final",
    weeksTag: "Semanas 13–17",
    description: "Ya no hay lecciones nuevas de contenido — solo condiciones de examen real y pulir lo más débil.",
    weeks: [
      {
        week: 13,
        skill: "mix",
        focus: "Simulacro completo 1",
        resources: [{ source: "libro1", detail: "Test completo 2, las 4 secciones cronometradas" }],
        hours: "7h",
      },
      {
        week: 14,
        skill: "mix",
        focus: "Refuerzo de tu sección más débil",
        resources: [
          { source: "curso-emergencia", detail: 'Lecciones "Tips and tricks" de esa sección' },
          { source: "curso-modular", detail: "Reducción de cláusulas (Adjective Clauses) si la gramática aún falla" },
        ],
        hours: "6h",
      },
      {
        week: 15,
        skill: "mix",
        focus: "Simulacro con material oficial 1",
        resources: [{ source: "libro2", detail: "Test completo 1 (Capítulo 6), cronometrado" }],
        hours: "6h",
      },
      {
        week: 16,
        skill: "mix",
        focus: "Simulacro con material oficial 2",
        resources: [
          { source: "libro2", detail: "Test completo 2 (Capítulo 7)" },
          { source: "curso-emergencia", detail: '"Complete TOEFL Test" (1h17)' },
        ],
        hours: "6h",
      },
      {
        week: 17,
        skill: "mix",
        focus: "Repaso final y logística",
        resources: [
          { source: null, detail: "Vocabulario y plantillas propias, descanso activo, revisar reglas del examen" },
          { source: null, detail: "Medio simulacro opcional con material que aún no hayas usado" },
        ],
        hours: "4h",
      },
    ],
  },
];

export interface CheckpointMeta {
  id: CheckpointId;
  name: string;
  weekLabel: string;
}

export const CHECKPOINTS: CheckpointMeta[] = [
  { id: "diag", name: "Diagnóstico", weekLabel: "S1" },
  { id: "cp1", name: "Checkpoint 1", weekLabel: "S4" },
  { id: "cp2", name: "Checkpoint 2", weekLabel: "S8" },
  { id: "cp3", name: "Checkpoint 3", weekLabel: "S12" },
  { id: "mock1", name: "Simulacro 1", weekLabel: "S13" },
  { id: "off1", name: "Oficial 1", weekLabel: "S15" },
  { id: "off2", name: "Oficial 2", weekLabel: "S16" },
];

export const CHECKPOINT_TARGET_FRACTIONS: Partial<Record<CheckpointId, number>> = {
  cp1: 0.25,
  cp2: 0.55,
  cp3: 0.8,
  mock1: 0.9,
  off1: 0.95,
  off2: 1,
};

export const RHYTHM_DAYS = [
  { name: "Lun", task: "Lección nueva" },
  { name: "Mar", task: "Gramática" },
  { name: "Mié", task: "Práctica cronometrada" },
  { name: "Jue", task: "Drill de errores" },
  { name: "Vie", task: "Lección + ejercicio" },
  { name: "Sáb", task: "Simulacro parcial" },
  { name: "Dom", task: "Descanso / vocabulario", rest: true },
];

export const WEEKLY_PLAN_DAYS: { code: DayCode; label: string }[] = [
  { code: "mon", label: "Lunes" },
  { code: "tue", label: "Martes" },
  { code: "wed", label: "Miércoles" },
  { code: "thu", label: "Jueves" },
  { code: "fri", label: "Viernes" },
  { code: "sat", label: "Sábado" },
  { code: "sun", label: "Domingo" },
];

/** Prize window: 8 weeks starting the Monday the plan begins. */
export const PRIZE_START = new Date(2026, 7, 3); // 3 ago 2026
export const PRIZE_WINDOW_DAYS = 56;
export const PRIZE_CONSISTENCY_RATIO = 0.83; // ~40 of 48 expected study days

export const TOTAL_WEEKS = 17;
export const GOAL_SCORE = 90;
export const MAX_SECTION_SCORE = 30;

export const PLAN_START_LABEL = "3 de agosto de 2026";
export const PLAN_END_LABEL = "23 de noviembre de 2026";

export const RHYTHM_HOUR_BLOCKS = [
  {
    title: "Día de lección (~60 min)",
    items: ["30 min video de la lección", "25 min ejercicio inmediato relacionado", "5 min anotar errores en tu bitácora"],
  },
  {
    title: "Día de simulacro (~60 min)",
    items: ["Una sección completa, cronometrada", "Si dura más de 60 min, divídela en dos días", "Cero pausas ni traducción mental"],
  },
  {
    title: "Día de repaso (~60 min)",
    items: ["45 min repitiendo tus propios errores de la semana", "15 min de vocabulario nuevo"],
  },
];

export const TIPS: { title: string; body: string }[] = [
  {
    title: "Usa la retroalimentación con IA ya incluida en tus cursos:",
    body: '"Using AI while practicing writing and receiving feedback" y "Using AI to practice speaking" (Curso Modular), más "How to score your own speaking and writing responses" (Curso Emergencia).',
  },
  {
    title: "Compara siempre contra las rúbricas oficiales",
    body: "del Libro 2 (Official Guide) — son las más cercanas a cómo califica el examen real.",
  },
  {
    title: "Lleva una bitácora de errores",
    body: "en la nota de cada día del calendario — es lo que hace medible el progreso semana a semana, no solo en los checkpoints.",
  },
  {
    title: "Si te atrasas una semana,",
    body: "no dupliques horas al día siguiente: recorta el Mes 4 apoyándote más en el Curso Emergencia, que es el repaso condensado.",
  },
];
