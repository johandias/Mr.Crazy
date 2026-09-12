"use client";

import { type FormEvent, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, LockKeyhole, UserPlus, LogIn, Clock, AlertCircle, CheckCircle2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"login" | "register">("login");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (searchParams.get("pending") === "1") {
      setErrorMessage("Sua conta foi criada e está aguardando aprovação do administrador.");
    } else if (searchParams.get("rejected") === "1") {
      setErrorMessage("Seu acesso foi suspenso ou recusado pelo administrador.");
    }
  }, [searchParams]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const result = (await response.json()) as Partial<{
        error: string;
        redirectTo: string;
        status: string;
      }>;

      if (!response.ok) {
        throw new Error(result.error ?? "E-mail ou senha inválidos.");
      }

      router.replace(searchParams.get("next") ?? result.redirectTo ?? "/practice");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "E-mail ou senha inválidos.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nickname })
      });
      const result = (await response.json()) as Partial<{
        error: string;
        message: string;
        status: string;
        redirectTo: string;
      }>;

      if (!response.ok) {
        throw new Error(result.error ?? "Erro ao realizar cadastro.");
      }

      if (result.status === "approved") {
        router.replace(result.redirectTo ?? "/practice");
        router.refresh();
        return;
      }

      setSuccessMessage(
        result.message ?? "Conta cadastrada com sucesso! Aguardando aprovação do administrador."
      );
      setTab("login");
      setPassword("");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro ao cadastrar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="auth-card-container">
      <div className="auth-tab-selector" role="tablist">
        <button
          className={`auth-tab-btn ${tab === "login" ? "active" : ""}`}
          onClick={() => {
            setTab("login");
            setErrorMessage("");
          }}
          type="button"
        >
          <LogIn size={16} />
          Entrar
        </button>
        <button
          className={`auth-tab-btn ${tab === "register" ? "active" : ""}`}
          onClick={() => {
            setTab("register");
            setErrorMessage("");
          }}
          type="button"
        >
          <UserPlus size={16} />
          Criar Conta
        </button>
      </div>

      {successMessage ? (
        <div className="auth-notice success-notice">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="auth-notice error-notice">
          {errorMessage.includes("aguardando aprovação") ? (
            <Clock size={18} />
          ) : (
            <AlertCircle size={18} />
          )}
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {tab === "login" ? (
        <form className="login-form" onSubmit={handleLogin}>
          <label>
            E-mail ou Usuário
            <input
              autoComplete="email"
              autoFocus
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu-email@exemplo.com"
              required
              type="text"
              value={email}
            />
          </label>
          <label>
            Senha
            <input
              autoComplete="current-password"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="********"
              required
              type="password"
              value={password}
            />
          </label>
          <button className="primary-link" disabled={isSubmitting} type="submit">
            <LockKeyhole size={18} />
            {isSubmitting ? "Autenticando..." : "Entrar no Mr.Crazy"}
            <ArrowRight size={18} />
          </button>
        </form>
      ) : (
        <form className="login-form" onSubmit={handleRegister}>
          <label>
            Seu E-mail
            <input
              autoComplete="email"
              autoFocus
              inputMode="email"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="seu-email@exemplo.com"
              required
              type="email"
              value={email}
            />
          </label>
          <label>
            Senha (mínimo 6 caracteres)
            <input
              autoComplete="new-password"
              minLength={6}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Crie uma senha forte"
              required
              type="password"
              value={password}
            />
          </label>
          <label>
            Como você quer ser chamado? (Apelido/Nome)
            <input
              autoComplete="nickname"
              onChange={(event) => setNickname(event.target.value)}
              placeholder="Ex: Carlos, Ju, Rafa"
              type="text"
              value={nickname}
            />
          </label>
          <p className="auth-helper-text">
            ℹ️ O Mr.Crazy é restrito. Ao criar sua conta, ela será submetida para aprovação do administrador antes do primeiro acesso.
          </p>
          <button className="primary-link" disabled={isSubmitting} type="submit">
            <UserPlus size={18} />
            {isSubmitting ? "Criando solicitação..." : "Solicitar Acesso"}
            <ArrowRight size={18} />
          </button>
        </form>
      )}
    </div>
  );
}
