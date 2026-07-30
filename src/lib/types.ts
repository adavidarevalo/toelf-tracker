export type Skill = "r" | "l" | "s" | "w";

export interface SectionScores {
  r: number | null;
  l: number | null;
  s: number | null;
  w: number | null;
}

export const emptySectionScores = (): SectionScores => ({ r: null, l: null, s: null, w: null });

export type CheckpointId = "diag" | "cp1" | "cp2" | "cp3" | "mock1" | "off1" | "off2";

export interface CheckpointEntry extends SectionScores {
  notes: string;
}

export type TrackerData = Record<CheckpointId, CheckpointEntry>;

export interface StudyLogEntry {
  studied: boolean | null;
  mood: number | null; // 1-5
  note: string;
}

export type StudyLog = Record<string, StudyLogEntry>; // key: ISO date "YYYY-MM-DD"

export interface WeeklyPlanDay {
  text: string;
  done: boolean;
}

export type DayCode = "mon" | "tue" | "wed" | "thu" | "fri" | "sat" | "sun";

export type WeeklyPlanWeek = Partial<Record<DayCode, WeeklyPlanDay>>;

export type WeeklyPlan = Record<string, WeeklyPlanWeek>; // key: ISO date of that week's Monday

export interface AppData {
  baseline: SectionScores;
  weekDone: Record<number, boolean>;
  tracker: TrackerData;
  studyLog: StudyLog;
  weeklyPlan: WeeklyPlan;
}

export function createDefaultAppData(): AppData {
  const emptyCheckpoint = (): CheckpointEntry => ({ ...emptySectionScores(), notes: "" });
  return {
    baseline: emptySectionScores(),
    weekDone: {},
    tracker: {
      diag: emptyCheckpoint(),
      cp1: emptyCheckpoint(),
      cp2: emptyCheckpoint(),
      cp3: emptyCheckpoint(),
      mock1: emptyCheckpoint(),
      off1: emptyCheckpoint(),
      off2: emptyCheckpoint(),
    },
    studyLog: {},
    weeklyPlan: {},
  };
}

/** Fills any keys missing from `loaded` (e.g. after a schema addition) with defaults, recursively. */
export function mergeWithDefaults<T>(loaded: T, defaults: T): T {
  const loadedRecord = { ...(loaded as Record<string, unknown>) };
  const defaultsRecord = defaults as Record<string, unknown>;
  for (const key of Object.keys(defaultsRecord)) {
    const defaultValue = defaultsRecord[key];
    if (defaultValue && typeof defaultValue === "object" && !Array.isArray(defaultValue)) {
      loadedRecord[key] = mergeWithDefaults(loadedRecord[key] ?? {}, defaultValue);
    } else if (!(key in loadedRecord)) {
      loadedRecord[key] = defaultValue;
    }
  }
  return loadedRecord as T;
}
