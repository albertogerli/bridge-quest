"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type Category = "lezioni" | "strategia" | "tornei" | "generale" | "off-topic";
type SortBy = "recenti" | "votati" | "commentati";

const CATEGORIES: { key: Category | "tutti"; label: string; emoji: string }[] = [
  { key: "tutti", label: "Tutti", emoji: "📋" },
  { key: "lezioni", label: "Lezioni", emoji: "📚" },
  { key: "strategia", label: "Strategia", emoji: "🧠" },
  { key: "tornei", label: "Tornei", emoji: "🏆" },
  { key: "generale", label: "Generale", emoji: "💬" },
  { key: "off-topic", label: "Off-topic", emoji: "🎲" },
];

interface ForumPost {
  id: number;
  user_id: string;
  category: Category;
  title: string;
  body: string;
  likes_count: number;
  comments_count: number;
  pinned: boolean;
  created_at: string;
  poll_options: string[] | null;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
    asd_code: string | null;
    asd_name: string | null;
  } | null;
}

export default function ForumPage() {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | "tutti">("tutti");
  const [sortBy, setSortBy] = useState<SortBy>("recenti");
  const supabase = createClient();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    // Safety timeout: never stay loading forever (max 8 seconds)
    const safetyTimer = setTimeout(() => {
      setLoading(false);
    }, 8000);
    try {
      let query = supabase
        .from("forum_posts")
        .select("*, profiles(display_name, avatar_url, asd_code, asd_name)");

      if (category !== "tutti") {
        query = query.eq("category", category);
      }

      if (sortBy === "recenti") {
        query = query.order("pinned", { ascending: false }).order("created_at", { ascending: false });
      } else if (sortBy === "votati") {
        query = query.order("pinned", { ascending: false }).order("likes_count", { ascending: false });
      } else {
        query = query.order("pinned", { ascending: false }).order("comments_count", { ascending: false });
      }

      const { data, error } = await query.limit(50);
      clearTimeout(safetyTimer);
      if (error) console.warn("Forum fetch error:", error.message);
      setPosts((data as ForumPost[]) || []);
    } catch (err) {
      clearTimeout(safetyTimer);
      console.warn("Forum fetch failed:", err);
      setPosts([]);
    }
    setLoading(false);
  }, [category, sortBy, supabase]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- stato aggiornato in risposta a un flusso asincrono (fetch/store): pattern legittimo
    fetchPosts();
  }, [fetchPosts]);

  // Stable clock: updates once per minute so timeAgo is pure
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);

  const timeAgo = useMemo(
    () => (date: string) => {
      const diff = now - new Date(date).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "ora";
      if (mins < 60) return `${mins}m fa`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `${hours}h fa`;
      const days = Math.floor(hours / 24);
      if (days < 30) return `${days}g fa`;
      return `${Math.floor(days / 30)}mesi fa`;
    },
    [now],
  );

  const categoryEmoji = (cat: Category) =>
    CATEGORIES.find((c) => c.key === cat)?.emoji || "💬";

  return (
    <div className="pt-6 px-4 sm:px-5 pb-24">
      <div className="mx-auto max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground font-display">Forum</h1>
            <p className="text-sm text-muted-foreground mt-0.5">La community dei bridgisti</p>
          </div>
          <Link href="/forum/nuovo">
            <Button className="h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 font-bold text-sm shadow-lg shadow-emerald-500/20">
              <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M12 5v14M5 12h14" />
              </svg>
              Nuovo post
            </Button>
          </Link>
        </div>

        {/* Category Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {CATEGORIES.map(({ key, label, emoji }) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                category === key
                  ? "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300"
                  : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <span>{emoji}</span>
              {label}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="flex gap-2 mb-5">
          {([
            { key: "recenti" as SortBy, label: "Recenti" },
            { key: "votati" as SortBy, label: "Più votati" },
            { key: "commentati" as SortBy, label: "Più commentati" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                sortBy === key
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl p-4 animate-pulse">
                <div className="h-4 w-2/3 bg-muted rounded mb-2" />
                <div className="h-3 w-1/3 bg-muted/50 rounded" />
              </div>
            ))}
          </div>
        ) : posts.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <span className="text-5xl block mb-4">💬</span>
            <p className="text-lg font-bold text-foreground">Nessun post ancora</p>
            <p className="text-sm text-muted-foreground mt-1">Sii il primo a scrivere!</p>
            <Link href="/forum/nuovo">
              <Button className="mt-4 h-10 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 font-bold text-sm">
                Scrivi il primo post
              </Button>
            </Link>
          </motion.div>
        ) : (
          <AnimatePresence>
            <div className="space-y-2">
              {posts.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link href={`/forum/${post.id}`}>
                    <div className={`bg-card rounded-2xl p-4 card-clean hover:shadow-lg transition-shadow ${
                      post.pinned ? "ring-2 ring-amber-400/50" : ""
                    }`}>
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                          {post.profiles?.avatar_url ? (
                            <Image src={post.profiles.avatar_url} alt="Avatar utente" width={36} height={36} className="h-full w-full object-cover" />
                          ) : (
                            (post.profiles?.display_name || "?")[0].toUpperCase()
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Pinned + Category */}
                          <div className="flex items-center gap-1.5 mb-1">
                            {post.pinned && (
                              <span className="text-[12px] font-bold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-1.5 py-0.5 rounded">
                                PINNED
                              </span>
                            )}
                            {post.poll_options && post.poll_options.length > 0 && (
                              <span className="text-[12px] font-bold text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/40 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                                <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                  <path d="M18 20V10M12 20V4M6 20v-6" />
                                </svg>
                                SONDAGGIO
                              </span>
                            )}
                            <span className="text-[12px] text-muted-foreground">
                              {categoryEmoji(post.category)} {post.category}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-sm font-bold text-foreground line-clamp-2">
                            {post.title}
                          </h3>

                          {/* Meta */}
                          <div className="flex items-center gap-3 mt-2 text-[12px] text-muted-foreground">
                            <span className="font-semibold text-muted-foreground">
                              {post.profiles?.display_name || "Anonimo"}
                            </span>
                            <span>{timeAgo(post.created_at)}</span>
                            <span className="flex items-center gap-0.5">
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                              </svg>
                              {post.likes_count}
                            </span>
                            {post.comments_count > 0 ? (
                              <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded-md font-bold">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                {post.comments_count} {post.comments_count === 1 ? "risposta" : "risposte"}
                              </span>
                            ) : (
                              <span className="flex items-center gap-0.5">
                                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                                </svg>
                                0
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}

      </div>
    </div>
  );
}
