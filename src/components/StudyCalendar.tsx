"use client";

import { useMemo, useState } from "react";
import clsx from "clsx";
import { usePlanStore } from "@/context/PlanStore";
import { formatLong, formatMonthLabel, toISODate } from "@/lib/date";
import { ui } from "@/lib/ui";

const DOW_LABELS = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const MOOD_OPTIONS = [
  { value: 1, label: "Muy mal" },
  { value: 2, label: "Mal" },
  { value: 3, label: "Regular" },
  { value: 4, label: "Bien" },
  { value: 5, label: "Muy bien" },
];

interface DayCell {
  date: Date | null;
  iso: string | null;
}

function buildMonthGrid(cursor: Date): DayCell[] {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstOfMonth = new Date(year, month, 1);
  const startOffset = (firstOfMonth.getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

  const cells: DayCell[] = [];
  for (let i = 0; i < totalCells; i++) {
    const dayNum = i - startOffset + 1;
    if (dayNum < 1 || dayNum > daysInMonth) {
      cells.push({ date: null, iso: null });
    } else {
      const date = new Date(year, month, dayNum);
      cells.push({ date, iso: toISODate(date) });
    }
  }
  return cells;
}

export function StudyCalendar() {
  const { appData, updateAppData } = usePlanStore();
  const [cursor, setCursor] = useState(() => new Date());
  const [selectedISO, setSelectedISO] = useState<string | null>(null);

  const grid = useMemo(() => buildMonthGrid(cursor), [cursor]);
  const todayISO = useMemo(() => toISODate(new Date()), []);
  const selectedEntry = selectedISO && appData ? appData.studyLog[selectedISO] : undefined;

  if (!appData) return null;

  function setEntry(patch: Partial<{ studied: boolean; mood: number; note: string }>) {
    if (!selectedISO) return;
    updateAppData((draft) => {
      const existing = draft.studyLog[selectedISO] ?? { studied: null, mood: null, note: "" };
      draft.studyLog[selectedISO] = { ...existing, ...patch };
    });
  }

  return (
    <section id="calendar">
      <div className={ui.sectionHead}>
        <h2 className={ui.sectionTitle}>3. Calendario de estudio y ánimo</h2>
        <span className="text-ink-soft text-sm">Toca un día para registrarlo</span>
      </div>
      <div className={ui.card}>
        <div className="flex items-center justify-between gap-2.5 flex-wrap">
          <button className={ui.btnSmall} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}>
            ‹ Mes anterior
          </button>
          <div className="flex items-center gap-2.5">
            <span className="font-semibold min-w-[150px] text-center">{formatMonthLabel(cursor)}</span>
            <button className={ui.btnSmall} onClick={() => setCursor(new Date())}>
              Hoy
            </button>
          </div>
          <button className={ui.btnSmall} onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}>
            Mes siguiente ›
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1.5 mt-3.5">
          {DOW_LABELS.map((label) => (
            <div key={label} className="text-[0.64rem] uppercase tracking-wide text-ink-soft text-center pb-0.5">
              {label}
            </div>
          ))}
          {grid.map((cell, i) => {
            if (!cell.iso) return <div key={i} />;
            const entry = appData.studyLog[cell.iso];
            const isToday = cell.iso === todayISO;
            const isSelected = cell.iso === selectedISO;
            return (
              <button
                key={cell.iso}
                onClick={() => setSelectedISO(cell.iso)}
                className={clsx(
                  "min-h-14 rounded-md border p-1.5 flex flex-col gap-1 text-left transition-colors",
                  isSelected ? "outline outline-2 outline-accent -outline-offset-2" : "",
                  isToday ? "border-accent" : "border-line hover:border-accent",
                  "bg-paper"
                )}
              >
                <span className="tabular text-[0.76rem] text-ink-soft">{cell.date!.getDate()}</span>
                {entry?.studied !== undefined && entry?.studied !== null && (
                  <span
                    className={clsx("w-1.5 h-1.5 rounded-full", entry.studied ? "bg-writing" : "bg-speaking")}
                  />
                )}
                {entry?.mood && (
                  <span
                    className="w-full h-1 rounded-sm mt-auto"
                    style={{ backgroundColor: moodColor(entry.mood) }}
                  />
                )}
              </button>
            );
          })}
        </div>

        {selectedISO && (
          <div className="mt-4.5 pt-4 border-t border-dashed border-line">
            <div className="font-semibold text-[0.92rem] capitalize">{formatLong(selectedISO)}</div>

            <span className={`${ui.label} block mt-3.5`}>¿Estudiaste?</span>
            <div className="flex gap-2 flex-wrap mt-2.5">
              <button
                onClick={() => setEntry({ studied: true })}
                className={toggleClass(selectedEntry?.studied === true)}
              >
                Sí estudié
              </button>
              <button
                onClick={() => setEntry({ studied: false })}
                className={toggleClass(selectedEntry?.studied === false)}
              >
                No estudié
              </button>
            </div>

            <span className={`${ui.label} block mt-3.5`}>¿Cómo te sentiste?</span>
            <div className="flex gap-2 flex-wrap mt-2.5">
              {MOOD_OPTIONS.map((m) => (
                <button
                  key={m.value}
                  onClick={() => setEntry({ mood: m.value })}
                  className={clsx(
                    "px-3 py-1.5 rounded-full border text-xs",
                    selectedEntry?.mood === m.value
                      ? "border-accent-soft bg-accent-soft/20 text-ink font-semibold"
                      : "border-line bg-paper text-ink-soft"
                  )}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <span className={`${ui.label} block mt-3.5`}>Nota (opcional)</span>
            <textarea
              value={selectedEntry?.note ?? ""}
              onChange={(e) => setEntry({ note: e.target.value })}
              placeholder="¿Qué estudiaste, qué se te dificultó?"
              className={`${ui.input} mt-2.5 min-h-[60px] resize-y`}
            />
          </div>
        )}
      </div>
    </section>
  );
}

function toggleClass(active: boolean | undefined) {
  return clsx(
    "px-3.5 py-2 rounded-md border text-sm",
    active ? "border-accent bg-accent/15 font-semibold" : "border-line bg-paper"
  );
}

function moodColor(mood: number): string {
  const colors: Record<number, string> = {
    1: "var(--speaking)",
    2: "color-mix(in srgb, var(--speaking) 50%, var(--accent-soft))",
    3: "var(--accent-soft)",
    4: "color-mix(in srgb, var(--writing) 50%, var(--accent-soft))",
    5: "var(--writing)",
  };
  return colors[mood] ?? "var(--accent-soft)";
}
