"use client";

import { useMemo } from "react";
import clsx from "clsx";
import { usePlanStore } from "@/context/PlanStore";
import { computePrizeProgress } from "@/lib/scoring";
import { ui } from "@/lib/ui";

export function PrizeCard() {
  const { appData } = usePlanStore();

  const progress = useMemo(() => {
    if (!appData) return null;
    return computePrizeProgress(appData.studyLog, appData.baseline, appData.tracker.cp2);
  }, [appData]);

  if (!appData || !progress) return null;

  return (
    <section>
      <div className={ui.sectionHead}>
        <h2 className={ui.sectionTitle}>1. Tu premio: una tablet</h2>
        <span className="text-ink-soft text-sm">Semanas 1–8</span>
      </div>
      <div className={clsx(ui.card, progress.unlocked && "border-accent-soft")}>
        <p className="text-ink-soft text-sm">
          Si mantienes la constancia y muestras progreso real en los primeros dos meses, te ganas la tablet. Se
          necesitan las dos condiciones:
        </p>

        <div className="text-[0.78rem] text-ink-soft mt-3.5 mb-1.5">
          Constancia — días de estudio registrados (semanas 1–8)
        </div>
        <div className="h-2.5 rounded-full bg-paper border border-line overflow-hidden">
          <div
            className="h-full bg-accent-soft transition-[width] duration-300"
            style={{ width: `${progress.progressPercent}%` }}
          />
        </div>
        <div className="tabular text-xs text-ink-soft mt-1.5">
          {progress.studiedDays}/{progress.threshold} días
        </div>

        <ul className="grid gap-2 mt-4 list-none p-0">
          <PrizeCheck met={progress.consistencyMet}>
            Constancia: al menos {progress.threshold} de {progress.expectedDays} días de estudio marcados como
            &quot;Estudié&quot;
          </PrizeCheck>
          <PrizeCheck met={progress.progressMet}>
            Progreso: Checkpoint 2 (semana 8) completado y con mejora sobre tu diagnóstico
          </PrizeCheck>
        </ul>

        {progress.unlocked && (
          <div className="mt-4 px-4 py-3 rounded-lg border border-accent-soft bg-accent-soft/15 font-semibold text-sm flex items-center">
            Desbloqueaste tu premio — la tablet es tuya.
          </div>
        )}
      </div>
    </section>
  );
}

function PrizeCheck({ met, children }: { met: boolean; children: React.ReactNode }) {
  return (
    <li
      className={clsx(
        "px-3 py-2 rounded-md border text-sm",
        met ? "border-accent-soft bg-accent-soft/10 text-ink" : "border-line bg-paper text-ink-soft"
      )}
    >
      <span className={clsx("font-bold mr-1.5", met ? "text-accent-soft" : "text-ink-soft")}>{met ? "✓" : "○"}</span>
      {children}
    </li>
  );
}
