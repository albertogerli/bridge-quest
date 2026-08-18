import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  fuoriDallaTraduzione,
  linguaDaPercorso,
  senzaLingua,
  LINGUA_PREDEFINITA,
} from "@/lib/lingua";

const PROTECTED_ROUTES = ["/admin"];

export async function proxy(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

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
          supabaseResponse = NextResponse.next({ request });
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
  const lingua = linguaDaPercorso(percorsoIntero);
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
    const redirect = request.nextUrl.searchParams.get("redirect") || `${prefisso}/`;
    const destUrl = new URL(redirect, request.url);
    return NextResponse.redirect(destUrl);
  }

  /**
   * La riscrittura: l'indirizzo che si vede resta `/en/lezioni`, la pagina che
   * risponde è quella di sempre. Così non si duplica nessuna rotta e le 40
   * cartelle sotto `src/app` restano dove sono — spostarle tutte dentro un
   * segmento `[locale]` è il modo canonico, ma è anche il modo di rompere
   * quaranta rotte in una volta sola per una fase che non traduce niente.
   *
   * Le API e i file dell'applicazione non passano di qui: vedi
   * `fuoriDallaTraduzione`.
   */
  if (lingua !== LINGUA_PREDEFINITA && !fuoriDallaTraduzione(pathname)) {
    const destinazione = request.nextUrl.clone();
    destinazione.pathname = pathname;
    const riscritta = NextResponse.rewrite(destinazione, { request });
    /**
     * Si riportano SOLO i cookie, non tutti gli header della risposta di
     * Supabase.
     *
     * Quella risposta è una `NextResponse.next()`, e porta con sé gli header
     * con cui Next si dice «prosegui»: copiarli dentro una riscrittura le
     * mescola due istruzioni diverse, e il risultato osservato era una pagina
     * che finiva sul login senza che nessuno l'avesse chiesto. I cookie invece
     * servono davvero — sono la sessione rinfrescata — e vanno passati.
     */
    supabaseResponse.cookies.getAll().forEach((c) => riscritta.cookies.set(c));
    return riscritta;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|sw\\.js|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4|ico)$).*)",
  ],
};
