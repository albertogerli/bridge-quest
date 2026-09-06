"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import { Download, Upload } from "lucide-react";
import { toPng } from "html-to-image";
import { Button } from "@/components/ui/button";
import { Briciole } from "@/components/briciole";
import { FoglioLocandina } from "@/components/istruttori/foglio-locandina";
import { getClassDetail, type ClassRoom } from "@/lib/instructors";
import { useSharedAuth } from "@/contexts/auth-provider";
import { indirizzoIscrizione, qrSvg } from "@/lib/qr";
import {
  CAMPI, CAMPI_FACOLTATIVI, campiMancanti, testiPredefiniti,
  type Facoltativi, type TestiLocandina,
} from "@/lib/locandina";
import { altezzaLogo, valutaLogo } from "@/lib/logo-asd";
import { reportError } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * La locandina che l'ASD stampa e appende.
 *
 * SI COMPILA QUASI DA SOLA. Insegnante, associazione e livello stanno già sulla
 * classe: chi apre la pagina trova il modulo quasi pieno e cambia quello che
 * serve. Trevissoi ha avviato quattordici corsi in contemporanea quasi tutti
 * con lo stesso format — ricominciare da zero quattordici volte era il lavoro
 * da togliere.
 *
 * L'IMMAGINE SI GENERA QUI, non con un modello. Il documento dev'essere esatto:
 * nome, indirizzo, data e ora sono testo letterale, i due loghi stanno in
 * posizioni prescritte, e il QR deve funzionare quando qualcuno lo inquadra in
 * una sala d'attesa. Con un template il risultato è identico ogni volta e
 * corretto per costruzione.
 */
export default function LocandinaPage({ params }: { params: Promise<{ classId: string }> }) {
  const t = useT();
  const { classId } = use(params);
  const { profile } = useSharedAuth();
  const [classe, setClasse] = useState<ClassRoom | null>(null);
  const [errore, setErrore] = useState<string | null>(null);
  const [testi, setTesti] = useState<TestiLocandina | null>(null);
  const [facoltativi, setFacoltativi] = useState<Facoltativi>({ logoAsd: false, note: false, qr: true });
  const [logoAsd, setLogoAsd] = useState<string | null>(null);
  const [logoScartato, setLogoScartato] = useState<string | null>(null);
  const [scaricando, setScaricando] = useState(false);
  const foglio = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let vivo = true;
    void getClassDetail(classId)
      .then((d) => {
        if (!vivo) return;
        setClasse(d.classRoom);
        setTesti((precedenti) => precedenti ?? testiPredefiniti(d.classRoom, profile?.display_name ?? ""));
      })
      .catch((err) => {
        reportError("locandina:classe", err);
        if (vivo) setErrore("Non riesco a leggere questa classe.");
      });
    return () => { vivo = false; };
  }, [classId, profile?.display_name]);

  const indirizzo = classe ? indirizzoIscrizione(classe.invite_code) : "";
  const svg = useMemo(() => (indirizzo ? qrSvg(indirizzo) : ""), [indirizzo]);

  /**
   * Il logo si controlla PRIMA di metterlo nel foglio: chi carica un file
   * inservibile lo scopre adesso e ne prende un altro, invece di accorgersene
   * davanti alla stampante — o in bacheca.
   */
  function caricaLogo(file: File) {
    setLogoScartato(null);
    const lettore = new FileReader();
    lettore.onload = () => {
      const dati = String(lettore.result);
      const img = new Image();
      img.onload = () => {
        const esito = valutaLogo({
          tipo: file.type, byte: file.size, larghezza: img.width, altezza: img.height,
        });
        if (!esito.ok) {
          setLogoScartato(esito.spiegazione);
          return;
        }
        // Si ridimensiona: un JPEG da tre megabyte dentro il foglio rallenta la
        // generazione senza migliorare la stampa.
        const m = altezzaLogo(img.width, img.height, 192);
        const tela = document.createElement("canvas");
        tela.width = m.larghezza;
        tela.height = m.altezza;
        tela.getContext("2d")?.drawImage(img, 0, 0, m.larghezza, m.altezza);
        setLogoAsd(tela.toDataURL("image/png"));
        setFacoltativi((f) => ({ ...f, logoAsd: true }));
      };
      img.onerror = () => setLogoScartato("Non riesco ad aprire questo file come immagine.");
      img.src = dati;
    };
    lettore.readAsDataURL(file);
  }

  async function scarica() {
    if (!foglio.current || !classe) return;
    setScaricando(true);
    try {
      // Tre volte le misure CSS: 794×1123 punti sono un A4 a 96 dpi, e per tre
      // fanno i 300 dpi che una stampante si aspetta.
      const png = await toPng(foglio.current, { pixelRatio: 3, cacheBust: true });
      const a = document.createElement("a");
      a.href = png;
      a.download = `locandina-${classe.name.replace(/[^\w-]+/g, "-").toLowerCase()}.png`;
      a.click();
    } catch (err) {
      reportError("locandina:immagine", err);
      setErrore("Non sono riuscito a generare l'immagine.");
    } finally {
      setScaricando(false);
    }
  }

  if (errore) return <p className="mx-auto max-w-2xl px-4 py-10 text-sm text-destructive">{errore}</p>;
  if (!classe || !testi) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
      </div>
    );
  }

  const scaduto = classe.invite_expires_at !== null && new Date(classe.invite_expires_at) <= new Date();
  const mancanti = campiMancanti(testi);
  const cambia = (chiave: keyof TestiLocandina, valore: string) =>
    setTesti((p) => (p ? { ...p, [chiave]: valore } : p));

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
      <Briciole
        percorso={[
          { etichetta: "Le tue classi", href: "/istruttori" },
          { etichetta: classe.name, href: `/istruttori/${classId}` },
          { etichetta: "Locandina" },
        ]}
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,360px)_1fr]">
        {/* ── Il modulo ─────────────────────────────────────────────────── */}
        <div className="space-y-4">
          {CAMPI.map((c) => (
            <div key={c.chiave} className="space-y-1.5">
              <label htmlFor={c.chiave} className="text-sm font-medium">{t(c.etichetta)}</label>
              {c.lungo ? (
                <textarea
                  id={c.chiave} rows={3} value={testi[c.chiave]} placeholder={c.esempio}
                  onChange={(e) => cambia(c.chiave, e.target.value)}
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm"
                />
              ) : (
                <input
                  id={c.chiave} type="text" value={testi[c.chiave]} placeholder={c.esempio}
                  onChange={(e) => cambia(c.chiave, e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm"
                />
              )}
            </div>
          ))}

          <div className="space-y-3 border-t border-border pt-4">
            <p className="text-sm font-medium">{t("Facoltativi")}</p>

            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" className="h-5 w-5 accent-primary"
                checked={facoltativi.qr}
                onChange={(e) => setFacoltativi((f) => ({ ...f, qr: e.target.checked }))} />
              {t("Codice QR per iscriversi")}
            </label>

            {!facoltativi.qr && (
              <div className="space-y-1.5 pl-8">
                <label htmlFor="contatti" className="text-sm">{t("Come iscriversi senza QR")}</label>
                <input id="contatti" type="text" value={testi.contatti}
                  placeholder="Per informazioni: 080 1234567"
                  onChange={(e) => cambia("contatti", e.target.value)}
                  className="min-h-11 w-full rounded-lg border border-border bg-background px-3 text-sm" />
              </div>
            )}

            <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
              <input type="checkbox" className="h-5 w-5 accent-primary"
                checked={facoltativi.note}
                onChange={(e) => setFacoltativi((f) => ({ ...f, note: e.target.checked }))} />
              {t("Vincoli o limitazioni")}
            </label>

            {facoltativi.note && (
              <textarea rows={3} value={testi.note}
                placeholder={CAMPI_FACOLTATIVI[0].esempio}
                onChange={(e) => cambia("note", e.target.value)}
                className="ml-8 w-[calc(100%-2rem)] rounded-lg border border-border bg-background p-3 text-sm" />
            )}

            <div className="space-y-2">
              <label className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                <input type="checkbox" className="h-5 w-5 accent-primary"
                  checked={facoltativi.logoAsd} disabled={!logoAsd}
                  onChange={(e) => setFacoltativi((f) => ({ ...f, logoAsd: e.target.checked }))} />
                {t("Logo dell'associazione")}
              </label>
              <label className="ml-8 inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-lg border border-border px-3 text-sm">
                <Upload className="h-4 w-4" aria-hidden="true" />
                {logoAsd ? t("Cambia immagine") : t("Carica un'immagine")}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) caricaLogo(f); }} />
              </label>
              {logoScartato && (
                <p className="ml-8 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
                  {logoScartato}
                </p>
              )}
            </div>
          </div>

          {mancanti.length > 0 && (
            <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-200">
              {t("Prima di stampare mancano:")} {mancanti.join(", ")}.
            </p>
          )}

          {facoltativi.qr && !classe.invite_active && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {t("Le iscrizioni di questa classe sono chiuse: chi inquadra il codice non entrerà.")}
            </p>
          )}
          {facoltativi.qr && scaduto && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {t("Il codice è scaduto: prima di stampare, sposta o togli la scadenza.")}
            </p>
          )}

          <Button onClick={() => void scarica()} disabled={scaricando || mancanti.length > 0}>
            <Download className="mr-2 h-4 w-4" aria-hidden="true" />
            {scaricando ? t("Preparo l'immagine…") : t("Scarica la locandina")}
          </Button>
        </div>

        {/* ── L'anteprima, che è il foglio vero rimpicciolito ────────────── */}
        <div className="overflow-x-auto">
          <div className="origin-top-left scale-[0.55] sm:scale-75" style={{ width: 794 }}>
            <div className="shadow-xl">
              <FoglioLocandina ref={foglio} testi={testi} facoltativi={facoltativi} logoAsd={logoAsd} qrSvg={svg} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
