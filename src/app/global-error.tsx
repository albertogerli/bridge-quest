"use client";

import { useEffect } from "react";
import { reportError } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

// Error boundary del root layout: cattura i crash che avvengono nel layout
// stesso (prima solo pagina bianca). Come da doc Next.js deve renderizzare
// i propri tag <html> e <body>. Stile inline: globals.css potrebbe non
// essere caricato quando questo boundary entra in gioco.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useT();
  useEffect(() => {
    reportError("global-error", error);
  }, [error]);

  return (
    <html lang="it">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F7F5F0",
          fontFamily:
            "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
          color: "#1a1a2e",
        }}
      >
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            maxWidth: "28rem",
          }}
        >
          <p style={{ fontSize: "2.5rem", margin: "0 0 0.5rem" }}>♠</p>
          <h1 style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>
            {t("Ops, qualcosa è andato storto")}
          </h1>
          <p
            style={{
              fontSize: "0.95rem",
              lineHeight: 1.5,
              margin: "0 0 1.5rem",
              color: "#555",
            }}
          >
            {t("Si è verificato un errore imprevisto. Riprova: di solito basta un nuovo tentativo.")}
          </p>
          <button
            onClick={() => reset()}
            style={{
              backgroundColor: "#003DA5",
              color: "#ffffff",
              border: "none",
              borderRadius: "0.75rem",
              padding: "0.75rem 1.5rem",
              fontSize: "0.95rem",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {t("Riprova")}
          </button>
        </div>
      </body>
    </html>
  );
}
