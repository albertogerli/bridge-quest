"use client";

import { forwardRef } from "react";
import type { Facoltativi, TestiLocandina } from "@/lib/locandina";

/**
 * Il foglio A4 vero e proprio.
 *
 * MISURE FISSE, NON RESPONSIVE. È un foglio da stampare: 794×1123 pixel sono
 * un A4 a 96 punti per pollice, e catturarlo a tre volte dà i 300 dpi che una
 * stampante si aspetta. Se questa cosa si adattasse allo schermo, l'immagine
 * scaricata cambierebbe a seconda del telefono di chi la scarica.
 *
 * NIENTE QUI DESCRIVE QUELLO CHE POTREBBE NON ESSERCI. «Inquadra per
 * iscriverti» sta dentro il blocco del QR e non nel testo: se il QR è spento,
 * la frase se ne va con lui. È la stessa regola per cui il sottotitolo
 * predefinito non dice «iscriviti online».
 *
 * QUANDO UN FACOLTATIVO È SPENTO IL FOGLIO SI RIEQUILIBRA invece di lasciare un
 * buco: il piede si centra e il corpo respira, perché sono blocchi in colonna e
 * non posizioni fisse.
 */
export const FoglioLocandina = forwardRef<
  HTMLDivElement,
  {
    testi: TestiLocandina;
    facoltativi: Facoltativi;
    logoAsd: string | null;
    qrSvg: string;
  }
>(function FoglioLocandina({ testi, facoltativi, logoAsd, qrSvg }, ref) {
  const conQr = facoltativi.qr && qrSvg;
  return (
    <div
      ref={ref}
      style={{
        width: 794, height: 1123, background: "#fff", color: "#0f1219",
        padding: "52px 56px", display: "flex", flexDirection: "column",
        position: "relative", fontFamily: "var(--font-display), system-ui, sans-serif",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20, minHeight: 76 }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- finisce dentro html-to-image, che non capisce next/image */}
        <img src="/icons/logo-figb.png" alt="FIGB" style={{ height: 72 }} />
        {facoltativi.logoAsd && logoAsd && (
          // eslint-disable-next-line @next/next/no-img-element -- come sopra
          <img src={logoAsd} alt="" style={{ height: 64, maxWidth: 200, objectFit: "contain" }} />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element -- come sopra */}
        <img src="/icons/logo-coni.png" alt="CONI" style={{ height: 30 }} />
      </div>
      <div style={{ height: 5, background: "#003DA5", marginTop: 22 }} />

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center" }}>
        {testi.evento && (
          <span style={{
            alignSelf: "flex-start", background: "#003DA5", color: "#fff", fontWeight: 800,
            fontSize: 19, letterSpacing: "0.08em", textTransform: "uppercase",
            padding: "9px 18px", borderRadius: 7,
          }}>{testi.evento}</span>
        )}
        <h1 style={{ fontSize: 62, lineHeight: 1.02, fontWeight: 800, letterSpacing: -1.5, margin: "22px 0 0" }}>
          {testi.titolo}
        </h1>
        {testi.sottotitolo && (
          <p style={{ fontSize: 26, color: "#3b4453", marginTop: 14, lineHeight: 1.32, fontWeight: 500 }}>
            {testi.sottotitolo}
          </p>
        )}

        <div style={{ marginTop: 36, borderTop: "2px solid #e6e2d9", borderBottom: "2px solid #e6e2d9", padding: "22px 0" }}>
          <div style={{ fontSize: 38, fontWeight: 800, color: "#003DA5", lineHeight: 1.12 }}>{testi.quando}</div>
          <div style={{ fontSize: 22, marginTop: 9, lineHeight: 1.34, whiteSpace: "pre-line" }}>{testi.dove}</div>
        </div>

        <div style={{ marginTop: 26, display: "flex", flexDirection: "column", gap: 7, fontSize: 20, color: "#3b4453" }}>
          {testi.corso && <div><b style={{ color: "#0f1219" }}>Corso:</b> {testi.corso}</div>}
          <div><b style={{ color: "#0f1219" }}>Insegnante:</b> {testi.insegnante}</div>
        </div>

        {facoltativi.note && testi.note && (
          <div style={{
            marginTop: 22, background: "#F2EFE8", borderLeft: "5px solid #c8a44e",
            padding: "14px 18px", fontSize: 18, color: "#4a4334", lineHeight: 1.4, whiteSpace: "pre-line",
          }}>{testi.note}</div>
        )}
      </div>

      <div style={{
        display: "flex", alignItems: "flex-end", gap: 24, marginTop: 26,
        justifyContent: conQr ? "space-between" : "center",
        textAlign: conQr ? "left" : "center",
      }}>
        <div style={{ fontSize: 19, color: "#3b4453", lineHeight: 1.4 }}>
          Organizza
          <b style={{ display: "block", fontSize: 24, color: "#0f1219" }}>{testi.associazione}</b>
          {!conQr && testi.contatti && <span style={{ fontSize: 17 }}>{testi.contatti}</span>}
        </div>
        {conQr && (
          <div style={{ textAlign: "center" }}>
            {/* Il QR è generato qui: nessun servizio esterno vede i codici. */}
            <div style={{ width: 150, height: 150 }} dangerouslySetInnerHTML={{ __html: qrSvg }} />
            <span style={{ display: "block", fontSize: 15, color: "#3b4453", marginTop: 7, fontWeight: 600 }}>
              Inquadra per iscriverti
            </span>
          </div>
        )}
      </div>

      <div style={{
        position: "absolute", left: 56, right: 56, bottom: 26, textAlign: "center",
        fontSize: 15, color: "#8b8578", letterSpacing: "0.04em",
      }}>
        bridgelab.it — Federazione Italiana Gioco Bridge
      </div>
    </div>
  );
});
