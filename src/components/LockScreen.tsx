"use client";

import { useState, type FormEvent } from "react";
import { usePlanStore } from "@/context/PlanStore";
import { ui } from "@/lib/ui";

export function LockScreen() {
  const { status, error, clearError, signUp, logIn, forgotPassword, linkError, clearLinkError, linkDevice } =
    usePlanStore();
  const isSignup = status === "needs-signup";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const [linking, setLinking] = useState(false);
  const [linkCode, setLinkCode] = useState("");
  const [linkSubmitting, setLinkSubmitting] = useState(false);

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

  async function handleLinkSubmit(e: FormEvent) {
    e.preventDefault();
    setLinkSubmitting(true);
    try {
      const ok = await linkDevice(linkCode);
      if (ok) {
        setLinking(false);
        setLinkCode("");
      }
    } finally {
      setLinkSubmitting(false);
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

        {isSignup && !linking && (
          <button type="button" onClick={() => setLinking(true)} className={`${ui.linkAccent} text-left mt-3.5 block`}>
            ¿Ya tienes cuenta en otro dispositivo?
          </button>
        )}

        {isSignup && linking && (
          <form onSubmit={handleLinkSubmit} className="mt-4 pt-4 border-t border-line flex flex-col gap-3">
            <div>
              <label htmlFor="link-code" className={ui.label}>
                Código de sincronización
              </label>
              <input
                id="link-code"
                type="text"
                autoCapitalize="characters"
                autoCorrect="off"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                required
                value={linkCode}
                onChange={(e) => {
                  setLinkCode(e.target.value);
                  if (linkError) clearLinkError();
                }}
                className={`${ui.input} mt-1 uppercase`}
              />
            </div>
            <div className="text-sm text-speaking min-h-[1.2em]">{linkError}</div>
            <div className="flex gap-2">
              <button type="submit" disabled={linkSubmitting} className={ui.btnPrimary}>
                Vincular dispositivo
              </button>
              <button
                type="button"
                className={ui.btn}
                onClick={() => {
                  setLinking(false);
                  setLinkCode("");
                  clearLinkError();
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        )}

        <p className="text-xs text-ink-soft mt-4 leading-relaxed">
          Tus datos (calendario, planes, puntajes) se cifran en este dispositivo con AES-256 a partir de tu
          contraseña — nadie puede leerlos sin ella. Si olvidas la contraseña no hay forma de recuperar lo
          guardado: usa &quot;Exportar respaldo&quot; seguido para tener una copia de seguridad.
        </p>
      </div>
    </div>
  );
}
