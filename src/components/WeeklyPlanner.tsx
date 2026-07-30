"use client";

import { useState } from "react";
import { usePlanStore } from "@/context/PlanStore";
import { addDays, formatShort, getMonday, toISODate } from "@/lib/date";
import { WEEKLY_PLAN_DAYS } from "@/data/plan";
import type { DayCode } from "@/lib/types";
import { ui } from "@/lib/ui";

export function WeeklyPlanner() {
  const { appData, updateAppData } = usePlanStore();
  const [weekCursor, setWeekCursor] = useState(() => getMonday(new Date()));

  if (!appData) return null;

  const mondayISO = toISODate(weekCursor);
  const sunday = addDays(weekCursor, 6);
  const plan = appData.weeklyPlan[mondayISO] ?? {};

  function setDayField(code: DayCode, patch: { text?: string; done?: boolean }) {
    updateAppData((draft) => {
      const week = draft.weeklyPlan[mondayISO] ?? {};
      const existing = week[code] ?? { text: "", done: false };
      week[code] = { ...existing, ...patch };
      draft.weeklyPlan[mondayISO] = week;
    });
  }

  return (
    <section id="weekly-planning">
      <div className={ui.sectionHead}>
        <h2 className={ui.sectionTitle}>4. Planning semanal</h2>
        <span className="text-ink-soft text-sm">Planea día por día, cualquier semana</span>
      </div>
      <div className={ui.card}>
        <div className="flex items-center justify-between gap-2.5 flex-wrap">
          <button className={ui.btnSmall} onClick={() => setWeekCursor(addDays(weekCursor, -7))}>
            ‹ Semana anterior
          </button>
          <div className="flex items-center gap-2.5">
            <span className="font-semibold text-center">
              Semana del {formatShort(weekCursor)} al {formatShort(sunday)}
            </span>
            <button className={ui.btnSmall} onClick={() => setWeekCursor(getMonday(new Date()))}>
              Esta semana
            </button>
          </div>
          <button className={ui.btnSmall} onClick={() => setWeekCursor(addDays(weekCursor, 7))}>
            Semana siguiente ›
          </button>
        </div>

        <div className="grid gap-2.5 mt-3.5" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))" }}>
          {WEEKLY_PLAN_DAYS.map(({ code, label }) => {
            const entry = plan[code] ?? { text: "", done: false };
            return (
              <div key={code} className="bg-paper border border-line rounded-lg p-2.5 flex flex-col gap-1.5">
                <div className="flex justify-between items-center text-[0.7rem] uppercase tracking-wide text-ink-soft">
                  <span>{label}</span>
                  <label className="flex items-center gap-1 normal-case tracking-normal">
                    <input
                      type="checkbox"
                      checked={entry.done}
                      onChange={(e) => setDayField(code, { done: e.target.checked })}
                      className="accent-accent"
                    />
                    Hecho
                  </label>
                </div>
                <textarea
                  value={entry.text}
                  onChange={(e) => setDayField(code, { text: e.target.value })}
                  placeholder={`Plan para ${label.toLowerCase()}…`}
                  className="w-full min-h-[74px] p-1.5 rounded-md border border-line bg-paper-raised text-ink text-[0.8rem] resize-y focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
