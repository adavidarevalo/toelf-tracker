"use client";

import { useMemo } from "react";
import { usePlanStore } from "@/context/PlanStore";
import { computeGoalSummary } from "@/lib/scoring";
import type { Skill } from "@/lib/types";
import { ui } from "@/lib/ui";

const FIELDS: { key: Skill; label: string; borderClass: string }[] = [
  { key: "r", label: "Reading", borderClass: "focus-within:border-reading" },
  { key: "l", label: "Listening", borderClass: "focus-within:border-listening" },
  { key: "s", label: "Speaking", borderClass: "focus-within:border-speaking" },
  { key: "w", label: "Writing", borderClass: "focus-within:border-writing" },
];

export function GoalCalculator() {
  const { appData, updateAppData } = usePlanStore();

  const summary = useMemo(() => {
    if (!appData) return null;
    return computeGoalSummary(appData.baseline);
  }, [appData]);

  if (!appData || !summary) return null;

  function setBaseline(key: Skill, raw: string) {
    const value = raw === "" ? null : Number(raw);
    updateAppData((draft) => {
      draft.baseline[key] = value;
    });
  }

  const { baselineTotal, gap, checkpointTargets } = summary;
  const hasBaseline = baselineTotal !== null;

  return (
    <section id="goal">
      <div className={ui.sectionHead}>
        <h2 className={ui.sectionTitle}>2. Calcula tus metas</h2>
        <span className="text-ink-soft text-sm">Diagnóstico de la Semana 1</span>
      </div>
      <div className={ui.card}>
        <p className="text-ink-soft text-sm">
          Anota tu puntaje por sección (escala 0–30 cada una) apenas hagas el diagnóstico.
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 mt-3.5">
          {FIELDS.map((f) => (
            <div key={f.key} className="flex flex-col gap-1">
              <label className={ui.label} htmlFor={`base-${f.key}`}>
                {f.label}
              </label>
              <input
                id={`base-${f.key}`}
                type="number"
                min={0}
                max={30}
                value={appData.baseline[f.key] ?? ""}
                onChange={(e) => setBaseline(f.key, e.target.value)}
                className={`tabular text-base py-2 px-2.5 rounded-md border border-line bg-paper text-ink w-full transition-colors ${f.borderClass} focus:outline-none`}
              />
            </div>
          ))}
        </div>

        <div className="flex gap-6 flex-wrap mt-4.5 pt-4 border-t border-dashed border-line">
          <Result label="Diagnóstico total" value={hasBaseline ? baselineTotal : "—"} />
          <Result label="Puntos por subir" value={hasBaseline ? (gap > 0 ? gap : "¡lograda!") : "—"} />
          <Result label="Meta semana 4" value={hasBaseline ? checkpointTargets.cp1 : "—"} highlight />
          <Result label="Meta semana 8" value={hasBaseline ? checkpointTargets.cp2 : "—"} highlight />
          <Result label="Meta semana 12" value={hasBaseline ? checkpointTargets.cp3 : "—"} highlight />
          <Result label="Meta semana 16" value={hasBaseline ? 90 : "—"} highlight />
        </div>
      </div>
    </section>
  );
}

function Result({ label, value, highlight }: { label: string; value: React.ReactNode; highlight?: boolean }) {
  return (
    <div className="min-w-[100px]">
      <div className={`tabular text-[1.35rem] font-bold ${highlight ? "text-accent" : ""}`}>{value}</div>
      <div className="text-[0.68rem] uppercase tracking-wide text-ink-soft">{label}</div>
    </div>
  );
}
