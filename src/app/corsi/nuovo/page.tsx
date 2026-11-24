"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, Plus, Trash2, Upload, X } from "lucide-react";
import Link from "@/components/link";
import { useT } from "@/contexts/traduzioni-provider";
import { useSharedAuth } from "@/contexts/auth-provider";
import { useAsdClubs } from "@/store/use-asd-store";
import { createClient } from "@/lib/supabase/client";
import { segnalaSalvoRete } from "@/lib/report-error";
import {
  ETICHETTA_GIORNO, ETICHETTA_LIVELLO, GIORNI, LIVELLI, MAX_FILE_BYTES, TIPI_FILE,
  dataNonPassata, nomeFileCorso, normalizzaCitta, schemaCorso,
  type Giorno, type LivelloCorso, type StatoCorso, type TipoCorso,
} from "@/lib/corsi";

type Orario = { giorno: Giorno; dalle: string; alle: string };

interface MioCorso {
  id: string;
  stato: StatoCorso;
  asd_code: string;
  prima_lezione: string;
  messaggio_admin: string | null;
  created_at: string;
}

const ETICHETTA_STATO: Record<StatoCorso, string> = {
  "in-attesa": "In attesa di approvazione",
  pubblicato: "Pubblicato",
  "da-modificare": "Da modificare",
  rifiutato: "Non pubblicato",
  sostituito: "Sostituito da una versione nuova",
  ritirato: "Ritirato",
};

const campo = "min-h-11 w-full rounded-xl border border-border bg-background px-3 text-base";
const etichetta = "mb-1 block text-sm font-semibold";

export default function NuovoCorsoPage() {
  return (
    <Suspense>
      <NuovoCorso />
    </Suspense>
  );
}

/**
 * /corsi/nuovo — chi organizza carica il suo corso; lo pubblica l'amministratore.
 *
 * Senza account si spiega cosa succede e si chiede di entrare (la pagina è
 * pubblica: il cancello del sito non deve rimandare al login prima che la
 * persona sappia perché). `?da=<id>` riapre un proprio corso per correggerlo:
 * se era pubblicato, la versione nuova lo sostituisce solo quando è approvata.
 */
function NuovoCorso() {
  const t = useT();
  const { user, loading } = useSharedAuth();
  const { clubs } = useAsdClubs();
  const da = useSearchParams().get("da");

  const [tipo, setTipo] = useState<TipoCorso | null>(null);
  const [asdCode, setAsdCode] = useState<string | null>(null);
  const [cercaCircolo, setCercaCircolo] = useState("");
  const [livello, setLivello] = useState<LivelloCorso>("principianti");
  const [maestro, setMaestro] = useState("");
  const [primaLezione, setPrimaLezione] = useState("");
  const [orari, setOrari] = useState<Orario[]>([{ giorno: "lunedì", dalle: "18:00", alle: "20:00" }]);
  const [telefono, setTelefono] = useState("");
  const [whatsapp, setWhatsapp] = useState(false);
  const [email, setEmail] = useState("");
  const [locandina, setLocandina] = useState<File | null>(null);
  const [locandinaEsistente, setLocandinaEsistente] = useState<string | null>(null);
  const [programma, setProgramma] = useState("");
  const [programmaPdf, setProgrammaPdf] = useState<File | null>(null);
  const [programmaEsistente, setProgrammaEsistente] = useState<string | null>(null);
  const [costo, setCosto] = useState("");
  const [note, setNote] = useState("");
  const [consenso, setConsenso] = useState(false);
  const [sostituisce, setSostituisce] = useState<string | null>(null);

  const [errore, setErrore] = useState<string | null>(null);
  const [invio, setInvio] = useState(false);
  const [inviato, setInviato] = useState(false);
  const [miei, setMiei] = useState<MioCorso[]>([]);
  const caricatoDa = useRef<string | null>(null);

  // I propri corsi, e quello da correggere se c'è `?da=`.
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase
      .from("corsi")
      .select("id, stato, asd_code, prima_lezione, messaggio_admin, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(20)
      .then(({ data, error }) => {
        if (error) segnalaSalvoRete("corsi:miei", error);
        else setMiei((data ?? []) as MioCorso[]);
      });
    if (!da || caricatoDa.current === da) return;
    caricatoDa.current = da;
    supabase
      .from("corsi")
      .select("*")
      .eq("id", da)
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) segnalaSalvoRete("corsi:da", error);
        if (!data) return;
        setTipo(data.tipo);
        setAsdCode(data.asd_code);
        setLivello(data.livello);
        setMaestro(data.maestro ?? "");
        setPrimaLezione(data.prima_lezione ?? "");
        if (Array.isArray(data.orari) && data.orari.length) setOrari(data.orari);
        setTelefono(data.telefono ?? "");
        setWhatsapp(!!data.whatsapp);
        setEmail(data.email ?? "");
        setLocandinaEsistente(data.locandina_path);
        setProgramma(data.programma ?? "");
        setProgrammaEsistente(data.programma_path);
        setCosto(data.costo ?? "");
        setNote(data.note ?? "");
        // Un corso pubblicato si sostituisce; uno da correggere si rimanda,
        // e sostituisce quello che sostituiva lui.
        setSostituisce(data.stato === "pubblicato" ? data.id : (data.sostituisce ?? null));
      });
  }, [user, da]);

  const circolo = useMemo(() => clubs.find((c) => c.code === asdCode) ?? null, [clubs, asdCode]);
  const proposte = useMemo(() => {
    const q = normalizzaCitta(cercaCircolo);
    if (q.length < 2) return [];
    return clubs
      .filter((c) => c.active && (normalizzaCitta(c.name).includes(q) || normalizzaCitta(c.city).includes(q)))
      .slice(0, 8);
  }, [clubs, cercaCircolo]);

  function scegliFile(file: File | undefined, imposta: (f: File | null) => void, soloPdf = false) {
    setErrore(null);
    if (!file) return;
    const ammessi: readonly string[] = soloPdf ? ["application/pdf"] : TIPI_FILE;
    if (!ammessi.includes(file.type)) {
      setErrore(soloPdf ? t("Il programma va caricato in PDF.") : t("La locandina dev'essere un'immagine (JPG, PNG) o un PDF."));
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      setErrore(t("Il file supera i 10 MB."));
      return;
    }
    imposta(file);
  }

  async function invia(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    setErrore(null);
    if (!tipo) return setErrore(t("Scegli se è un corso Bridge 5.0 o tradizionale."));
    if (primaLezione && !dataNonPassata(primaLezione)) return setErrore(t("La prima lezione è già passata."));

    const bozza = {
      tipo, asdCode: asdCode ?? "", livello, maestro, primaLezione, orari, telefono, email, whatsapp,
      locandinaPath: locandinaEsistente, programma, programmaPath: programmaEsistente, costo, note, consenso, sostituisce,
    };
    const prova = schemaCorso.safeParse(bozza);
    if (!prova.success) return setErrore(t(prova.error.issues[0]?.message ?? "Controlla i campi del modulo."));

    setInvio(true);
    try {
      const supabase = createClient();
      for (const [file, tipoFile] of [[locandina, "locandina"], [programmaPdf, "programma"]] as const) {
        if (!file) continue;
        const nome = nomeFileCorso(user.id, tipoFile, file);
        const { error } = await supabase.storage.from("corsi").upload(nome, file, { contentType: file.type, upsert: false });
        if (error) throw error;
        if (tipoFile === "locandina") bozza.locandinaPath = nome;
        else bozza.programmaPath = nome;
      }
      const res = await fetch("/api/corsi", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bozza),
      });
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setErrore(t(json.error ?? "Non sono riuscito a mandare il corso. Riprova fra un attimo."));
        return;
      }
      setInviato(true);
      window.scrollTo({ top: 0 });
    } catch (err) {
      segnalaSalvoRete("corsi:invio", err);
      setErrore(t("Non sono riuscito a caricare il file. Riprova fra un attimo."));
    } finally {
      setInvio(false);
    }
  }

  if (loading) {
    return (
      <div className="px-4 pt-10">
        <h1 className="font-display text-3xl font-bold">{t("Pubblica il tuo corso")}</h1>
        <p className="mt-2 text-muted-foreground">{t("Caricamento...")}</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        <div className="max-w-xl rounded-2xl border border-border bg-card p-6">
          <h1 className="font-display text-2xl font-bold text-balance">{t("Pubblica il tuo corso di bridge")}</h1>
          <p className="mt-2 text-pretty text-muted-foreground">
            {t("Compili un modulo con circolo, date, orari, maestro e locandina. Dopo un controllo il corso compare nella pagina dei corsi, gratis, con il tuo telefono. Ti scriviamo quando è online.")}
          </p>
          <p className="mt-2 text-pretty text-muted-foreground">{t("Per caricarlo serve un account BridgeLab: così puoi correggerlo dopo.")}</p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/login?redirect=%2Fcorsi%2Fnuovo" className="inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90">
              {t("Entra o crea un account")}
            </Link>
            <Link href="/corsi" className="inline-flex min-h-11 items-center rounded-xl border border-border px-4 font-semibold hover:bg-muted">
              {t("Guarda i corsi")}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (inviato) {
    return (
      <div className="px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pt-10">
        <div className="max-w-xl rounded-2xl border border-border bg-card p-6">
          <CheckCircle2 className="size-8 text-primary" aria-hidden="true" />
          <h1 className="mt-2 font-display text-2xl font-bold">{t("Corso inviato")}</h1>
          <p className="mt-2 text-pretty text-muted-foreground">
            {sostituisce
              ? t("Fino all'approvazione resta online la versione di prima. Ti scriviamo appena la nuova è pubblicata.")
              : t("Lo controlliamo e ti scriviamo appena è online, di solito entro un giorno.")}
          </p>
          <Link href="/corsi" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90">
            {t("Guarda i corsi")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-6 sm:px-6 lg:px-8 lg:pt-10">
      <header className="max-w-2xl">
        <h1 className="font-display text-3xl font-bold text-balance">{sostituisce ? t("Modifica il corso") : t("Pubblica il tuo corso")}</h1>
        <p className="mt-2 text-pretty text-muted-foreground">
          {t("Lo controlliamo prima di pubblicarlo e ti scriviamo quando è online. I campi facoltativi lo dicono.")}
        </p>
      </header>

      {miei.length > 0 && (
        <section className="mt-6 max-w-2xl rounded-2xl border border-border bg-card p-4" aria-labelledby="miei-corsi">
          <h2 id="miei-corsi" className="font-semibold">{t("I tuoi corsi")}</h2>
          <ul className="mt-2 divide-y divide-border">
            {miei.map((m) => {
              const nome = clubs.find((c) => c.code === m.asd_code)?.name ?? m.asd_code;
              const correggibile = m.stato === "pubblicato" || m.stato === "da-modificare";
              return (
                <li key={m.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 py-2 text-sm">
                  <span className="min-w-0 flex-1 truncate font-semibold">{nome}</span>
                  <span className={m.stato === "da-modificare" ? "font-semibold text-destructive" : "text-muted-foreground"}>{t(ETICHETTA_STATO[m.stato])}</span>
                  {m.stato === "pubblicato" && <Link href={`/corsi/${m.id}`} className="font-semibold text-primary hover:underline">{t("Vedi")}</Link>}
                  {correggibile && m.id !== da && <Link href={`/corsi/nuovo?da=${m.id}`} className="font-semibold text-primary hover:underline">{t("Correggi")}</Link>}
                  {m.messaggio_admin && m.stato !== "pubblicato" && <p className="w-full text-pretty text-muted-foreground">{m.messaggio_admin}</p>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <form onSubmit={invia} className="mt-6 grid max-w-2xl gap-5 rounded-2xl border border-border bg-card p-5" noValidate>
        <fieldset>
          <legend className={etichetta}>{t("Che corso è")}</legend>
          <div className="grid gap-2 sm:grid-cols-2">
            {(["bridge-5", "tradizionale"] as TipoCorso[]).map((v) => (
              <label key={v} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${tipo === v ? "border-primary bg-primary/5" : "border-border"}`}>
                <input type="radio" name="tipo" className="mt-1 size-4" checked={tipo === v} onChange={() => setTipo(v)} />
                <span>
                  <span className="block font-semibold">{v === "bridge-5" ? t("Bridge 5.0") : t("Tradizionale")}</span>
                  <span className="block text-sm text-muted-foreground">
                    {v === "bridge-5" ? t("Il nuovo metodo FIGB, con BridgeLab fra una lezione e l'altra.") : t("Il corso classico, con il tuo metodo.")}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <div>
          <span className={etichetta} id="etichetta-circolo">{t("Circolo")}</span>
          {circolo ? (
            <div className="flex items-center gap-3 rounded-xl border border-border p-3">
              <span className="min-w-0 flex-1">
                <span className="block font-semibold">{circolo.name}</span>
                <span className="block text-sm text-muted-foreground">{[circolo.address, circolo.city].filter(Boolean).join(", ")}</span>
              </span>
              <button type="button" onClick={() => setAsdCode(null)} className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-muted" aria-label={t("Cambia circolo")}>
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
          ) : (
            <>
              <input
                type="search"
                className={campo}
                value={cercaCircolo}
                onChange={(e) => setCercaCircolo(e.target.value)}
                placeholder={t("Nome del circolo o città")}
                aria-labelledby="etichetta-circolo"
              />
              {proposte.length > 0 && (
                <ul className="mt-1 max-h-72 overflow-auto rounded-xl border border-border">
                  {proposte.map((c) => (
                    <li key={c.code}>
                      <button
                        type="button"
                        onClick={() => {
                          setAsdCode(c.code);
                          setCercaCircolo("");
                        }}
                        className="block w-full px-3 py-2 text-left hover:bg-muted"
                      >
                        <span className="block font-semibold">{c.name}</span>
                        <span className="block text-sm text-muted-foreground">{c.city}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-1 text-sm text-muted-foreground">{t("Dall'elenco dei circoli FIGB: indirizzo e mappa arrivano da lì.")}</p>
            </>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={etichetta}>{t("Livello")}</span>
            <select className={campo} value={livello} onChange={(e) => setLivello(e.target.value as LivelloCorso)}>
              {LIVELLI.map((l) => (
                <option key={l} value={l}>{t(ETICHETTA_LIVELLO[l])}</option>
              ))}
            </select>
          </label>
          <label>
            <span className={etichetta}>{t("Maestro")}</span>
            <input className={campo} value={maestro} onChange={(e) => setMaestro(e.target.value)} autoComplete="name" maxLength={120} />
          </label>
          <label>
            <span className={etichetta}>{t("Prima lezione")}</span>
            <input type="date" className={campo} value={primaLezione} onChange={(e) => setPrimaLezione(e.target.value)} min={new Date().toISOString().slice(0, 10)} />
          </label>
        </div>

        <fieldset>
          <legend className={etichetta}>{t("Giorni e orari")}</legend>
          <div className="grid gap-2">
            {orari.map((o, i) => (
              <div key={i} className="grid grid-cols-[minmax(0,1fr)_auto_auto_auto] items-center gap-2">
                <select
                  className={campo}
                  value={o.giorno}
                  aria-label={t("Giorno")}
                  onChange={(e) => setOrari(orari.map((x, j) => (j === i ? { ...x, giorno: e.target.value as Giorno } : x)))}
                >
                  {GIORNI.map((g) => (
                    <option key={g} value={g}>{t(ETICHETTA_GIORNO[g])}</option>
                  ))}
                </select>
                <input type="time" className={`${campo} w-28`} value={o.dalle} aria-label={t("Dalle")} onChange={(e) => setOrari(orari.map((x, j) => (j === i ? { ...x, dalle: e.target.value } : x)))} />
                <input type="time" className={`${campo} w-28`} value={o.alle} aria-label={t("Alle")} onChange={(e) => setOrari(orari.map((x, j) => (j === i ? { ...x, alle: e.target.value } : x)))} />
                <button
                  type="button"
                  disabled={orari.length === 1}
                  onClick={() => setOrari(orari.filter((_, j) => j !== i))}
                  className="inline-flex size-11 items-center justify-center rounded-lg hover:bg-muted disabled:opacity-40"
                  aria-label={t("Togli questo giorno")}
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </div>
            ))}
          </div>
          {orari.length < 10 && (
            <button
              type="button"
              onClick={() => setOrari([...orari, { ...orari[orari.length - 1] }])}
              className="mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-primary"
            >
              <Plus className="size-4" aria-hidden="true" />
              {t("Aggiungi un giorno")}
            </button>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={etichetta}>{t("Telefono")}</span>
            <input type="tel" className={campo} value={telefono} onChange={(e) => setTelefono(e.target.value)} autoComplete="tel" maxLength={40} />
          </label>
          <label>
            <span className={etichetta}>{t("Email (facoltativa)")}</span>
            <input type="email" className={campo} value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" maxLength={200} />
          </label>
          <label className="flex items-center gap-3 sm:col-span-2">
            <input type="checkbox" className="size-5" checked={whatsapp} onChange={(e) => setWhatsapp(e.target.checked)} />
            <span className="text-sm">{t("Si può scrivere anche su WhatsApp a questo numero")}</span>
          </label>
        </div>

        <div>
          <span className={etichetta}>{t("Locandina (facoltativa)")}</span>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-dashed border-border p-4 hover:bg-muted">
            <Upload className="size-5 shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="min-w-0 text-sm">
              <span className="block truncate font-semibold">
                {locandina?.name ?? (locandinaEsistente ? t("Locandina già caricata: scegline un'altra per cambiarla") : t("Scegli un'immagine o un PDF"))}
              </span>
              <span className="block text-muted-foreground">{t("Fino a 10 MB. Senza locandina la scheda mostra il nome del circolo.")}</span>
            </span>
            <input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => scegliFile(e.target.files?.[0], setLocandina)} />
          </label>
        </div>

        <div>
          <label>
            <span className={etichetta}>{t("Programma delle lezioni (facoltativo)")}</span>
            <textarea
              className={`${campo} min-h-28 py-2`}
              value={programma}
              onChange={(e) => setProgramma(e.target.value)}
              maxLength={6000}
              placeholder={t("1. Le carte e le prese · 2. Il gioco a senza atout · 3. Le aperture…")}
            />
          </label>
          <label className="mt-2 inline-flex min-h-11 cursor-pointer items-center gap-2 text-sm font-semibold text-primary">
            <Upload className="size-4" aria-hidden="true" />
            {programmaPdf?.name ?? (programmaEsistente ? t("PDF già caricato: scegline un altro") : t("Oppure allega il programma in PDF"))}
            <input type="file" className="sr-only" accept="application/pdf" onChange={(e) => scegliFile(e.target.files?.[0], setProgrammaPdf, true)} />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label>
            <span className={etichetta}>{t("Costo (facoltativo)")}</span>
            <input className={campo} value={costo} onChange={(e) => setCosto(e.target.value)} maxLength={300} placeholder={t("Es. prima lezione gratuita")} />
          </label>
          <label className="sm:col-span-2">
            <span className={etichetta}>{t("Note (facoltative)")}</span>
            <textarea className={`${campo} min-h-20 py-2`} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1500} />
          </label>
        </div>

        <label className="flex items-start gap-3">
          <input type="checkbox" className="mt-0.5 size-5" checked={consenso} onChange={(e) => setConsenso(e.target.checked)} />
          <span className="text-sm text-pretty">{t("Confermo di poter pubblicare questo telefono e il nome del maestro.")}</span>
        </label>

        {errore && (
          <p role="alert" className="rounded-xl border border-destructive/40 bg-destructive/10 p-3 text-sm font-semibold text-destructive">
            {errore}
          </p>
        )}

        <button type="submit" disabled={invio} className="inline-flex min-h-12 items-center justify-center rounded-xl bg-primary px-5 font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-70">
          {invio ? t("Invio in corso…") : t("Invia per l'approvazione")}
        </button>
      </form>
    </div>
  );
}
