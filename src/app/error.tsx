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
    console.error("App boundary error caught:", error);
  }, [error]);

  return (
    <main className="practice-loading-screen" style={{ minHeight: "100dvh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "16px", padding: "20px", textAlign: "center" }}>
      <div style={{ fontSize: "2rem" }}>⚡</div>
      <h2 style={{ fontSize: "1.2rem", fontWeight: 600, color: "#fff" }}>Ops! O Mr. Crazy tropeçou ao carregar</h2>
      <p style={{ fontSize: "0.9rem", color: "#9ca3af", maxWidth: "340px" }}>
        {error?.message && !error.message.includes("digest")
          ? error.message
          : "Houve uma oscilação na conexão. Toque no botão abaixo para recarregar."}
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
          fontWeight: 600,
          padding: "10px 20px",
          borderRadius: "9999px",
          border: "none",
          cursor: "pointer"
        }}
      >
        <RotateCcw size={16} />
        <span>Recarregar tela</span>
      </button>
    </main>
  );
}
