"use client";

import { usePlanStore } from "@/context/PlanStore";
import { PHASES } from "@/data/plan";
import { skillBorderClass, ui } from "@/lib/ui";

export function PhaseSection() {
  const { appData, updateAppData } = usePlanStore();
  if (!appData) return null;

  function toggleWeek(week: number, done: boolean) {
    updateAppData((draft) => {
      draft.weekDone[week] = done;
    });
  }

  return (
    <section id="phases">
      <div className={ui.sectionHead}>
        <h2 className={ui.sectionTitle}>5. Las 17 semanas</h2>
        <span className="text-ink-soft text-sm">Marca cada semana al terminarla</span>
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

          <div className="overflow-x-auto">
            <table className="w-full border-collapse mt-2">
              <thead>
                <tr>
                  {["Semana", "Enfoque", "Recurso", "Horas", "✓"].map((h) => (
                    <th
                      key={h}
                      className="text-left text-[0.66rem] uppercase tracking-wide text-ink-soft px-5 pt-2.5 pb-1.5 font-semibold"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {phase.weeks.map((w, idx) => (
                  <tr key={w.week}>
                    <td
                      className={`tabular text-ink-soft whitespace-nowrap px-5 py-2.5 border-t border-line text-sm ${
                        idx === phase.weeks.length - 1 ? "pb-4" : ""
                      }`}
                    >
                      {w.week}
                    </td>
                    <td
                      className={`font-semibold px-5 py-2.5 border-t border-line text-sm border-l-[3px] ${skillBorderClass(
                        w.skill
                      )} ${idx === phase.weeks.length - 1 ? "pb-4" : ""}`}
                    >
                      {w.focus}
                    </td>
                    <td className={`px-5 py-2.5 border-t border-line text-sm ${idx === phase.weeks.length - 1 ? "pb-4" : ""}`}>
                      {w.resource}
                    </td>
                    <td
                      className={`tabular text-ink-soft whitespace-nowrap px-5 py-2.5 border-t border-line text-sm ${
                        idx === phase.weeks.length - 1 ? "pb-4" : ""
                      }`}
                    >
                      {w.hours}
                    </td>
                    <td className={`text-center px-5 py-2.5 border-t border-line ${idx === phase.weeks.length - 1 ? "pb-4" : ""}`}>
                      <input
                        type="checkbox"
                        checked={!!appData.weekDone[w.week]}
                        onChange={(e) => toggleWeek(w.week, e.target.checked)}
                        className="w-[17px] h-[17px] accent-accent cursor-pointer"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </section>
  );
}
