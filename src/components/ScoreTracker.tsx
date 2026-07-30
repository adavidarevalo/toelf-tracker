"use client";

import { useState } from "react";
import { usePlanStore } from "@/context/PlanStore";
import { CHECKPOINTS } from "@/data/plan";
import { downloadFullPlanMarkdown, downloadFullPlanPdf } from "@/lib/report";
import { computeGoalSummary, sumScores } from "@/lib/scoring";
import type { CheckpointId, Skill } from "@/lib/types";
import { ui } from "@/lib/ui";

const SKILL_COLUMNS: { key: Skill; label: string }[] = [
  { key: "r", label: "Reading" },
  { key: "l", label: "Listening" },
  { key: "s", label: "Speaking" },
  { key: "w", label: "Writing" },
];

export function ScoreTracker() {
  const { appData, updateAppData } = usePlanStore();
  const [exportingPdf, setExportingPdf] = useState(false);
  if (!appData) return null;

  const goal = computeGoalSummary(appData.baseline);

  async function handleDownloadPdf() {
    if (!appData) return;
    setExportingPdf(true);
    try {
      await downloadFullPlanPdf(appData);
    } finally {
      setExportingPdf(false);
    }
  }

  function setField(id: CheckpointId, key: Skill, raw: string) {
    const value = raw === "" ? null : Number(raw);
    updateAppData((draft) => {
      draft.tracker[id][key] = value;
    });
  }

  function setNotes(id: CheckpointId, notes: string) {
    updateAppData((draft) => {
      draft.tracker[id].notes = notes;
    });
  }

  return (
    <section id="tracker">
      <div className={ui.sectionHead}>
        <h2 className={ui.sectionTitle}>7. Registro de progreso</h2>
        <span className="text-ink-soft text-sm">Entra tus puntajes reales en cada checkpoint</span>
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-ink-soft text-xs">Informe completo (todas las secciones):</span>
          <button type="button" className={ui.btnSmall} onClick={() => downloadFullPlanMarkdown(appData)}>
            Descargar .md
          </button>
          <button type="button" className={ui.btnSmall} onClick={handleDownloadPdf} disabled={exportingPdf}>
            {exportingPdf ? "Generando…" : "Descargar .pdf"}
          </button>
        </div>
      </div>
      <div className={ui.card}>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse min-w-[720px]">
            <thead>
              <tr>
                {["Checkpoint", "Reading", "Listening", "Speaking", "Writing", "Total", "Meta", "Notas"].map((h) => (
                  <th
                    key={h}
                    className="text-left text-[0.66rem] uppercase tracking-wide text-ink-soft px-2.5 py-2 font-semibold border-b border-line"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {CHECKPOINTS.map((cp) => {
                const entry = appData.tracker[cp.id];
                const total = sumScores(entry);
                const target = goal.checkpointTargets[cp.id];
                return (
                  <tr key={cp.id}>
                    <td className="font-semibold text-sm whitespace-nowrap px-2.5 py-1.5 border-b border-line">
                      {cp.name}
                      <br />
                      <span className="font-normal text-ink-soft text-[0.72rem]">{cp.weekLabel}</span>
                    </td>
                    {SKILL_COLUMNS.map((col) => (
                      <td key={col.key} className="px-2.5 py-1.5 border-b border-line">
                        <input
                          type="number"
                          min={0}
                          max={30}
                          value={entry[col.key] ?? ""}
                          onChange={(e) => setField(cp.id, col.key, e.target.value)}
                          className="tabular w-[52px] text-center px-1.5 py-1 rounded border border-line bg-paper text-ink"
                        />
                      </td>
                    ))}
                    <td className="tabular font-bold px-2.5 py-1.5 border-b border-line">{total ?? "—"}</td>
                    <td className="tabular text-ink-soft px-2.5 py-1.5 border-b border-line">
                      {target !== undefined ? Math.round(target) : "—"}
                    </td>
                    <td className="px-2.5 py-1.5 border-b border-line">
                      <input
                        type="text"
                        value={entry.notes}
                        onChange={(e) => setNotes(cp.id, e.target.value)}
                        placeholder="..."
                        className="w-full min-w-[140px] px-2 py-1 rounded border border-line bg-paper text-ink text-[0.82rem]"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <ScoreChart totals={CHECKPOINTS.map((cp) => ({ id: cp.id, label: cp.weekLabel, total: sumScores(appData.tracker[cp.id]) }))} />
      </div>
    </section>
  );
}

function ScoreChart({ totals }: { totals: { id: string; label: string; total: number | null }[] }) {
  return (
    <div className="mt-5">
      <div className="flex items-end gap-3.5 h-40 px-1 relative border-b border-line">
        <span className="absolute right-0 text-[0.65rem] text-accent-soft" style={{ bottom: "calc(75% + 4px)" }}>
          meta 90
        </span>
        <div className="absolute left-0 right-0 border-t border-dashed border-accent-soft" style={{ bottom: "75%" }} />
        {totals.map((t) => {
          const pct = t.total === null ? 0.5 : Math.max(0.5, (t.total / 120) * 100);
          return (
            <div key={t.id} className="flex-1 flex flex-col items-center justify-end h-full gap-1.5">
              <div className="tabular text-[0.68rem] text-ink-soft">{t.total ?? ""}</div>
              <div
                className="w-3/5 max-w-[34px] bg-accent rounded-t transition-[height] duration-200"
                style={{ height: `${pct}%`, minHeight: 2 }}
              />
              <div className="text-[0.6rem] text-ink-soft text-center mt-0.5">{t.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
