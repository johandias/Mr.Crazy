"use client";

import { type FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowRight, LockKeyhole } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password })
      });
      const result = (await response.json()) as Partial<{ error: string; redirectTo: string }>;

      if (!response.ok) {
        throw new Error(result.error ?? "Login ou senha inválidos.");
      }

      router.replace(searchParams.get("next") ?? result.redirectTo ?? "/practice");
      router.refresh();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Login ou senha inválidos.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="login-form" onSubmit={handleSubmit}>
      <label>
        Login
        <input
          autoComplete="username"
          autoFocus
          inputMode="text"
          onChange={(event) => setUsername(event.target.value)}
          placeholder="admin_09"
          required
          type="text"
          value={username}
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
        {isSubmitting ? "Entrando..." : "Entrar"}
        <ArrowRight size={18} />
      </button>
      {errorMessage ? <p className="error-message auth-error">{errorMessage}</p> : null}
    </form>
  );
}
