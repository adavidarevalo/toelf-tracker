"use client";

import { useState } from "react";
import { usePlanStore } from "@/context/PlanStore";
import { ui } from "@/lib/ui";

export function SyncCodeModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { syncCode } = usePlanStore();
  const [copied, setCopied] = useState(false);

  if (!open) return null;

  async function handleCopy() {
    if (!syncCode) return;
    await navigator.clipboard.writeText(syncCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5" onClick={onClose}>
      <div className={`max-w-sm w-full ${ui.card}`} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-1.5">Sincronización entre dispositivos</h3>
        <p className="text-sm text-ink-soft mb-3.5">
          Usa este código en tus otros dispositivos (botón &quot;¿Ya tienes cuenta en otro dispositivo?&quot; en la
          pantalla de acceso) para ver el mismo plan en todos lados.
        </p>

        {syncCode ? (
          <div className="rounded-md border border-line bg-paper px-3 py-3 flex items-center justify-between gap-3">
            <span className="tabular text-base tracking-wide">{syncCode}</span>
            <button type="button" className={ui.btnSmall} onClick={handleCopy}>
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-ink-soft">
            Todavía no hay un código — se genera automáticamente la próxima vez que se guarde algo.
          </p>
        )}

        <p className="text-xs text-ink-soft mt-3.5 leading-relaxed">
          Cualquiera con este código puede acceder a tu cuenta sincronizada (aunque no puede leer tus datos sin tu
          contraseña) — trátalo con la misma privacidad que una contraseña.
        </p>

        <div className="flex justify-end mt-4">
          <button type="button" className={ui.btnPrimary} onClick={onClose}>
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
