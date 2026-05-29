"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Lock, Eye, EyeOff, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("La password deve avere almeno 6 caratteri.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Le password non coincidono.");
      return;
    }

    setLoading(true);
    const { error: updateError } = await supabase.auth.updateUser({
      password,
    });
    setLoading(false);

    if (updateError) {
      if (updateError.message.includes("same")) {
        setError("La nuova password deve essere diversa dalla precedente.");
      } else {
        setError("Errore nell'aggiornamento della password. Riprova.");
      }
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/"), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#003DA5]/5 via-[#003DA5]/3 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-[#003DA5]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-[#003DA5]" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Nuova Password</h1>
            <p className="text-sm text-gray-500 mt-2">
              Inserisci la tua nuova password
            </p>
          </div>

          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto" />
              <p className="text-green-700 font-semibold">
                Password aggiornata con successo!
              </p>
              <p className="text-sm text-gray-500">
                Reindirizzamento in corso...
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                  Nuova password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full h-12 px-4 pr-12 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#003DA5] focus:border-transparent transition-all"
                    placeholder="Almeno 6 caratteri"
                    autoFocus
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wider">
                  Conferma password
                </label>
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#003DA5] focus:border-transparent transition-all"
                  placeholder="Ripeti la password"
                  required
                />
              </div>

              {error && (
                <p className="text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                disabled={loading || !password || !confirmPassword}
                className="w-full h-12 bg-[#003DA5] hover:bg-[#003DA5]/90 text-white font-semibold rounded-xl"
              >
                {loading ? "Aggiornamento..." : "Aggiorna Password"}
              </Button>

              <div className="text-center">
                <Link
                  href="/login"
                  className="text-sm text-gray-500 hover:text-[#003DA5] transition-colors"
                >
                  Torna al login
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
