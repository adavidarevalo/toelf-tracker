"use client";

import { useMemo, useRef, useState, type ChangeEvent } from "react";
import { usePlanStore } from "@/context/PlanStore";
import { computeStreak } from "@/lib/scoring";
import { TOTAL_WEEKS, GOAL_SCORE } from "@/data/plan";
import { ui } from "@/lib/ui";
import { ChangePasswordModal } from "@/components/ChangePasswordModal";
import { SyncCodeModal } from "@/components/SyncCodeModal";

export function TopBar() {
  const { appData, syncStatus, logOut, exportBackup, importBackup } = usePlanStore();
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [syncCodeOpen, setSyncCodeOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const streak = useMemo(() => (appData ? computeStreak(appData.studyLog) : 0), [appData]);

  async function handleImportChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      await importBackup(file);
      alert("Respaldo importado correctamente.");
    } catch {
      alert("El archivo no es un respaldo válido.");
    }
  }

  return (
    <div className="sticky top-0 z-10 backdrop-blur-md bg-paper/90 border-b border-line">
      <div className="max-w-[1000px] mx-auto px-5 py-3 flex flex-wrap items-center justify-between gap-x-5 gap-y-2.5">
        <div>
          <span className={`${ui.label} block mb-0.5`}>Plan de estudio · {TOTAL_WEEKS} semanas</span>
          <h1 className="text-lg font-semibold">TOEFL iBT — meta {GOAL_SCORE}</h1>
        </div>

        <div className="hidden sm:flex gap-4.5 gap-x-5">
          <div className="text-right">
            <div className="tabular text-[0.95rem] font-bold">
              {GOAL_SCORE}
              <span className="text-ink-soft">/120</span>
            </div>
            <div className="text-[0.63rem] uppercase tracking-wide text-ink-soft">Meta</div>
          </div>
          <div className="text-right">
            <div className="tabular text-[0.95rem] font-bold">{streak}</div>
            <div className="text-[0.63rem] uppercase tracking-wide text-ink-soft">Racha</div>
          </div>
          <div className="text-right">
            <div className="tabular text-[0.95rem] font-bold">{TOTAL_WEEKS}</div>
            <div className="text-[0.63rem] uppercase tracking-wide text-ink-soft">Semanas</div>
          </div>
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {syncStatus === "local-only" && (
            <span
              className="text-[0.68rem] text-speaking border border-speaking/40 rounded-full px-2.5 py-1"
              title="No se pudo sincronizar con el servidor — tus cambios solo están guardados en este dispositivo por ahora."
            >
              Solo en este dispositivo
            </span>
          )}
          <button className={ui.btnSmall} onClick={exportBackup}>
            Exportar respaldo
          </button>
          <label className={`${ui.btnSmall} cursor-pointer`}>
            Importar
            <input ref={fileInputRef} type="file" accept="application/json" className="hidden" onChange={handleImportChange} />
          </label>
          <button className={ui.btnSmall} onClick={() => setSyncCodeOpen(true)}>
            Sincronización
          </button>
          <button className={ui.btnSmall} onClick={() => setChangePwOpen(true)}>
            Contraseña
          </button>
          <button className={ui.btnSmall} onClick={logOut}>
            Cerrar sesión
          </button>
        </div>
      </div>

      <ChangePasswordModal open={changePwOpen} onClose={() => setChangePwOpen(false)} />
      <SyncCodeModal open={syncCodeOpen} onClose={() => setSyncCodeOpen(false)} />
    </div>
  );
}
