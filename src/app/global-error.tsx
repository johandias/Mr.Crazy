"use client";

import { useEffect } from "react";
import { RotateCcw } from "lucide-react";

export default function GlobalError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Root global error caught:", error);
  }, [error]);

  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          padding: 0,
          backgroundColor: "#0b0f19",
          color: "#f3f4f6",
          fontFamily: "system-ui, -apple-system, sans-serif"
        }}
      >
        <main
          style={{
            minHeight: "100dvh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "16px",
            padding: "20px",
            textAlign: "center"
          }}
        >
          <div style={{ fontSize: "2.5rem" }}>⚡</div>
          <h2 style={{ fontSize: "1.4rem", fontWeight: 700, color: "#fff", margin: 0 }}>
            O Mr. Crazy precisou reiniciar
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#9ca3af", maxWidth: "360px", margin: 0 }}>
            {error?.message && !error.message.includes("digest")
              ? error.message
              : "Houve uma instabilidade temporária. Toque no botão abaixo para recarregar o sistema com segurança."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "#f59e0b",
              color: "#000",
              fontWeight: 700,
              padding: "12px 24px",
              borderRadius: "9999px",
              border: "none",
              cursor: "pointer",
              marginTop: "8px",
              fontSize: "0.95rem"
            }}
          >
            <RotateCcw size={18} />
            <span>Recarregar aplicação</span>
          </button>
        </main>
      </body>
    </html>
  );
}
