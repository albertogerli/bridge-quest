"use client";

import { forwardRef } from "react";
import type { Facoltativi, TestiLocandina } from "@/lib/locandina";
import { useT } from "@/contexts/traduzioni-provider";

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
  const t = useT();
  const conQr = facoltativi.qr && qrSvg;
  return (
    <div
      ref={ref}
      style={{
        width: 794, height: 1123, background: "#F7F5F0", color: "#0f1219",
        display: "flex", flexDirection: "column", position: "relative", overflow: "hidden",
        fontFamily: "var(--font-display), system-ui, sans-serif",
      }}
    >
      {/* I loghi su bianco: su un fondo colorato quello della FIGB si perde. */}
      <div style={{
        display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20,
        background: "#fff", padding: "22px 56px", minHeight: 104,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element -- finisce dentro html-to-image, che non capisce next/image */}
        <img src="/icons/logo-figb.png" alt="FIGB" style={{ height: 64 }} />
        {facoltativi.logoAsd && logoAsd && (
          // eslint-disable-next-line @next/next/no-img-element -- come sopra
          <img src={logoAsd} alt="" style={{ height: 60, maxWidth: 200, objectFit: "contain" }} />
        )}
        {/* eslint-disable-next-line @next/next/no-img-element -- come sopra */}
        <img src="/icons/logo-coni.png" alt="CONI" style={{ height: 28 }} />
      </div>

      {/*
        LA FASCIA BLU. Il titolo sta a sinistra in una colonna stretta perché a
        destra c'è il ventaglio di carte: è la cosa che da tre metri dice
        «bridge» prima ancora di leggere, e che la vecchia locandina, tutta
        testo, non diceva.
      */}
      <div style={{
        position: "relative", minHeight: 380, padding: "46px 56px 54px",
        background: "linear-gradient(145deg, #002a73 0%, #003DA5 55%, #1a5fc9 100%)",
        color: "#fff", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", right: -40, bottom: -120, fontSize: 420, lineHeight: 1,
          color: "rgba(255,255,255,0.05)", fontWeight: 800,
        }} aria-hidden="true">♠</div>

        <Ventaglio />

        <div style={{ position: "relative", maxWidth: 410 }}>
          {testi.evento && (
            <span style={{
              display: "inline-block", background: "#c8a44e", color: "#1a1406", fontWeight: 800,
              fontSize: 18, letterSpacing: "0.1em", textTransform: "uppercase",
              padding: "9px 18px", borderRadius: 999,
            }}>{testi.evento}</span>
          )}
          <h1 style={{
            fontSize: 60, lineHeight: 1.02, fontWeight: 800, letterSpacing: -1.5,
            margin: "22px 0 0", color: "#fff",
          }}>
            {testi.titolo}
          </h1>
          {testi.sottotitolo && (
            <p style={{ fontSize: 23, color: "rgba(255,255,255,0.86)", marginTop: 16, lineHeight: 1.36, fontWeight: 500 }}>
              {testi.sottotitolo}
            </p>
          )}
        </div>
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "34px 56px 0" }}>
        {/* La data è la cosa che si cerca: un blocco a sé, col filo d'oro. */}
        <div style={{
          background: "#fff", borderRadius: 18, padding: "24px 28px",
          borderLeft: "8px solid #c8a44e", boxShadow: "0 6px 20px rgba(15,18,25,0.07)",
        }}>
          <div style={{ fontSize: 38, fontWeight: 800, color: "#003DA5", lineHeight: 1.1 }}>{testi.quando}</div>
          <div style={{ fontSize: 22, marginTop: 10, lineHeight: 1.36, whiteSpace: "pre-line", color: "#2b3240" }}>{testi.dove}</div>
        </div>

        <div style={{ marginTop: 24, display: "flex", flexWrap: "wrap", gap: "8px 34px", fontSize: 20, color: "#3b4453" }}>
          {testi.corso && <div><b style={{ color: "#0f1219" }}>{t("Corso:")}</b> {testi.corso}</div>}
          <div><b style={{ color: "#0f1219" }}>{t("Insegnante:")}</b> {testi.insegnante}</div>
        </div>

        {facoltativi.note && testi.note && (
          <div style={{
            marginTop: 20, background: "#EFEADF", borderRadius: 12,
            padding: "14px 18px", fontSize: 18, color: "#4a4334", lineHeight: 1.4, whiteSpace: "pre-line",
          }}>{testi.note}</div>
        )}

        <div style={{
          marginTop: "auto", marginBottom: 58, display: "flex", alignItems: "flex-end", gap: 24,
          justifyContent: conQr ? "space-between" : "center",
          textAlign: conQr ? "left" : "center",
        }}>
          <div style={{ fontSize: 19, color: "#3b4453", lineHeight: 1.4 }}>
            {t("Organizza")}
            <b style={{ display: "block", fontSize: 26, color: "#0f1219" }}>{testi.associazione}</b>
            {!conQr && testi.contatti && <span style={{ fontSize: 18 }}>{testi.contatti}</span>}
          </div>
          {conQr && (
            <div style={{
              textAlign: "center", background: "#fff", borderRadius: 18, padding: "14px 14px 12px",
              border: "3px solid #003DA5",
            }}>
              {/* Il QR è generato qui: nessun servizio esterno vede i codici. */}
              <div style={{ width: 150, height: 150 }} dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <span style={{ display: "block", fontSize: 16, color: "#003DA5", marginTop: 8, fontWeight: 800 }}>
                {t("Inquadra per iscriverti")}
              </span>
            </div>
          )}
        </div>
      </div>

      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0, height: 44, background: "#003DA5",
        color: "rgba(255,255,255,0.85)", display: "flex", alignItems: "center", justifyContent: "center",
        fontSize: 15, letterSpacing: "0.06em",
      }}>
        bridgelab.it — Federazione Italiana Gioco Bridge
      </div>
    </div>
  );
});

/**
 * Quattro carte a ventaglio, disegnate e non fotografate: si stampano nitide a
 * 300 dpi e non hanno diritti di nessuno. Asso, re, donna e fante, un seme
 * ciascuno, con i colori dei semi del resto del portale.
 */
const CARTE = [
  { valore: "A", seme: "♠", rosso: false },
  { valore: "K", seme: "♥", rosso: true },
  { valore: "Q", seme: "♦", rosso: true },
  { valore: "J", seme: "♣", rosso: false },
];

function Ventaglio() {
  return (
    <div aria-hidden="true" style={{ position: "absolute", right: 22, bottom: 30, width: 220, height: 300 }}>
      {CARTE.map((c, i) => {
        const colore = c.rosso ? "#B91C1C" : "#1a1a2e";
        return (
          <div
            key={c.valore}
            style={{
              position: "absolute", left: 40, bottom: 0, width: 150, height: 214,
              background: "#fff", borderRadius: 14,
              boxShadow: "0 10px 24px rgba(0,0,0,0.28)",
              transform: `rotate(${(i - 1.5) * 14}deg)`, transformOrigin: "50% 120%",
              color: colore, fontWeight: 800,
            }}
          >
            <div style={{ position: "absolute", left: 12, top: 8, fontSize: 30, lineHeight: 1, textAlign: "center" }}>
              {c.valore}
              <div style={{ fontSize: 26 }}>{c.seme}</div>
            </div>
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 84,
            }}>{c.seme}</div>
          </div>
        );
      })}
    </div>
  );
}
