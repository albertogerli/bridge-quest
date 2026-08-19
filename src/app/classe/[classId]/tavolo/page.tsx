import { redirect } from "next/navigation";

/**
 * Il tavolo dell'allievo stava sotto `/classe/` — singolare — mentre tutta
 * l'area allievo sta sotto `/classi/`. Non lo linkava nessuno, quindi
 * l'incongruenza non si era mai vista: ci si arrivava solo digitando
 * l'indirizzo a mano, ed è probabilmente successo, visto che era l'unico modo.
 *
 * La pagina è stata spostata al posto giusto; questo resta perché quei pochi
 * indirizzi scritti a mano continuino a funzionare.
 */
export default async function TavoloVecchioPercorso({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const { classId } = await params;
  redirect(`/classi/${classId}/tavolo`);
}
