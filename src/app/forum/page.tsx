"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
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
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
    asd_id: number | null;
  } | null;
}

export default function ForumPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState<Category | "tutti">("tutti");
  const [sortBy, setSortBy] = useState<SortBy>("recenti");
  const supabase = createClient();

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("forum_posts")
      .select("*, profiles(display_name, avatar_url, asd_id)");

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

    const { data } = await query.limit(50);
    setPosts((data as ForumPost[]) || []);
    setLoading(false);
  }, [category, sortBy, supabase]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "ora";
    if (mins < 60) return `${mins}m fa`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h fa`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}g fa`;
    return `${Math.floor(days / 30)}mesi fa`;
  };

  const categoryEmoji = (cat: Category) =>
    CATEGORIES.find((c) => c.key === cat)?.emoji || "💬";

  return (
    <div className="pt-6 px-4 sm:px-5 pb-24">
      <div className="mx-auto max-w-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-extrabold text-gray-900">Forum</h1>
            <p className="text-sm text-gray-500 mt-0.5">La community dei bridgisti</p>
          </div>
          {user && (
            <Link href="/forum/nuovo">
              <Button className="h-10 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 font-bold text-sm shadow-lg shadow-emerald-500/20">
                <svg className="w-4 h-4 mr-1.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M12 5v14M5 12h14" />
                </svg>
                Nuovo post
              </Button>
            </Link>
          )}
        </div>

        {/* Category Filter */}
        <div className="flex gap-1.5 overflow-x-auto pb-2 mb-4 no-scrollbar">
          {CATEGORIES.map(({ key, label, emoji }) => (
            <button
              key={key}
              onClick={() => setCategory(key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                category === key
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-gray-50 text-gray-500 hover:bg-gray-100"
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
            { key: "votati" as SortBy, label: "Piu' votati" },
            { key: "commentati" as SortBy, label: "Piu' commentati" },
          ]).map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setSortBy(key)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-all ${
                sortBy === key
                  ? "bg-gray-900 text-white"
                  : "text-gray-400 hover:text-gray-600"
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
              <div key={i} className="bg-white rounded-2xl p-4 animate-pulse">
                <div className="h-4 w-2/3 bg-gray-100 rounded mb-2" />
                <div className="h-3 w-1/3 bg-gray-50 rounded" />
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
            <p className="text-lg font-bold text-gray-900">Nessun post ancora</p>
            <p className="text-sm text-gray-500 mt-1">Sii il primo a scrivere!</p>
            {user && (
              <Link href="/forum/nuovo">
                <Button className="mt-4 h-10 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 font-bold text-sm">
                  Scrivi il primo post
                </Button>
              </Link>
            )}
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
                    <div className={`bg-white rounded-2xl p-4 card-elevated hover:shadow-lg transition-shadow ${
                      post.pinned ? "ring-2 ring-amber-400/50" : ""
                    }`}>
                      <div className="flex items-start gap-3">
                        {/* Avatar */}
                        <div className="h-9 w-9 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden">
                          {post.profiles?.avatar_url ? (
                            <img src={post.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            (post.profiles?.display_name || "?")[0].toUpperCase()
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Pinned + Category */}
                          <div className="flex items-center gap-1.5 mb-1">
                            {post.pinned && (
                              <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded">
                                PINNED
                              </span>
                            )}
                            <span className="text-[10px] text-gray-400">
                              {categoryEmoji(post.category)} {post.category}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-sm font-bold text-gray-900 line-clamp-2">
                            {post.title}
                          </h3>

                          {/* Meta */}
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-gray-400">
                            <span className="font-semibold text-gray-500">
                              {post.profiles?.display_name || "Anonimo"}
                            </span>
                            <span>{timeAgo(post.created_at)}</span>
                            <span className="flex items-center gap-0.5">
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                              </svg>
                              {post.likes_count}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                              </svg>
                              {post.comments_count}
                            </span>
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

        {/* Login CTA */}
        {!user && (
          <div className="mt-8 text-center bg-gray-50 rounded-2xl p-6">
            <p className="text-sm text-gray-600 font-medium">
              Accedi per partecipare alla discussione
            </p>
            <Link href="/login">
              <Button className="mt-3 h-10 px-6 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 font-bold text-sm">
                Accedi o registrati
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
