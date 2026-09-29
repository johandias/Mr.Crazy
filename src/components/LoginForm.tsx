"use client";

import { type FormEvent, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowRight,
  LockKeyhole,
  UserPlus,
  LogIn,
  AlertCircle,
  CheckCircle2,
  MailCheck,
  RefreshCw,
  KeyRound
} from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<"login" | "register" | "verify">("login");

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("masculino");
  const [verificationCode, setVerificationCode] = useState("");
  const [verificationEmail, setVerificationEmail] = useState("");

  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [resendStatus, setResendStatus] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResending, setIsResending] = useState(false);

  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
      setVerificationEmail(emailParam);
    }

    if (searchParams.get("verify") === "1" || searchParams.get("pending") === "1") {
      setTab("verify");
      if (emailParam) setVerificationEmail(emailParam);
      setSuccessMessage(
        "Enviamos um código de 6 dígitos e um link de confirmação para seu e-mail. Digite o código para validar sua conta."
      );
    } else if (searchParams.get("verifyError") === "invalid") {
      setTab("verify");
      if (emailParam) setVerificationEmail(emailParam);
      setErrorMessage("O link ou código de confirmação expirou ou é inválido. Digite o código ou solicite um novo.");
    } else if (searchParams.get("verifyError") === "missing") {
      setTab("verify");
      setErrorMessage("Link de validação incompleto. Informe seu e-mail e o código de 6 dígitos.");
    } else if (searchParams.get("rejected") === "1") {
      setErrorMessage("Seu acesso foi suspenso ou recusado pelo administrador.");
    } else if (searchParams.get("switch") === "1") {
      setSuccessMessage("Sessão anterior finalizada. Digite as credenciais da sua outra conta para entrar.");
    } else if (searchParams.get("reset") === "1") {
      setSuccessMessage("Você saiu da sua conta com sucesso.");
    }
  }, [searchParams]);

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setResendStatus("");
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
        needsVerification: boolean;
        email: string;
      }>;

      if (!response.ok) {
        if (result.status === "pending" || result.needsVerification) {
          const targetEmail = result.email || email;
          setVerificationEmail(targetEmail);
          setTab("verify");
          setSuccessMessage(
            "Sua conta ainda não foi ativada. Digite o código de 6 dígitos enviado para seu e-mail para validar."
          );
          return;
        }
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
    setResendStatus("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, nickname, age, gender })
      });
      const result = (await response.json()) as Partial<{
        error: string;
        message: string;
        status: string;
        needsVerification: boolean;
        email: string;
        redirectTo: string;
      }>;

      if (!response.ok) {
        throw new Error(result.error ?? "Erro ao criar conta.");
      }

      if (result.status === "pending" || result.needsVerification) {
        const targetEmail = result.email || email;
        setVerificationEmail(targetEmail);
        setTab("verify");
        setPassword("");
        setSuccessMessage(
          result.message ||
            "Conta criada com sucesso! Enviamos um código de 6 dígitos e um link de confirmação para seu e-mail. Digite o código para validar sua conta."
        );
        return;
      }

      setSuccessMessage(result.message ?? "Conta criada com sucesso! Redirecionando...");
      router.replace(result.redirectTo ?? "/practice");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro ao cadastrar.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleVerify(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");
    setResendStatus("");
    setIsSubmitting(true);

    const targetEmail = (verificationEmail || email).trim().toLowerCase();
    const targetCode = verificationCode.trim();

    if (!targetEmail) {
      setErrorMessage("Informe o e-mail associado à conta.");
      setIsSubmitting(false);
      return;
    }

    if (!targetCode || targetCode.length < 6) {
      setErrorMessage("Digite o código de 6 dígitos completo enviado para seu e-mail.");
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail, code: targetCode })
      });

      const result = (await response.json()) as Partial<{
        error: string;
        message: string;
        redirectTo: string;
      }>;

      if (!response.ok) {
        throw new Error(result.error ?? "Código de confirmação incorreto ou expirado.");
      }

      setSuccessMessage(result.message ?? "Conta confirmada com sucesso! Redirecionando...");
      setTimeout(() => {
        router.replace(searchParams.get("next") ?? result.redirectTo ?? "/practice");
        router.refresh();
      }, 800);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Erro ao validar o código.");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleResendCode() {
    const targetEmail = (verificationEmail || email).trim().toLowerCase();
    if (!targetEmail) {
      setErrorMessage("Informe seu e-mail para receber um novo código.");
      return;
    }

    setIsResending(true);
    setResendStatus("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: targetEmail })
      });

      const data = (await response.json()) as Partial<{ error: string; message: string }>;

      if (!response.ok) {
        throw new Error(data.error || "Não foi possível reenviar o código.");
      }

      setResendStatus(data.message || "Novo código enviado com sucesso para seu e-mail!");
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao reenviar código.");
    } finally {
      setIsResending(false);
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
            setSuccessMessage("");
            setResendStatus("");
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
            setSuccessMessage("");
            setResendStatus("");
          }}
          type="button"
        >
          <UserPlus size={16} />
          Criar Conta
        </button>
        {tab === "verify" && (
          <button className="auth-tab-btn active" type="button">
            <MailCheck size={16} />
            Validar E-mail
          </button>
        )}
      </div>

      {successMessage ? (
        <div className="auth-notice success-notice">
          <CheckCircle2 size={18} />
          <span>{successMessage}</span>
        </div>
      ) : null}

      {resendStatus ? (
        <div className="auth-notice success-notice">
          <MailCheck size={18} />
          <span>{resendStatus}</span>
        </div>
      ) : null}

      {errorMessage ? (
        <div className="auth-notice error-notice">
          <AlertCircle size={18} />
          <span>{errorMessage}</span>
        </div>
      ) : null}

      {tab === "login" && (
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
      )}

      {tab === "register" && (
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

          <div className="auth-form-row">
            <label className="auth-half-field">
              Sua Idade
              <input
                type="number"
                min="10"
                max="120"
                required
                placeholder="Ex: 26"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
            </label>
            <label className="auth-half-field">
              Sexo / Gênero
              <select
                required
                value={gender}
                onChange={(e) => setGender(e.target.value)}
              >
                <option value="masculino">Masculino</option>
                <option value="feminino">Feminino</option>
                <option value="outro">Outro</option>
                <option value="prefiro_nao_dizer">Prefiro não dizer</option>
              </select>
            </label>
          </div>

          <p className="auth-helper-text">
            🔒 Ao cadastrar, enviaremos um código de 6 dígitos e um link para o seu e-mail para validar seu acesso instantaneamente.
          </p>
          <button className="primary-link" disabled={isSubmitting} type="submit">
            <UserPlus size={18} />
            {isSubmitting ? "Criando conta..." : "Criar Conta & Receber Código"}
            <ArrowRight size={18} />
          </button>
        </form>
      )}

      {tab === "verify" && (
        <form className="login-form auth-verify-form" onSubmit={handleVerify}>
          <div className="auth-verify-header" style={{ textAlign: "center", marginBottom: 16 }}>
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
              Código de Ativação
            </h3>
            <p style={{ margin: 0, fontSize: "0.85rem", color: "#94a3b8", lineHeight: 1.4 }}>
              Enviamos um código de 6 dígitos e um link para{" "}
              <strong style={{ color: "#f59e0b" }}>{verificationEmail || email}</strong>.
            </p>
          </div>

          <label>
            E-mail cadastrado
            <input
              autoComplete="email"
              inputMode="email"
              onChange={(e) => setVerificationEmail(e.target.value)}
              placeholder="seu-email@exemplo.com"
              required
              type="email"
              value={verificationEmail || email}
            />
          </label>

          <label>
            Código de 6 dígitos
            <input
              autoComplete="one-time-code"
              autoFocus
              inputMode="numeric"
              maxLength={6}
              onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              required
              style={{
                textAlign: "center",
                fontSize: "1.5rem",
                letterSpacing: "8px",
                fontWeight: 800,
                fontFamily: "monospace"
              }}
              type="text"
              value={verificationCode}
            />
          </label>

          <button className="primary-link" disabled={isSubmitting} type="submit">
            <MailCheck size={18} />
            {isSubmitting ? "Validando..." : "Validar Código & Entrar"}
            <ArrowRight size={18} />
          </button>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: 14,
              fontSize: "0.85rem"
            }}
          >
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isResending}
              style={{
                background: "transparent",
                border: "none",
                color: "#f59e0b",
                display: "inline-flex",
                alignItems: "center",
                gap: 6,
                cursor: isResending ? "not-allowed" : "pointer",
                padding: "6px 0",
                textDecoration: "underline"
              }}
            >
              <RefreshCw size={14} className={isResending ? "animate-spin" : ""} />
              {isResending ? "Enviando..." : "Reenviar código por e-mail"}
            </button>

            <button
              type="button"
              onClick={() => {
                setTab("login");
                setErrorMessage("");
                setSuccessMessage("");
              }}
              style={{
                background: "transparent",
                border: "none",
                color: "#94a3b8",
                cursor: "pointer",
                padding: "6px 0",
                textDecoration: "underline"
              }}
            >
              Voltar ao login
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
