"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Category = "lezioni" | "strategia" | "tornei" | "generale" | "off-topic";

const CATEGORIES: { key: Category; label: string; emoji: string }[] = [
  { key: "lezioni", label: "Lezioni", emoji: "📚" },
  { key: "strategia", label: "Strategia", emoji: "🧠" },
  { key: "tornei", label: "Tornei", emoji: "🏆" },
  { key: "generale", label: "Generale", emoji: "💬" },
  { key: "off-topic", label: "Off-topic", emoji: "🎲" },
];

export default function NuovoPostPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<Category>("generale");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const supabase = createClient();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim()) {
      setError("Inserisci un titolo");
      return;
    }
    if (!body.trim()) {
      setError("Inserisci il contenuto del post");
      return;
    }

    setLoading(true);
    setError("");

    const { data, error: err } = await supabase
      .from("forum_posts")
      .insert({
        user_id: user.id,
        category,
        title: title.trim(),
        body: body.trim(),
      })
      .select("id")
      .single();

    if (err) {
      setError(err.message);
      setLoading(false);
      return;
    }

    router.push(`/forum/${data.id}`);
  };

  if (!user) {
    return (
      <div className="pt-6 px-4 sm:px-5 pb-24 text-center">
        <span className="text-5xl block mb-4 mt-12">🔒</span>
        <p className="text-lg font-bold text-gray-900">Devi accedere per scrivere</p>
        <Link href="/login">
          <Button className="mt-4 h-10 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 font-bold text-sm">
            Accedi
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-6 px-4 sm:px-5 pb-24">
      <div className="mx-auto max-w-2xl">
        {/* Back */}
        <Link
          href="/forum"
          className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-emerald-600 transition-colors mb-4"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <polyline points="15,18 9,12 15,6" />
          </svg>
          Forum
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Nuovo post</h1>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wider">
                Categoria
              </label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(({ key, label, emoji }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setCategory(key)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                      category === key
                        ? "bg-emerald-100 text-emerald-700 ring-2 ring-emerald-500"
                        : "bg-gray-50 text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    <span>{emoji}</span>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                Titolo
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={200}
                className="w-full h-12 px-4 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                placeholder="Di cosa vuoi parlare?"
              />
            </div>

            {/* Body */}
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wider">
                Contenuto
              </label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={8}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all resize-none"
                placeholder="Scrivi il tuo messaggio..."
              />
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-50 text-red-600 text-sm font-medium rounded-xl px-4 py-3"
              >
                {error}
              </motion.div>
            )}

            {/* Submit */}
            <div className="flex gap-3 pt-2">
              <Link href="/forum" className="flex-1">
                <Button type="button" variant="outline" className="w-full h-12 rounded-xl font-bold">
                  Annulla
                </Button>
              </Link>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 h-12 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 font-extrabold shadow-lg shadow-emerald-500/20 disabled:opacity-50"
              >
                {loading ? "Pubblicazione..." : "Pubblica"}
              </Button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
