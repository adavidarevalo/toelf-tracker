"use client";

import { useState, type FormEvent } from "react";
import { usePlanStore } from "@/context/PlanStore";
import { ui } from "@/lib/ui";

export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { error, clearError, changePassword } = usePlanStore();
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirmNext, setConfirmNext] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  if (!open) return null;

  function reset() {
    setCurrent("");
    setNext("");
    setConfirmNext("");
    setDone(false);
    clearError();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      await changePassword(current, next, confirmNext);
      setDone(true);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-5"
      onClick={() => {
        reset();
        onClose();
      }}
    >
      <div className={`max-w-sm w-full ${ui.card}`} onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold mb-3.5">Cambiar contraseña</h3>
        {done ? (
          <>
            <p className="text-sm text-ink-soft">Contraseña actualizada correctamente.</p>
            <div className="flex justify-end mt-4">
              <button
                className={ui.btnPrimary}
                onClick={() => {
                  reset();
                  onClose();
                }}
              >
                Cerrar
              </button>
            </div>
          </>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <div>
              <label className={ui.label} htmlFor="cp-current">
                Contraseña actual
              </label>
              <input
                id="cp-current"
                type="password"
                required
                value={current}
                onChange={(e) => setCurrent(e.target.value)}
                className={`${ui.input} mt-1`}
              />
            </div>
            <div>
              <label className={ui.label} htmlFor="cp-new">
                Nueva contraseña
              </label>
              <input
                id="cp-new"
                type="password"
                minLength={6}
                required
                value={next}
                onChange={(e) => setNext(e.target.value)}
                className={`${ui.input} mt-1`}
              />
            </div>
            <div>
              <label className={ui.label} htmlFor="cp-new2">
                Repite la nueva contraseña
              </label>
              <input
                id="cp-new2"
                type="password"
                minLength={6}
                required
                value={confirmNext}
                onChange={(e) => setConfirmNext(e.target.value)}
                className={`${ui.input} mt-1`}
              />
            </div>
            <div className="text-sm text-speaking min-h-[1.2em]">{error}</div>
            <div className="flex justify-end gap-2 mt-1">
              <button
                type="button"
                className={ui.btn}
                onClick={() => {
                  reset();
                  onClose();
                }}
              >
                Cancelar
              </button>
              <button type="submit" disabled={submitting} className={ui.btnPrimary}>
                Guardar
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
