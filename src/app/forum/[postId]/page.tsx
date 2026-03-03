"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
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
  parent_id: number | null;
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
  const [replyText, setReplyText] = useState("");
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [hasLiked, setHasLiked] = useState(false);
  const [likedComments, setLikedComments] = useState<Set<number>>(new Set());
  const [expandedThreads, setExpandedThreads] = useState<Set<number>>(new Set());
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
      .is("comment_id", null)
      .maybeSingle();
    setHasLiked(!!data);
  }, [user, postId, supabase]);

  const checkCommentLikes = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("forum_likes")
      .select("comment_id")
      .eq("user_id", user.id)
      .not("comment_id", "is", null);
    if (data) {
      setLikedComments(new Set(data.map((d) => d.comment_id!)));
    }
  }, [user, supabase]);

  useEffect(() => {
    const load = async () => {
      await Promise.all([fetchPost(), fetchComments(), checkLike(), checkCommentLikes()]);
      setLoading(false);
    };
    load();
  }, [fetchPost, fetchComments, checkLike, checkCommentLikes]);

  // Build threaded comment tree
  const { topLevelComments, repliesByParent } = useMemo(() => {
    const topLevel: Comment[] = [];
    const replies: Record<number, Comment[]> = {};

    for (const c of comments) {
      if (c.parent_id === null || c.parent_id === undefined) {
        topLevel.push(c);
      } else {
        if (!replies[c.parent_id]) replies[c.parent_id] = [];
        replies[c.parent_id].push(c);
      }
    }

    return { topLevelComments: topLevel, repliesByParent: replies };
  }, [comments]);

  const handleLike = async () => {
    if (!user || !post) return;
    if (hasLiked) {
      await supabase
        .from("forum_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("post_id", post.id)
        .is("comment_id", null);
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

  const handleCommentLike = async (comment: Comment) => {
    if (!user) return;
    const isLiked = likedComments.has(comment.id);

    if (isLiked) {
      await supabase
        .from("forum_likes")
        .delete()
        .eq("user_id", user.id)
        .eq("comment_id", comment.id);
      setLikedComments((prev) => {
        const next = new Set(prev);
        next.delete(comment.id);
        return next;
      });
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id ? { ...c, likes_count: Math.max(0, c.likes_count - 1) } : c
        )
      );
      await supabase
        .from("forum_comments")
        .update({ likes_count: Math.max(0, comment.likes_count - 1) })
        .eq("id", comment.id);
    } else {
      await supabase
        .from("forum_likes")
        .insert({ user_id: user.id, comment_id: comment.id });
      setLikedComments((prev) => new Set(prev).add(comment.id));
      setComments((prev) =>
        prev.map((c) =>
          c.id === comment.id ? { ...c, likes_count: c.likes_count + 1 } : c
        )
      );
      await supabase
        .from("forum_comments")
        .update({ likes_count: comment.likes_count + 1 })
        .eq("id", comment.id);
    }
  };

  const awardXP = (amount: number) => {
    try {
      const current = parseInt(localStorage.getItem("bq_xp") || "0", 10);
      localStorage.setItem("bq_xp", String(current + amount));
      window.dispatchEvent(new Event("bq_stats_updated"));
    } catch {}
  };

  const handleComment = async () => {
    if (!user || !commentText.trim() || !post) return;
    setSubmitting(true);

    await supabase.from("forum_comments").insert({
      post_id: post.id,
      user_id: user.id,
      body: commentText.trim(),
      parent_id: null,
    });

    await supabase
      .from("forum_posts")
      .update({ comments_count: post.comments_count + 1 })
      .eq("id", post.id);

    awardXP(5);

    setCommentText("");
    setSubmitting(false);
    setPost((p) => p ? { ...p, comments_count: p.comments_count + 1 } : p);
    fetchComments();
  };

  const handleReply = async (parentId: number) => {
    if (!user || !replyText.trim() || !post) return;
    setSubmitting(true);

    await supabase.from("forum_comments").insert({
      post_id: post.id,
      user_id: user.id,
      body: replyText.trim(),
      parent_id: parentId,
    });

    await supabase
      .from("forum_posts")
      .update({ comments_count: post.comments_count + 1 })
      .eq("id", post.id);

    awardXP(5);

    setReplyText("");
    setReplyingTo(null);
    setSubmitting(false);
    setPost((p) => p ? { ...p, comments_count: p.comments_count + 1 } : p);
    // Auto-expand thread after replying
    setExpandedThreads((prev) => new Set(prev).add(parentId));
    fetchComments();
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!user || user.id !== comment.user_id) return;
    if (!confirm("Eliminare questo commento?")) return;

    // Count this comment + its replies
    const replyCount = (repliesByParent[comment.id] || []).length;
    const totalToRemove = 1 + replyCount;

    // Delete replies first, then the comment
    if (replyCount > 0) {
      await supabase
        .from("forum_comments")
        .delete()
        .eq("parent_id", comment.id);
    }
    await supabase.from("forum_comments").delete().eq("id", comment.id);

    if (post) {
      const newCount = Math.max(0, post.comments_count - totalToRemove);
      await supabase
        .from("forum_posts")
        .update({ comments_count: newCount })
        .eq("id", post.id);
      setPost((p) => p ? { ...p, comments_count: newCount } : p);
    }
    fetchComments();
  };

  const handleDelete = async () => {
    if (!user || !post || user.id !== post.user_id) return;
    if (!confirm("Eliminare questo post?")) return;
    await supabase.from("forum_posts").delete().eq("id", post.id);
    router.push("/forum");
  };

  const toggleThread = (commentId: number) => {
    setExpandedThreads((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) {
        next.delete(commentId);
      } else {
        next.add(commentId);
      }
      return next;
    });
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

  // Render a single comment card
  const renderComment = (comment: Comment, isReply = false) => {
    const replies = repliesByParent[comment.id] || [];
    const hasReplies = replies.length > 0;
    const isExpanded = expandedThreads.has(comment.id);
    const isLiked = likedComments.has(comment.id);

    return (
      <div key={comment.id}>
        <div
          className={`bg-white rounded-xl p-4 card-elevated ${
            isReply ? "ml-6 sm:ml-10 border-l-2 border-emerald-200" : ""
          }`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`${
                isReply ? "h-6 w-6 text-[9px]" : "h-7 w-7 text-[10px]"
              } rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center text-white font-bold overflow-hidden flex-shrink-0`}
            >
              {comment.profiles?.avatar_url ? (
                <img
                  src={comment.profiles.avatar_url}
                  alt="Avatar utente"
                  className="h-full w-full object-cover"
                />
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
          <p className="text-sm text-gray-600 leading-relaxed">{comment.body}</p>

          {/* Comment actions */}
          <div className="flex items-center gap-3 mt-3 pt-2 border-t border-gray-50">
            {/* Like button */}
            <button
              onClick={() => handleCommentLike(comment)}
              disabled={!user}
              className={`flex items-center gap-1 text-[11px] font-bold transition-colors ${
                isLiked ? "text-red-500" : "text-gray-400 hover:text-red-400"
              } ${!user ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <svg
                className="w-3.5 h-3.5"
                viewBox="0 0 24 24"
                fill={isLiked ? "currentColor" : "none"}
                stroke="currentColor"
                strokeWidth={2}
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {comment.likes_count > 0 && comment.likes_count}
            </button>

            {/* Reply button (only on top-level comments) */}
            {!isReply && user && (
              <button
                onClick={() => {
                  setReplyingTo(replyingTo === comment.id ? null : comment.id);
                  setReplyText("");
                }}
                className={`flex items-center gap-1 text-[11px] font-bold transition-colors ${
                  replyingTo === comment.id
                    ? "text-emerald-600"
                    : "text-gray-400 hover:text-emerald-500"
                }`}
              >
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M3 10l7-7v4c8 0 12 4 12 11-2-5-6-7-12-7v4l-7-7z" />
                </svg>
                Rispondi
              </button>
            )}

            {/* Thread toggle */}
            {!isReply && hasReplies && (
              <button
                onClick={() => toggleThread(comment.id)}
                className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                <svg
                  className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <polyline points="9,6 15,12 9,18" />
                </svg>
                {replies.length} {replies.length === 1 ? "risposta" : "risposte"}
              </button>
            )}

            {/* Delete button */}
            {user && user.id === comment.user_id && (
              <button
                onClick={() => handleDeleteComment(comment)}
                className="ml-auto text-[10px] text-gray-400 hover:text-red-500 transition-colors"
              >
                Elimina
              </button>
            )}
          </div>
        </div>

        {/* Reply input form */}
        {!isReply && replyingTo === comment.id && user && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="ml-6 sm:ml-10 mt-1"
          >
            <div className="bg-emerald-50/50 rounded-xl p-3 border border-emerald-100">
              <div className="flex items-center gap-1.5 mb-2">
                <svg
                  className="w-3 h-3 text-emerald-500"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M3 10l7-7v4c8 0 12 4 12 11-2-5-6-7-12-7v4l-7-7z" />
                </svg>
                <span className="text-[10px] font-bold text-emerald-600">
                  Rispondi a {comment.profiles?.display_name || "Anonimo"}
                </span>
              </div>
              <textarea
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder="Scrivi la tua risposta..."
                rows={2}
                autoFocus
                className="w-full text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none bg-white rounded-lg p-2.5 border border-gray-100"
              />
              <div className="flex justify-end gap-2 mt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setReplyingTo(null);
                    setReplyText("");
                  }}
                  className="h-7 px-3 rounded-lg text-xs font-bold text-gray-500"
                >
                  Annulla
                </Button>
                <Button
                  onClick={() => handleReply(comment.id)}
                  disabled={!replyText.trim() || submitting}
                  className="h-7 px-3 rounded-lg bg-gradient-to-r from-emerald-500 to-emerald-700 font-bold text-xs disabled:opacity-40"
                >
                  {submitting ? "Invio..." : "Rispondi"}
                </Button>
              </div>
            </div>
          </motion.div>
        )}

        {/* Nested replies */}
        {!isReply && hasReplies && isExpanded && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-1 mt-1"
            >
              {replies.map((reply) => renderComment(reply, true))}
            </motion.div>
          </AnimatePresence>
        )}
      </div>
    );
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
                <img src={post.profiles.avatar_url} alt="Avatar utente" className="h-full w-full object-cover" />
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
              <span className="ml-auto text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">
                PINNED
              </span>
            )}
          </div>

          {/* Category badge */}
          <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg mb-3 uppercase">
            {post.category}
          </span>

          {/* Title + Body */}
          <h1 className="text-lg font-bold text-gray-900 mb-3">{post.title}</h1>
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

        {/* Comments Section */}
        <div className="mt-6">
          <h2 className="text-sm font-bold text-gray-900 mb-3">
            Commenti ({comments.length})
          </h2>

          {comments.length === 0 ? (
            <div className="text-center py-8">
              <span className="text-3xl block mb-2">💬</span>
              <p className="text-sm text-gray-400">Nessun commento ancora. Sii il primo!</p>
            </div>
          ) : (
            <div className="space-y-2">
              {topLevelComments.map((comment, i) => (
                <motion.div
                  key={comment.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  {renderComment(comment)}
                </motion.div>
              ))}
            </div>
          )}

          {/* New Comment Input */}
          {user ? (
            <div className="mt-4 bg-white rounded-2xl p-4 card-elevated">
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Scrivi un commento..."
                rows={3}
                className="w-full text-sm text-gray-900 placeholder:text-gray-400 resize-none focus:outline-none"
              />
              <div className="flex items-center justify-between mt-2">
                <span className="text-[10px] text-gray-400">+5 XP per ogni commento</span>
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
