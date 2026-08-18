"use client";

import { useEffect, useState } from "react";
import { Megaphone, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSharedAuth } from "@/contexts/auth-provider";
import {
  cancellaAvviso,
  getClubPosts,
  pubblicaAvviso,
  puoScrivere,
  type ClubPost,
} from "@/lib/club-posts";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * La bacheca di un circolo.
 *
 * Gli avvisi sono PER I SOCI: chi non è di quel circolo non li vede, e il
 * filtro sta nelle policy del database, non qui. Se questa schermata avesse un
 * difetto, il peggio che può capitare è che non mostri qualcosa — non che
 * mostri qualcosa che non doveva.
 *
 * Il riquadro sparisce del tutto quando non c'è niente da dire e chi guarda
 * non può scrivere: una bacheca vuota su una pagina pubblica sembra un
 * circolo abbandonato, ed è peggio del non averla.
 */
export function BachecaCircolo({ asdCode }: { asdCode: string }) {
  const t = useT();
  const { user, loading } = useSharedAuth();
  const [avvisi, setAvvisi] = useState<ClubPost[] | null>(null);
  const [scrivo, setScrivo] = useState(false);
  const [titolo, setTitolo] = useState("");
  const [corpo, setCorpo] = useState("");
  const [inCorso, setInCorso] = useState(false);
  const [errore, setErrore] = useState("");
  const [abilitato, setAbilitato] = useState(false);

  useEffect(() => {
    if (loading || !user || !asdCode) return;
    let vivo = true;
    getClubPosts(asdCode).then((a) => { if (vivo) setAvvisi(a); });
    puoScrivere(asdCode).then((p) => { if (vivo) setAbilitato(p); });
    return () => { vivo = false; };
  }, [asdCode, user, loading]);

  const pubblica = async () => {
    if (!titolo.trim() || !corpo.trim()) return;
    setInCorso(true);
    setErrore("");
    const esito = await pubblicaAvviso({ asdCode, titolo, corpo });
    if (esito.ok) {
      setTitolo("");
      setCorpo("");
      setScrivo(false);
      setAvvisi(await getClubPosts(asdCode));
    } else {
      setErrore(esito.errore ?? "Non è stato possibile pubblicare.");
    }
    setInCorso(false);
  };

  const elimina = async (id: string) => {
    if (await cancellaAvviso(id)) setAvvisi(await getClubPosts(asdCode));
  };

  if (loading || !user) return null;
  if (avvisi !== null && avvisi.length === 0 && !abilitato) return null;

  return (
    <section className="mt-8" aria-labelledby="bacheca-circolo">
      <div className="flex items-center justify-between mb-3">
        <h2
          id="bacheca-circolo"
          className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-muted-foreground"
        >
          <Megaphone className="w-4 h-4" aria-hidden="true" />
          {t("Bacheca del circolo")}
        </h2>
        {abilitato && !scrivo && (
          <Button variant="outline" onClick={() => setScrivo(true)}>
            {t("Scrivi un avviso")}
          </Button>
        )}
      </div>

      {abilitato && scrivo && (
        <div className="rounded-2xl border border-border bg-card p-4 mb-4">
          <label htmlFor="avviso-titolo" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
            {t("Titolo")}
          </label>
          <input
            id="avviso-titolo"
            value={titolo}
            maxLength={120}
            onChange={(e) => setTitolo(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-border bg-card text-sm mb-3"
            placeholder="Torneo sociale di giovedì"
          />
          <label htmlFor="avviso-corpo" className="block text-xs font-semibold text-muted-foreground mb-1.5 uppercase tracking-wider">
            {t("Testo")}
          </label>
          <textarea
            id="avviso-corpo"
            value={corpo}
            maxLength={4000}
            rows={4}
            onChange={(e) => setCorpo(e.target.value)}
            className="w-full px-3 py-2 rounded-xl border border-border bg-card text-sm mb-3"
            placeholder="Ritrovo alle 20.30, iscrizioni entro mercoledì."
          />
          {errore && <p className="text-sm text-destructive mb-2">{errore}</p>}
          <div className="flex gap-2">
            <Button disabled={inCorso || !titolo.trim() || !corpo.trim()} onClick={pubblica}>
              {inCorso ? "Pubblico…" : "Pubblica"}
            </Button>
            <Button variant="outline" onClick={() => { setScrivo(false); setErrore(""); }}>
              {t("Annulla")}
            </Button>
          </div>
        </div>
      )}

      {avvisi === null && <p className="text-sm text-muted-foreground">{t("Carico…")}</p>}

      {avvisi && avvisi.length === 0 && abilitato && (
        <p className="text-sm text-muted-foreground">
          {t("Nessun avviso. Il primo che scrivi lo vedranno i soci del circolo.")}
        </p>
      )}

      <ul className="space-y-3">
        {(avvisi ?? []).map((a) => (
          <li key={a.id} className="rounded-2xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-sm">{a.titolo}</h3>
              {a.author_id === user.id && (
                <button
                  onClick={() => elimina(a.id)}
                  aria-label={`Elimina l'avviso ${a.titolo}`}
                  className="text-muted-foreground hover:text-destructive shrink-0"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{a.corpo}</p>
            <p className="text-xs text-muted-foreground mt-2">
              {a.autore ?? "Il circolo"} ·{" "}
              {new Date(a.created_at).toLocaleDateString("it-IT", {
                day: "numeric", month: "long", year: "numeric",
              })}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
