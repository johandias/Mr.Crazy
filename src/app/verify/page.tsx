"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, AlertCircle, Loader2, ArrowRight } from "lucide-react";

function VerifyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get("email") || "";
  const code = searchParams.get("code") || "";

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!email || !code) {
      setStatus("error");
      setErrorMessage("Link de validação incompleto. Falta o e-mail ou o código.");
      return;
    }

    let isMounted = true;

    async function doVerify() {
      try {
        const response = await fetch("/api/auth/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, code })
        });

        const data = await response.json();

        if (!isMounted) return;

        if (!response.ok) {
          setStatus("error");
          setErrorMessage(data.error || "Código de validação incorreto ou expirado.");
          return;
        }

        setStatus("success");
        setTimeout(() => {
          router.replace(data.redirectTo || "/practice");
          router.refresh();
        }, 1500);
      } catch (err) {
        if (!isMounted) return;
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Erro ao conectar com o servidor para validar."
        );
      }
    }

    doVerify();

    return () => {
      isMounted = false;
    };
  }, [email, code, router]);

  return (
    <div className="auth-card-container verify-page-card" style={{ maxWidth: 440, margin: "40px auto", padding: "32px 24px" }}>
      {status === "loading" && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <Loader2 className="animate-spin" size={48} style={{ color: "#f59e0b", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#f1f5f9", marginBottom: "8px" }}>
            Validando sua conta...
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "14px" }}>
            Aguarde um instante enquanto ativamos seu acesso ao Mr. Crazy.
          </p>
        </div>
      )}

      {status === "success" && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <CheckCircle2 size={54} style={{ color: "#10b981", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "22px", fontWeight: "bold", color: "#f1f5f9", marginBottom: "8px" }}>
            Conta Ativada com Sucesso!
          </h2>
          <p style={{ color: "#94a3b8", fontSize: "14px", marginBottom: "20px" }}>
            Código validado. Bora destravar o inglês na marra! Redirecionando...
          </p>
          <Link
            href="/practice"
            className="primary-link"
            style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center" }}
          >
            Entrar Agora <ArrowRight size={18} />
          </Link>
        </div>
      )}

      {status === "error" && (
        <div style={{ textAlign: "center", padding: "24px 0" }}>
          <AlertCircle size={54} style={{ color: "#ef4444", margin: "0 auto 16px" }} />
          <h2 style={{ fontSize: "20px", fontWeight: "bold", color: "#f1f5f9", marginBottom: "8px" }}>
            Não foi possível validar
          </h2>
          <p style={{ color: "#fca5a5", fontSize: "14px", marginBottom: "24px", lineHeight: "1.5" }}>
            {errorMessage}
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <Link
              href={`/login?email=${encodeURIComponent(email)}&verify=1`}
              className="primary-link"
              style={{ display: "inline-flex", alignItems: "center", gap: 8, justifyContent: "center" }}
            >
              Digitar Código Manualmente <ArrowRight size={16} />
            </Link>
            <Link
              href="/login"
              style={{ color: "#94a3b8", fontSize: "13px", textDecoration: "underline" }}
            >
              Voltar ao Login
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

export default function VerifyPage() {
  return (
    <main className="simple-page">
      <section className="simple-panel auth-panel">
        <p className="eyebrow">Ativação de Conta</p>
        <h1>Mr.Crazy English</h1>
        <Suspense
          fallback={
            <div style={{ textAlign: "center", padding: "40px" }}>
              <Loader2 className="animate-spin" size={32} style={{ color: "#f59e0b", margin: "0 auto" }} />
            </div>
          }
        >
          <VerifyContent />
        </Suspense>
      </section>
    </main>
  );
}
