"use client";

import { useState, type FormEvent } from "react";
import { usePlanStore } from "@/context/PlanStore";
import { ui } from "@/lib/ui";

export function LockScreen() {
  const { status, error, clearError, signUp, logIn, forgotPassword } = usePlanStore();
  const isSignup = status === "needs-signup";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isSignup) {
        await signUp(password, confirmPassword);
      } else {
        await logIn(password);
      }
    } finally {
      setSubmitting(false);
    }
  }

  function handleForgot() {
    if (
      confirm(
        "Esto borrará todos los datos guardados en este dispositivo (calendario, planes, puntajes). ¿Seguro que quieres continuar?"
      )
    ) {
      forgotPassword();
      setPassword("");
      setConfirmPassword("");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className={`max-w-sm w-full ${ui.card}`}>
        <span className={`${ui.label} block mb-1.5`}>Acceso privado</span>
        <h1 className="text-2xl font-semibold">Tu plan TOEFL</h1>
        <p className="text-ink-soft text-sm mt-2">
          {isSignup
            ? "Primera vez aquí — crea una contraseña para proteger tu plan."
            : "Ingresa tu contraseña para desbloquear tu plan."}
        </p>

        <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
          <div>
            <label htmlFor="password" className={ui.label}>
              {isSignup ? "Crea una contraseña" : "Contraseña"}
            </label>
            <input
              id="password"
              type="password"
              autoComplete={isSignup ? "new-password" : "current-password"}
              minLength={6}
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (error) clearError();
              }}
              className={`${ui.input} mt-1`}
            />
          </div>

          {isSignup && (
            <div>
              <label htmlFor="confirm-password" className={ui.label}>
                Repite la contraseña
              </label>
              <input
                id="confirm-password"
                type="password"
                autoComplete="new-password"
                minLength={6}
                required
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (error) clearError();
                }}
                className={`${ui.input} mt-1`}
              />
            </div>
          )}

          <div className="text-sm text-speaking min-h-[1.2em]">{error}</div>

          <button type="submit" disabled={submitting} className={ui.btnPrimary}>
            {isSignup ? "Crear y entrar" : "Entrar"}
          </button>

          {!isSignup && (
            <button type="button" onClick={handleForgot} className={`${ui.linkDanger} text-left`}>
              Olvidé mi contraseña
            </button>
          )}
        </form>

        <p className="text-xs text-ink-soft mt-4 leading-relaxed">
          Tus datos (calendario, planes, puntajes) se cifran en este dispositivo con AES-256 a partir de tu
          contraseña — nadie puede leerlos sin ella. Si olvidas la contraseña no hay forma de recuperar lo
          guardado: usa &quot;Exportar respaldo&quot; seguido para tener una copia de seguridad.
        </p>
      </div>
    </div>
  );
}
