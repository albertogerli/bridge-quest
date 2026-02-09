"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";

interface Post {
  id: number;
  user_id: string;
  category: string;
  title: string;
  body: string;
  likes_count: number;
  comments_count: number;
  pinned: boolean;
  created_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface Comment {
  id: number;
  post_id: number;
  user_id: string;
  body: string;
  likes_count: number;
  created_at: string;
  profiles: {
    display_name: string | null;
    avatar_url: string | null;
  } | null;
}

export default function PostDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const supabase = createClient();

  const postId = params.postId as string;

  const fetchPost = useCallback(async () => {
    const { data } = await supabase
      .from("forum_posts")
      .select("*, profiles(display_name, avatar_url)")
      .eq("id", postId)
      .single();
    setPost((data as Post) ?? null);
  }, [postId, supabase]);

  const fetchComments = useCallback(async () => {
    const { data } = await supabase
      .from("forum_comments")
      .select("*, profiles(display_name, avatar_url)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });
    setComments((data as Comment[]) || []);
  }, [postId, supabase]);

  const checkLike = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("forum_likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", postId)
      .maybeSingle();
    setHasLiked(!!data);
  }, [user, postId, supabase]);

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchPost(), fetchComments(), checkLike()]);
      setLoading(false);
    };
    load();
  }, [fetchPost, fetchComments, checkLike]);

  const handleLike = async () => {
    if (!user || !post) return;
    if (hasLiked) {
      await supabase
        .from("forum_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", post.id);
      setHasLiked(false);
      setPost((p) => p ? { ...p, likes_count: Math.max(0, p.likes_count - 1) } : p);
      await supabase
        .from("forum_posts")
        .update({ likes_count: Math.max(0, post.likes_count - 1) })
        .eq("id", post.id);
    } else {
      await supabase
        .from("forum_likes")
        .insert({ user_id: user.id, post_id: post.id });
      setHasLiked(true);
      setPost((p) => p ? { ...p, likes_count: p.likes_count + 1 } : p);
      await supabase
        .from("forum_posts")
        .update({ likes_count: post.likes_count + 1 })
        .eq("id", post.id);
    }
  };

  const handleComment = async () => {
    if (!user || !commentText.trim() || !post) return;
    setSubmitting(true);

    await supabase.from("forum_comments").insert({
      post_id: post.id,
      user_id: user.id,
      body: commentText.trim(),
    });

    await supabase
      .from("forum_posts")
      .update({ comments_count: post.comments_count + 1 })
      .eq("id", post.id);

    setCommentText("");
    setSubmitting(false);
    setPost((p) => p ? { ...p, comments_count: p.comments_count + 1 } : p);
    fetchComments();
  };

  const handleDelete = async () => {
    if (!user || !post || user.id !== post.user_id) return;
    if (!confirm("Eliminare questo post?")) return;
    await supabase.from("forum_posts").delete().eq("id", post.id);
    router.push("/forum");
  };

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

  if (loading) {
    return (
      <div className="pt-6 px-4 sm:px-5 pb-24">
        <div className="mx-auto max-w-2xl animate-pulse">
          <div className="h-6 w-1/3 bg-gray-100 rounded mb-4" />
          <div className="bg-white rounded-2xl p-5">
            <div className="h-5 w-3/4 bg-gray-100 rounded mb-3" />
            <div className="h-4 w-full bg-gray-50 rounded mb-2" />
            <div className="h-4 w-2/3 bg-gray-50 rounded" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="pt-6 px-4 sm:px-5 pb-24 text-center">
        <span className="text-5xl block mb-4">🔍</span>
        <p className="text-lg font-bold text-gray-900">Post non trovato</p>
        <Link href="/forum">
          <Button variant="outline" className="mt-4">Torna al forum</Button>
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

        {/* Post */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl p-5 card-elevated"
        >
          {/* Author */}
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold overflow-hidden">
              {post.profiles?.avatar_url ? (
                <img src={post.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
              ) : (
                (post.profiles?.display_name || "?")[0].toUpperCase()
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">
                {post.profiles?.display_name || "Anonimo"}
              </p>
              <p className="text-[11px] text-gray-400">{timeAgo(post.created_at)}</p>
            </div>
            {post.pinned && (
              <span className="ml-auto text-[10px] font-black text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                PINNED
              </span>
            )}
          </div>

          {/* Category badge */}
          <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg mb-3 uppercase">
            {post.category}
          </span>

          {/* Title + Body */}
          <h1 className="text-lg font-extrabold text-gray-900 mb-3">{post.title}</h1>
          <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
            {post.body}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100">
            <button
              onClick={handleLike}
              disabled={!user}
              className={`flex items-center gap-1.5 text-sm font-bold transition-colors ${
                hasLiked ? "text-red-500" : "text-gray-400 hover:text-red-400"
              } ${!user ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill={hasLiked ? "currentColor" : "none"} stroke="currentColor" strokeWidth={2}>
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {post.likes_count}
            </button>
            <span className="flex items-center gap-1.5 text-sm text-gray-400">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {post.comments_count}
            </span>
            {user && user.id === post.user_id && (
              <button
                onClick={handleDelete}
                className="ml-auto text-xs text-gray-400 hover:text-red-500 transition-colors"
              >
                Elimina
              </button>
            )}
          </div>
        </motion.div>

        {/* Comments */}
        <div className="mt-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3">
            Commenti ({comments.length})
          </h2>

          <AnimatePresence>
            <div className="space-y-2">
              {comments.map((comment, i) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="bg-white rounded-xl p-4 card-elevated"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className="h-7 w-7 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white text-[10px] font-bold overflow-hidden">
                      {comment.profiles?.avatar_url ? (
                        <img src={comment.profiles.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        (comment.profiles?.display_name || "?")[0].toUpperCase()
                      )}
                    </div>
                    <span className="text-xs font-bold text-gray-900">
                      {comment.profiles?.display_name || "Anonimo"}
                    </span>
                    <span className="text-[10px] text-gray-400">
                      {timeAgo(comment.created_at)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {comment.body}
                  </p>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>

          {/* Comment Input */}
          {user ? (
            <div className="mt-4 bg-white rounded-2xl p-4 card-elevated">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Scrivi un commento..."
                rows={3}
                className="w-full text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none"
              />
              <div className="flex justify-end mt-2">
                <Button
                  onClick={handleComment}
                  disabled={!commentText.trim() || submitting}
                  className="h-9 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-700 font-bold text-xs disabled:opacity-40"
                >
                  {submitting ? "Invio..." : "Commenta"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="mt-4 text-center bg-gray-50 rounded-2xl p-4">
              <p className="text-sm text-gray-500">
                <Link href="/login" className="text-emerald-600 font-bold hover:underline">Accedi</Link>
                {" "}per commentare
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
