"use client";

import { useState } from "react";
import { CopyPlus } from "lucide-react";
import Link from "@/components/link";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMyClasses } from "@/store/use-classes-store";
import { copiaClasse, copiaCompito, scadenzaProposta, type EsitoCopiaCompito, type MaterialiUsciti, type RiepilogoCopia } from "@/lib/copia-classe";
import type { Assignment, ClassRoom } from "@/lib/instructors";
import { segnalaSalvoRete } from "@/lib/report-error";
import { useT } from "@/contexts/traduzioni-provider";

const campo =
  "w-full rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

/** Le classi in cui si può copiare: le proprie, non archiviate, tranne quella da cui si parte. */
function classiDiArrivo(classi: ClassRoom[], tranne: string): ClassRoom[] {
  return classi.filter((c) => c.id !== tranne && c.stato !== "archiviata");
}

function SceltaClasse({
  classi,
  valore,
  onCambia,
}: {
  classi: ClassRoom[];
  valore: string;
  onCambia: (id: string) => void;
}) {
  const t = useT();
  return (
    <div className="space-y-1.5">
      <label htmlFor="classe-arrivo" className="text-sm font-medium">
        {t("In quale classe")}
      </label>
      <select id="classe-arrivo" value={valore} onChange={(e) => onCambia(e.target.value)} className={campo}>
        <option value="">{t("Scegli la classe…")}</option>
        {classi.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function NessunaAltraClasse() {
  const t = useT();
  return (
    <p className="text-sm text-muted-foreground">
      {t("Non hai altre classi aperte. Crea prima la classe nuova da «Le tue classi»: lì puoi anche partire direttamente da questa.")}
    </p>
  );
}

/**
 * «Copia in un'altra classe» sulla pagina di un compito: lo stesso compito,
 * con le sue mani e i suoi esercizi, in un'altra classe dell'insegnante.
 * I risultati non viaggiano.
 */
export function CopiaCompitoInClasse({ compito }: { compito: Assignment }) {
  const t = useT();
  const { classes } = useMyClasses();
  const [aperta, setAperta] = useState(false);
  const [arrivo, setArrivo] = useState("");
  const [scadenza, setScadenza] = useState("");
  const [stato, setStato] = useState<"fermo" | "in-corso" | "errore">("fermo");
  const [esito, setEsito] = useState<EsitoCopiaCompito | null>(null);

  const classi = classiDiArrivo(classes, compito.class_id);
  const nomeArrivo = classi.find((c) => c.id === arrivo)?.name ?? "";

  function apri() {
    setArrivo(classi.length === 1 ? classi[0].id : "");
    setScadenza(scadenzaProposta(compito.due_date)?.slice(0, 10) ?? "");
    setEsito(null);
    setStato("fermo");
    setAperta(true);
  }

  async function copia() {
    if (!arrivo) return;
    setStato("in-corso");
    try {
      setEsito(await copiaCompito(compito, arrivo, scadenza ? new Date(scadenza).toISOString() : null));
      setStato("fermo");
    } catch (err) {
      segnalaSalvoRete("istruttori/compito:copia", err);
      setStato("errore");
    }
  }

  return (
    <>
      <Button variant="outline" size="sm" onClick={apri}>
        <CopyPlus className="h-4 w-4" aria-hidden="true" />
        {t("Copia in un'altra classe")}
      </Button>
      <Dialog open={aperta} onOpenChange={setAperta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{t("Copia in un'altra classe")}</DialogTitle>
            <DialogDescription>
              {t("Lo stesso compito, con le stesse mani, gli esercizi e le impostazioni. I risultati di questa classe restano qui.")}
            </DialogDescription>
          </DialogHeader>

          {esito ? (
            <div className="space-y-3 py-2 text-sm">
              {esito.esito === "copiato" ? (
                <p>{t("Fatto: «{titolo}» è ora anche in «{classe}».", { titolo: compito.title, classe: nomeArrivo })}</p>
              ) : (
                <p>
                  {t("In «{classe}» questa lezione è già assegnata: ogni lezione ha un solo compito per classe, e quello c'è già.", {
                    classe: nomeArrivo,
                  })}
                </p>
              )}
              {esito.id && (
                <Link href={`/istruttori/${arrivo}/compito/${esito.id}`} className="font-semibold underline underline-offset-2">
                  {t("Apri il compito in «{classe}»", { classe: nomeArrivo })}
                </Link>
              )}
            </div>
          ) : classi.length === 0 ? (
            <NessunaAltraClasse />
          ) : (
            <div className="space-y-4 py-2">
              <SceltaClasse classi={classi} valore={arrivo} onCambia={setArrivo} />
              <div className="space-y-1.5">
                <label htmlFor="scadenza-copia" className="text-sm font-medium">
                  {t("Scadenza")} <span className="text-muted-foreground">{t("(facoltativa)")}</span>
                </label>
                <input id="scadenza-copia" type="date" value={scadenza} onChange={(e) => setScadenza(e.target.value)} className={campo} />
              </div>
              {stato === "errore" && (
                <p className="text-sm text-destructive">{t("Non copiato. Controlla la connessione e riprova.")}</p>
              )}
            </div>
          )}

          <DialogFooter>
            {esito ? (
              <Button onClick={() => setAperta(false)}>{t("Chiudi")}</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setAperta(false)} disabled={stato === "in-corso"}>
                  {t("Annulla")}
                </Button>
                <Button onClick={() => void copia()} disabled={!arrivo || stato === "in-corso"}>
                  {stato === "in-corso" ? t("Copio…") : t("Copia")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/** Il riepilogo di una copia, in parole. */
export function RiepilogoDellaCopia({ r }: { r: RiepilogoCopia }) {
  const t = useT();
  return (
    <ul className="list-disc space-y-1 pl-5 text-sm">
      <li>{t("Compiti copiati: {n}", { n: r.compitiCopiati })}</li>
      {r.compitiSaltati.length > 0 && (
        <li>
          {t("Già presenti nell'altra classe, lasciati com'erano: {titoli}", { titoli: r.compitiSaltati.join(", ") })}
        </li>
      )}
      <li>{t("Materiali copiati: {n}", { n: r.materialiCopiati })}</li>
      {r.materialiGiaPresenti > 0 && <li>{t("Materiali che c'erano già: {n}", { n: r.materialiGiaPresenti })}</li>}
    </ul>
  );
}

/** Le due scelte su cosa copiare e su come escono i materiali già pubblicati. */
export function OpzioniCopia({
  compiti,
  materiali,
  usciti,
  onCambia,
}: {
  compiti: boolean;
  materiali: boolean;
  usciti: MaterialiUsciti;
  onCambia: (o: { compiti: boolean; materiali: boolean; usciti: MaterialiUsciti }) => void;
}) {
  const t = useT();
  return (
    <div className="space-y-3">
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4"
          checked={compiti}
          onChange={(e) => onCambia({ compiti: e.target.checked, materiali, usciti })}
        />
        <span>{t("I compiti, con mani ed esercizi (senza i risultati)")}</span>
      </label>
      <label className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          className="mt-0.5 h-4 w-4"
          checked={materiali}
          onChange={(e) => onCambia({ compiti, materiali: e.target.checked, usciti })}
        />
        <span>{t("I materiali: video, dispense, esercizi, con i loro orari di uscita")}</span>
      </label>
      {materiali && (
        <fieldset className="space-y-2 rounded-md border border-border p-3 text-sm">
          <legend className="px-1 text-xs font-semibold text-muted-foreground">{t("I materiali già usciti nella classe di partenza")}</legend>
          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="usciti"
              className="mt-0.5 h-4 w-4"
              checked={usciti === "pubblicati"}
              onChange={() => onCambia({ compiti, materiali, usciti: "pubblicati" })}
            />
            <span>{t("Escono subito anche nell'altra classe: le due vanno di pari passo")}</span>
          </label>
          <label className="flex items-start gap-2">
            <input
              type="radio"
              name="usciti"
              className="mt-0.5 h-4 w-4"
              checked={usciti === "nascosti"}
              onChange={() => onCambia({ compiti, materiali, usciti: "nascosti" })}
            />
            <span>{t("Restano nascosti: li pubblico io lezione per lezione")}</span>
          </label>
        </fieldset>
      )}
    </div>
  );
}

/**
 * «Copia compiti e materiali in un'altra classe», dalla pagina della classe:
 * per due classi dello stesso corso (pomeriggio e sera), o per portare il
 * lavoro in una classe appena creata.
 */
export function CopiaClasseIn({ classId }: { classId: string }) {
  const t = useT();
  const { classes } = useMyClasses();
  const [aperta, setAperta] = useState(false);
  const [arrivo, setArrivo] = useState("");
  const [opzioni, setOpzioni] = useState<{ compiti: boolean; materiali: boolean; usciti: MaterialiUsciti }>({
    compiti: true,
    materiali: true,
    usciti: "pubblicati",
  });
  const [stato, setStato] = useState<"fermo" | "in-corso" | "errore">("fermo");
  const [riepilogo, setRiepilogo] = useState<RiepilogoCopia | null>(null);

  const classi = classiDiArrivo(classes, classId);
  const nomeArrivo = classi.find((c) => c.id === arrivo)?.name ?? "";

  function apri() {
    setArrivo(classi.length === 1 ? classi[0].id : "");
    setRiepilogo(null);
    setStato("fermo");
    setAperta(true);
  }

  async function copia() {
    if (!arrivo) return;
    setStato("in-corso");
    try {
      setRiepilogo(await copiaClasse(classId, arrivo, opzioni));
      setStato("fermo");
    } catch (err) {
      segnalaSalvoRete("istruttori/classe:copia", err);
      setStato("errore");
    }
  }

  return (
    <>
      <Button variant="outline" onClick={apri}>
        <CopyPlus className="h-4 w-4" aria-hidden="true" />
        {t("Copia in un'altra classe")}
      </Button>
      <Dialog open={aperta} onOpenChange={setAperta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-display text-2xl">{t("Copia compiti e materiali")}</DialogTitle>
            <DialogDescription>
              {t("Per lo stesso corso in due classi, come pomeriggio e sera. Gli allievi, i risultati e la chat restano in questa classe.")}
            </DialogDescription>
          </DialogHeader>

          {riepilogo ? (
            <div className="space-y-3 py-2">
              <p className="text-sm font-semibold">{t("Fatto. In «{classe}»:", { classe: nomeArrivo })}</p>
              <RiepilogoDellaCopia r={riepilogo} />
              <Link href={`/istruttori/${arrivo}`} className="inline-block text-sm font-semibold underline underline-offset-2">
                {t("Vai a «{classe}»", { classe: nomeArrivo })}
              </Link>
            </div>
          ) : classi.length === 0 ? (
            <NessunaAltraClasse />
          ) : (
            <div className="space-y-4 py-2">
              <SceltaClasse classi={classi} valore={arrivo} onCambia={setArrivo} />
              <OpzioniCopia {...opzioni} onCambia={setOpzioni} />
              <p className="text-xs text-muted-foreground">
                {t("Le scadenze già passate si tolgono. Quello che nell'altra classe c'è già non si copia una seconda volta.")}
              </p>
              {stato === "errore" && (
                <p className="text-sm text-destructive">
                  {t("La copia si è fermata a metà: controlla la connessione e riprova. Quello già copiato non si ripete.")}
                </p>
              )}
            </div>
          )}

          <DialogFooter>
            {riepilogo ? (
              <Button onClick={() => setAperta(false)}>{t("Chiudi")}</Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setAperta(false)} disabled={stato === "in-corso"}>
                  {t("Annulla")}
                </Button>
                <Button
                  onClick={() => void copia()}
                  disabled={!arrivo || (!opzioni.compiti && !opzioni.materiali) || stato === "in-corso"}
                >
                  {stato === "in-corso" ? t("Copio…") : t("Copia")}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
