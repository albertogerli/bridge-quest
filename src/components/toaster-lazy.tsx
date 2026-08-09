"use client";

import dynamic from "next/dynamic";

/**
 * `<Toaster>` di sonner caricato in modo differito.
 *
 * Vive nel root layout, quindi il suo bundle (~9 kB gz) finiva nel chunk
 * condiviso di OGNI route pur non disegnando nulla finché non arriva un toast.
 * Il layout è un Server Component e `ssr: false` non è ammesso lì: questo
 * wrapper client esiste solo per poterlo dichiarare. Non renderizza output SSR
 * (il Toaster monta una lista vuota), quindi il markup iniziale è identico.
 */
const Toaster = dynamic(() => import("sonner").then((m) => m.Toaster), {
  ssr: false,
});

export function ToasterLazy() {
  return <Toaster richColors position="top-center" />;
}
