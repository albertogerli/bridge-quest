"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { confrontoMano, riassunto, type RigaConfronto } from "@/lib/confronto-classe";
import { useT } from "@/contexts/traduzioni-provider";

/**
 * Il confronto con la classe, sotto il risultato di una mano.
 *
 * NON È UNA CLASSIFICA. Le righe sono ordinate per prese, ma senza posizione e
 * senza nomi: la domanda a cui risponde è «era una mano difficile o l'ho
 * sbagliata io», e quella risposta non ha bisogno di sapere chi.
 *
 * COMPARE SOLO SE QUALCUN ALTRO HA GIÀ GIOCATO. Un confronto con una riga sola
 * — la propria — non dice niente e occupa spazio: chi arriva per primo non
 * vede nulla, e lo vedrà tornando.
 */
export function ConfrontoClasse({
  assignmentId,
  smazzataId,
}: {
  assignmentId: string;
  smazzataId: string;
}) {
  const t = useT();
  const [righe, setRighe] = useState<RigaConfronto[] | null>(null);

  useEffect(() => {
    let vivo = true;
    void confrontoMano(assignmentId, smazzataId).then((r) => {
      if (vivo) setRighe(r);
    });
    return () => {
      vivo = false;
    };
  }, [assignmentId, smazzataId]);

  if (!righe || righe.length < 2) return null;

  const { quanti, mantenuti, mio } = riassunto(righe);

  return (
    <div className="mt-4 rounded-xl border border-border bg-card p-4">
      <p className="mb-2 flex items-center gap-2 text-sm font-semibold">
        <Users className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        {t("Come è andata agli altri")}
      </p>

      <p className="mb-3 text-sm text-muted-foreground">
        {mantenuti} su {quanti} l&rsquo;hanno mantenuto
        {mio && (
          <>
            {" · "}
            <span className={mio.mantenuto ? "font-semibold text-emerald-600" : "font-semibold text-red-600"}>
              tu {mio.mantenuto ? "sì" : "no"}
              {mio.prese !== null && `, ${mio.prese} prese`}
            </span>
          </>
        )}
      </p>

      <ul className="space-y-1">
        {righe.map((r, i) => (
          <li
            key={`${r.nome}-${i}`}
            className={`flex items-center gap-2 rounded-lg px-2 py-1 text-sm ${
              r.e_mio ? "bg-primary/10 font-semibold" : ""
            }`}
          >
            <span className="min-w-0 flex-1 truncate">{r.e_mio ? "Tu" : r.nome}</span>
            <span className="tabular-nums text-muted-foreground">
              {r.prese !== null ? `${r.prese} prese` : "—"}
            </span>
            <span className={r.mantenuto ? "text-emerald-600" : "text-red-600"}>
              {r.mantenuto ? "✓" : "✗"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
