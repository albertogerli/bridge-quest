import { createServerClient } from "@supabase/ssr";
import { destinazioneSicura } from "@/lib/destinazione-login";
import { NextResponse, type NextRequest } from "next/server";
import {
  linguaDaPercorso,
  senzaLingua,
  LINGUA_PREDEFINITA,
} from "@/lib/lingua";

const PROTECTED_ROUTES = ["/admin"];

export async function proxy(request: NextRequest) {
  /**
   * LA LINGUA ANCHE ALLE PAGINE DI SERVER, e va messa qui in cima.
   *
   * `useLingua()` la ricava dall'indirizzo, ma è un hook: in un componente
   * server non gira. E il server l'indirizzo con il prefisso non lo vede
   * nemmeno, perché `/en/...` è una RISCRITTURA — il browser mostra `/en`, il
   * server riceve `/`. Senza questo, una pagina resa sul server non ha modo di
   * sapere in che lingua si sta leggendo, e resta italiana anche sotto `/en`:
   * è quello che succedeva a `/accessibilita`.
   *
   * Va sulle intestazioni della RICHIESTA, non della risposta: `headers()` in
   * un componente server legge quelle in entrata. Sulla risposta non la
   * vedrebbe nessuno.
   */
  const linguaRichiesta = linguaDaPercorso(request.nextUrl.pathname);
  const intestazioni = new Headers(request.headers);
  intestazioni.set("x-bridgelab-lingua", linguaRichiesta);

  let supabaseResponse = NextResponse.next({ request: { headers: intestazioni } });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request: { headers: intestazioni } });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  /**
   * LA LINGUA STA NELL'INDIRIZZO, e da qui in giù si ragiona sull'indirizzo
   * senza prefisso: `/en/admin` è la stessa pagina di `/admin` e va protetta
   * allo stesso modo. Confrontare le rotte protette con il percorso grezzo
   * avrebbe lasciato l'amministrazione aperta a chiunque conoscesse il
   * prefisso — un buco che si apre da solo il giorno in cui si aggiunge una
   * lingua, e che nessuna prova in italiano vedrebbe mai.
   */
  const percorsoIntero = request.nextUrl.pathname;
  const lingua = linguaRichiesta;
  const pathname = senzaLingua(percorsoIntero);

  const isProtected = PROTECTED_ROUTES.some((route) =>
    pathname.startsWith(route)
  );

  // Chi viene rimandato al login ci va nella SUA lingua, e ci torna nella sua:
  // spedire un inglese sulla pagina italiana per poi riportarcelo è il modo
  // più veloce di fargli perdere la lingua per strada.
  const prefisso = lingua === LINGUA_PREDEFINITA ? "" : `/${lingua}`;

  if (!user && isProtected) {
    const loginUrl = new URL(`${prefisso}/login`, request.url);
    loginUrl.searchParams.set("redirect", `${prefisso}${pathname}`);
    return NextResponse.redirect(loginUrl);
  }

  if (user && pathname === "/login") {
    // `?redirect=` arriva dall'indirizzo, quindi lo sceglie chi manda il
    // collegamento: `new URL("https://altrove", base)` è un indirizzo esterno,
    // e questo rimbalzo partirebbe dal nostro dominio. Stessa guardia della
    // pagina di login, che ha lo stesso problema dal lato client.
    const chiesta = destinazioneSicura(request.nextUrl.searchParams.get("redirect"));
    const redirect = chiesta === "/" ? `${prefisso}/` : chiesta;
    const destUrl = new URL(redirect, request.url);
    return NextResponse.redirect(destUrl);
  }

  /**
   * La riscrittura di `/en/...` verso la pagina italiana NON sta qui: è
   * dichiarata in `next.config.ts`, perché su Vercel una richiesta che non
   * corrisponde a nessuna rotta diventa 404 prima che il proxy possa
   * riscriverla. Qui resta la parte che al routing non compete: riconoscere
   * che `/en/admin` è la stessa area protetta di `/admin`.
   */
  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|ico)$).*)",
  ],
};
