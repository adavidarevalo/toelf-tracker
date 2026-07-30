"use client";

import { useState } from "react";
import { usePlanStore } from "@/context/PlanStore";
import { PHASES, RESOURCE_SOURCE_LABELS } from "@/data/plan";
import type { WeekEntry } from "@/data/plan";
import { skillBorderClass, skillTextClass, ui } from "@/lib/ui";

const SKILL_LABELS: Record<string, string> = {
  r: "Reading",
  l: "Listening",
  s: "Speaking",
  w: "Writing",
  g: "Gramática",
  mix: "Mixto",
};

const SELF_DIRECTED_LABEL = "Material propio";

export function PhaseSection() {
  const { appData, updateAppData } = usePlanStore();
  const [expandedWeeks, setExpandedWeeks] = useState<Set<number>>(new Set());

  if (!appData) return null;

  function toggleWeek(week: number, done: boolean) {
    updateAppData((draft) => {
      draft.weekDone[week] = done;
    });
  }

  function toggleExpanded(week: number) {
    setExpandedWeeks((prev) => {
      const next = new Set(prev);
      if (next.has(week)) next.delete(week);
      else next.add(week);
      return next;
    });
  }

  return (
    <section id="phases">
      <div className={ui.sectionHead}>
        <h2 className={ui.sectionTitle}>5. Las 17 semanas</h2>
        <span className="text-ink-soft text-sm">Toca una semana para ver su plan y recursos</span>
      </div>

      {PHASES.map((phase) => (
        <div key={phase.monthLabel} className="bg-paper-raised border border-line rounded-xl mb-4.5 overflow-hidden shadow-sm">
          <div className="flex justify-between items-center gap-3 flex-wrap px-5 py-4 border-b border-line">
            <div>
              <span className="tabular text-ink-soft text-[0.78rem]">{phase.monthLabel}</span>
              <h3 className="text-[1.05rem] font-semibold">{phase.title}</h3>
            </div>
            <span className="text-[0.72rem] text-ink-soft bg-paper border border-line px-2.5 py-0.5 rounded-full whitespace-nowrap">
              {phase.weeksTag}
            </span>
          </div>
          <p className="px-5 pt-3 text-ink-soft text-sm">{phase.description}</p>

          <div className="mt-2">
            {phase.weeks.map((w) => (
              <WeekAccordionRow
                key={w.week}
                week={w}
                done={!!appData.weekDone[w.week]}
                expanded={expandedWeeks.has(w.week)}
                onToggleExpand={() => toggleExpanded(w.week)}
                onToggleDone={(done) => toggleWeek(w.week, done)}
              />
            ))}
          </div>
        </div>
      ))}
    </section>
  );
}

function WeekAccordionRow({
  week,
  done,
  expanded,
  onToggleExpand,
  onToggleDone,
}: {
  week: WeekEntry;
  done: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  onToggleDone: (done: boolean) => void;
}) {
  return (
    <div className="border-t border-line">
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={expanded}
        className={`w-full flex items-center gap-3 px-5 py-2.5 text-left hover:bg-paper/60 transition-colors border-l-[3px] ${skillBorderClass(
          week.skill
        )}`}
      >
        <span className="tabular text-ink-soft text-sm w-6 shrink-0">{week.week}</span>
        <span className="flex-1 font-semibold text-sm truncate">{week.focus}</span>
        <span className="tabular text-ink-soft text-xs whitespace-nowrap hidden sm:inline">{week.hours}</span>
        <span onClick={(e) => e.stopPropagation()} className="shrink-0">
          <input
            type="checkbox"
            checked={done}
            onChange={(e) => onToggleDone(e.target.checked)}
            className="w-[17px] h-[17px] accent-accent cursor-pointer"
          />
        </span>
        <span
          className={`text-ink-soft text-xs shrink-0 transition-transform duration-150 ${expanded ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>

      {expanded && (
        <div className="px-5 pb-4 pl-[calc(1.5rem+0.75rem)] flex flex-col gap-3.5">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[0.66rem] uppercase tracking-wide font-semibold ${skillTextClass(week.skill)}`}>
                {SKILL_LABELS[week.skill] ?? week.skill}
              </span>
              <span className="text-[0.66rem] uppercase tracking-wide text-ink-soft">· {week.hours}</span>
            </div>
            <div className="text-[0.66rem] uppercase tracking-wide text-ink-soft font-semibold mb-1">Plan de la semana</div>
            <p className="text-sm text-ink">{week.focus}</p>
          </div>
          <div>
            <div className="text-[0.66rem] uppercase tracking-wide text-ink-soft font-semibold mb-1.5">Recursos a usar</div>
            <ul className="flex flex-col gap-2.5">
              {week.resources.map((item, i) => (
                <li key={i} className="flex flex-col gap-0.5">
                  <span className="inline-block w-fit text-[0.62rem] uppercase tracking-wide font-semibold text-accent-soft bg-accent-soft/10 border border-accent-soft/30 rounded-full px-2 py-0.5">
                    {item.source ? RESOURCE_SOURCE_LABELS[item.source] : SELF_DIRECTED_LABEL}
                  </span>
                  <span className="text-sm text-ink-soft">{item.detail}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
