"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigation, Plus, Search } from "lucide-react";
import Link from "@/components/link";
import { useT } from "@/contexts/traduzioni-provider";
import { useAsdClubs } from "@/store/use-asd-store";
import { ordinaCorsi, posizioneDaCitta, type CorsoPubblico, type TipoCorso } from "@/lib/corsi";
import { SchedaCorso } from "@/components/corsi/scheda-corso";

type Filtro = "tutti" | TipoCorso;
type Posizione = { lat: number; lng: number; da: "gps" | "citta" };

/**
 * /corsi — i corsi di bridge, i più vicini per primi.
 *
 * LA PRIMA SCHERMATA DÀ: i corsi si vedono subito, senza account e prima di
 * aver concesso la posizione. La posizione la si chiede con un pulsante, non
 * all'apertura: chi arriva dal QR di una locandina vuole leggere, non
 * rispondere a una finestra del browser. Scrivere la città basta.
 */
export function CorsiClient({ corsi }: { corsi: CorsoPubblico[] }) {
  const t = useT();
  const { clubs } = useAsdClubs();
  const [filtro, setFiltro] = useState<Filtro>("tutti");
  const [citta, setCitta] = useState("");
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [statoGps, setStatoGps] = useState<"fermo" | "cerca" | "negata" | "errore">("fermo");

  const chiediPosizione = useCallback(() => {
    if (!navigator.geolocation) {
      setStatoGps("errore");
      return;
    }
    setStatoGps("cerca");
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setGps({ lat: p.coords.latitude, lng: p.coords.longitude });
        setCitta("");
        setStatoGps("fermo");
      },
      (e) => setStatoGps(e.code === 1 ? "negata" : "errore"),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 300_000 },
    );
  }, []);

  // Se il permesso c'è già (seconda visita), si usa senza chiedere niente.
  useEffect(() => {
    let annullato = false;
    navigator.permissions
      ?.query({ name: "geolocation" as PermissionName })
      .then((s) => {
        if (!annullato && s.state === "granted") chiediPosizione();
      })
      .catch(() => {});
    return () => {
      annullato = true;
    };
  }, [chiediPosizione]);

  const posCitta = useMemo(() => (citta.trim() ? posizioneDaCitta(citta, clubs) : null), [citta, clubs]);
  const posizione: Posizione | null = posCitta ? { ...posCitta, da: "citta" } : gps ? { ...gps, da: "gps" } : null;

  const elenco = useMemo(() => {
    const filtrati = corsi.filter((c) => filtro === "tutti" || c.tipo === filtro);
    return ordinaCorsi(
      filtrati.map((c) => ({ ...c, lat: c.circolo.lat, lng: c.circolo.lng })),
      posizione,
    );
    // `posizione` è ricreata a ogni render: contano le sue coordinate.
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dipende da lat/lng, non dall'oggetto
  }, [corsi, filtro, posizione?.lat, posizione?.lng]);

  const conteggio = { tutti: corsi.length, "bridge-5": 0, tradizionale: 0 } as Record<Filtro, number>;
  for (const c of corsi) conteggio[c.tipo] += 1;

  const cittaNonTrovata = citta.trim().length >= 3 && !posCitta && clubs.length > 0;

  return (
    <div className="px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pt-10">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-balance lg:text-4xl">{t("Corsi di bridge")}</h1>
        <p className="mt-2 text-pretty text-muted-foreground">
          {t("I corsi dei circoli FIGB, i più vicini per primi. Chiama il circolo per iscriverti: la prima lezione di solito è gratuita.")}
        </p>
      </header>

      <div className="mt-6 grid gap-3 rounded-2xl border border-border bg-card p-4 md:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-col gap-2 sm:flex-row">
          <label className="relative flex-1">
            <span className="sr-only">{t("Città o CAP")}</span>
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={citta}
              onChange={(e) => setCitta(e.target.value)}
              placeholder={t("Città o CAP")}
              autoComplete="address-level2"
              className="min-h-11 w-full rounded-xl border border-border bg-background pl-9 pr-3 text-base"
            />
          </label>
          <button
            type="button"
            onClick={chiediPosizione}
            disabled={statoGps === "cerca"}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-70"
          >
            <Navigation className="size-4" aria-hidden="true" />
            {statoGps === "cerca" ? t("Cerco la posizione…") : t("Vicino a me")}
          </button>
        </div>
        <div className="flex gap-1 rounded-xl bg-muted p-1" role="group" aria-label={t("Tipo di corso")}>
          {(["tutti", "bridge-5", "tradizionale"] as Filtro[]).map((f) => (
            <button
              key={f}
              type="button"
              aria-pressed={filtro === f}
              onClick={() => setFiltro(f)}
              className={`min-h-10 flex-1 whitespace-nowrap rounded-lg px-3 text-sm font-semibold transition-colors ${
                filtro === f ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "tutti" ? t("Tutti") : f === "bridge-5" ? t("Bridge 5.0") : t("Tradizionali")}{" "}
              <span className="tabular-nums">({conteggio[f]})</span>
            </button>
          ))}
        </div>
        <p className="text-sm text-muted-foreground md:col-span-2" aria-live="polite">
          {statoGps === "negata"
            ? t("Posizione non concessa: scrivi la città.")
            : statoGps === "errore"
              ? t("Posizione non disponibile: scrivi la città.")
              : cittaNonTrovata
                ? t("Non conosco «{citta}»: prova con il capoluogo o il CAP.", { citta: citta.trim() })
                : posizione
                  ? t("I più vicini per primi, con la distanza.")
                  : t("In ordine di data d'inizio. Scrivi la città per vedere i più vicini.")}
        </p>
        {filtro === "bridge-5" && (
          <p className="text-sm text-pretty md:col-span-2">
            {t("Bridge 5.0 è il nuovo metodo FIGB: si impara giocando da subito, con le lezioni e le mani su BridgeLab anche fra un incontro e l'altro.")}
          </p>
        )}
      </div>

      <section aria-label={t("Elenco dei corsi")} className="mt-6 grid gap-4 lg:grid-cols-2">
        {elenco.map((c) => (
          <SchedaCorso key={c.id} corso={c} km={c.km} />
        ))}
      </section>

      {elenco.length === 0 && (
        <div className="mt-6 rounded-2xl border border-border bg-card p-6 text-center">
          <p className="font-semibold">
            {corsi.length === 0 ? t("Non ci sono ancora corsi in programma.") : t("Nessun corso di questo tipo per ora.")}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Intanto puoi trovare il circolo più vicino e chiedere quando parte il prossimo.")}
          </p>
          <Link href="/trova-circolo" className="mt-4 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90">
            {t("Trova un circolo")}
          </Link>
        </div>
      )}

      <aside className="mt-10 flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold">{t("Organizzi un corso?")}</h2>
          <p className="text-sm text-pretty text-muted-foreground">
            {t("Caricalo con la locandina: dopo un controllo lo pubblichiamo qui, gratis.")}
          </p>
        </div>
        <Link href="/corsi/nuovo" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 font-semibold hover:bg-muted">
          <Plus className="size-4" aria-hidden="true" />
          {t("Pubblica il tuo corso")}
        </Link>
      </aside>
    </div>
  );
}
