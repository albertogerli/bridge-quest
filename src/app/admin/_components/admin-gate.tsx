"use client";

import Link from "next/link";

/** Schermate del gate di accesso alla dashboard admin. */

export function AuthLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-sm text-gray-400 mt-4">Caricamento autenticazione...</p>
      </div>
    </div>
  );
}

export function ConnectionErrorScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">&#9888;&#65039;</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Errore di connessione</h1>
        <p className="text-gray-500 mb-4">Impossibile connettersi a Supabase. Controlla la connessione e riprova.</p>
        <Link href="/login" className="text-emerald-600 font-bold hover:underline">
          Vai al login
        </Link>
      </div>
    </div>
  );
}

export function ProfileLoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

export function AccessDeniedScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">&#128274;</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Accesso negato</h1>
        <p className="text-gray-500 mb-6">Questa pagina è riservata agli amministratori.</p>
        <Link href="/" className="text-emerald-600 font-bold hover:underline">
          Torna alla home
        </Link>
      </div>
    </div>
  );
}
