"use client";

import { type FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, ArrowRight, CheckCircle2, KeyRound, LockKeyhole } from "lucide-react";

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [token, setToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    setEmail(searchParams.get("email") || "");
    setToken(searchParams.get("token") || "");
  }, [searchParams]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email || !token) {
      setErrorMessage("Link de redefinição incompleto. Peça um novo em 'Esqueci minha senha'.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("A nova senha deve ter pelo menos 6 caracteres.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("As senhas não conferem.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/reset-password/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, token, password })
      });
      const result = (await response.json()) as Partial<{
        error: string;
        message: string;
        redirectTo: string;
      }>;

      if (!response.ok) {
        throw new Error(result.error || "Não foi possível redefinir a senha.");
      }

      setSuccessMessage(result.message || "Senha redefinida com sucesso.");
      setTimeout(() => {
        router.replace(result.redirectTo || "/login?passwordReset=1");
        router.refresh();
      }, 900);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao redefinir senha.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-card-container">
      {successMessage ? (
        <div className="auth-notice success-notice">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="auth-notice error-notice">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      <form className="login-form" onSubmit={handleSubmit}>
        <div className="auth-verify-header" style={{ textAlign: "center", marginBottom: 8 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.4)",
              color: "#f59e0b",
              marginBottom: 10
            }}
          >
            <KeyRound size={24} />
          </div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, margin: "0 0 6px 0", color: "#f8fafc" }}>
            Criar nova senha
          </h3>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.4 }}>
            Escolha uma senha nova para continuar treinando com o Mr.Crazy.
          </p>
        </div>

        <label>
          E-mail
          <input
            autoComplete="email"
            inputMode="email"
            onChange={(event) => setEmail(event.target.value)}
            placeholder="seu-email@exemplo.com"
            required
            type="email"
            value={email}
          />
        </label>

        <label>
          Nova senha
          <input
            autoComplete="new-password"
            minLength={6}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Digite a nova senha"
            required
            type="password"
            value={password}
          />
        </label>

        <label>
          Confirmar nova senha
          <input
            autoComplete="new-password"
            minLength={6}
            onChange={(event) => setConfirmPassword(event.target.value)}
            placeholder="Repita a nova senha"
            required
            type="password"
            value={confirmPassword}
          />
        </label>

        <button className="primary-link" disabled={isSubmitting} type="submit">
          <LockKeyhole size={18} />
          {isSubmitting ? "Salvando..." : "Redefinir Senha"}
          <ArrowRight size={18} />
        </button>
      </form>
    </div>
  );
}
