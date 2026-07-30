import { addDays, toISODate } from "@/lib/date";
import {
  CHECKPOINT_TARGET_FRACTIONS,
  GOAL_SCORE,
  PRIZE_CONSISTENCY_RATIO,
  PRIZE_START,
  PRIZE_WINDOW_DAYS,
} from "@/data/plan";
import type { CheckpointId, SectionScores, StudyLog } from "@/lib/types";

export function sumScores(scores: SectionScores): number | null {
  const { r, l, s, w } = scores;
  if (r === null || l === null || s === null || w === null) return null;
  const total = r + l + s + w;
  return Number.isNaN(total) ? null : total;
}

export interface GoalSummary {
  baselineTotal: number | null;
  gap: number;
  checkpointTargets: Partial<Record<CheckpointId, number>>;
}

export function computeGoalSummary(baseline: SectionScores): GoalSummary {
  const baselineTotal = sumScores(baseline);
  const total = baselineTotal ?? 0;
  const gap = Math.max(0, GOAL_SCORE - total);
  const checkpointTargets: Partial<Record<CheckpointId, number>> = {};
  if (baselineTotal !== null) {
    checkpointTargets.diag = total;
    for (const [id, fraction] of Object.entries(CHECKPOINT_TARGET_FRACTIONS) as [CheckpointId, number][]) {
      checkpointTargets[id] = id === "off2" ? GOAL_SCORE : Math.round(total + gap * fraction);
    }
  }
  return { baselineTotal, gap, checkpointTargets };
}

export function computeStreak(studyLog: StudyLog, today: Date = new Date()): number {
  const todayISO = toISODate(today);
  let cursor = today;
  if (!studyLog[todayISO]) cursor = addDays(cursor, -1);
  let streak = 0;
  // Walk backward while consecutive days are marked as studied.
  for (;;) {
    const entry = studyLog[toISODate(cursor)];
    if (entry?.studied) {
      streak++;
      cursor = addDays(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

export interface PrizeProgress {
  studiedDays: number;
  expectedDays: number;
  threshold: number;
  progressPercent: number;
  consistencyMet: boolean;
  progressMet: boolean;
  unlocked: boolean;
}

export function computePrizeProgress(
  studyLog: StudyLog,
  baseline: SectionScores,
  checkpoint2: SectionScores
): PrizeProgress {
  let studiedDays = 0;
  let expectedDays = 0;
  for (let i = 0; i < PRIZE_WINDOW_DAYS; i++) {
    const day = addDays(PRIZE_START, i);
    if (day.getDay() !== 0) {
      expectedDays++;
      if (studyLog[toISODate(day)]?.studied) studiedDays++;
    }
  }
  const threshold = Math.ceil(expectedDays * PRIZE_CONSISTENCY_RATIO);
  const progressPercent = Math.min(100, Math.round((studiedDays / threshold) * 100));
  const consistencyMet = studiedDays >= threshold;

  const baselineTotal = sumScores(baseline);
  const cp2Total = sumScores(checkpoint2);
  const progressMet = cp2Total !== null && (baselineTotal === null || cp2Total > baselineTotal);

  return {
    studiedDays,
    expectedDays,
    threshold,
    progressPercent,
    consistencyMet,
    progressMet,
    unlocked: consistencyMet && progressMet,
  };
}
