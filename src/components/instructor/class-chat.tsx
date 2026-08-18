"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { useSharedAuth } from "@/contexts/auth-provider";
import {
  getClassMessages,
  sendClassMessage,
  subscribeClassMessages,
  resolveNames,
  type ClassMessage,
} from "@/lib/instructors";
import { useT } from "@/contexts/traduzioni-provider";

/** Live class chat for instructor + students. Used in both /istruttori/[id] and /classi/[id]. */
export function ClassChat({ classId }: { classId: string }) {
  const t = useT();
  const { user } = useSharedAuth();
  const myId = user?.id;

  const [messages, setMessages] = useState<ClassMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const seenIds = useRef<Set<string>>(new Set());

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  }, []);

  // Initial load + realtime subscription.
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      try {
        const msgs = await getClassMessages(classId);
        if (!active) return;
        msgs.forEach((m) => seenIds.current.add(m.id));
        setMessages(msgs);
        scrollToBottom();
      } catch (err) {
        if (active) setError(err instanceof Error ? err.message : "Errore nel caricamento della chat");
      } finally {
        if (active) setLoading(false);
      }
    })();

    const unsub = subscribeClassMessages(classId, async (row) => {
      if (seenIds.current.has(row.id)) return;
      seenIds.current.add(row.id);
      // Resolve the sender name (cache miss -> one lookup).
      let name: string | null = null;
      try {
        const names = await resolveNames([row.user_id]);
        name = names.get(row.user_id) ?? null;
      } catch {
        /* keep null */
      }
      setMessages((prev) => [...prev, { ...row, class_id: classId, display_name: name }]);
      scrollToBottom();
    });

    return () => {
      active = false;
      unsub();
    };
  }, [classId, scrollToBottom]);

  async function handleSend() {
    const body = input.trim();
    if (!body || sending) return;
    setSending(true);
    setError(null);
    try {
      await sendClassMessage(classId, body);
      setInput("");
      // Fallback if Realtime isn't enabled: refresh so the message appears.
      const msgs = await getClassMessages(classId);
      msgs.forEach((m) => seenIds.current.add(m.id));
      setMessages(msgs);
      scrollToBottom();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invio non riuscito");
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col rounded-xl border border-border bg-card">
      <div ref={scrollRef} className="h-80 space-y-2 overflow-y-auto p-4">
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <div className="h-6 w-6 animate-spin rounded-full border-[3px] border-border border-t-primary" />
          </div>
        ) : messages.length === 0 ? (
          <p className="flex h-full items-center justify-center text-center text-sm text-muted-foreground">
            {t("Nessun messaggio. Scrivi il primo!")}
          </p>
        ) : (
          messages.map((m) => {
            const mine = m.user_id === myId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-3 py-2 text-sm ${
                    mine
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {!mine && (
                    <p className="mb-0.5 text-[12px] font-semibold opacity-70">
                      {m.display_name ?? "Utente"}
                    </p>
                  )}
                  <p className="whitespace-pre-wrap break-words">{m.body}</p>
                  <p className={`mt-0.5 text-[12px] ${mine ? "text-primary-foreground/60" : "text-muted-foreground"}`}>
                    {new Date(m.created_at).toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
            );
          })
        )}
      </div>

      {error && <p className="px-4 pb-1 text-xs text-destructive">{error}</p>}

      <div className="flex gap-2 border-t border-border p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              void handleSend();
            }
          }}
          placeholder={t("Scrivi un messaggio…")}
          maxLength={2000}
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
        />
        <Button onClick={handleSend} disabled={sending || !input.trim()}>
          {t("Invia")}
        </Button>
      </div>
    </div>
  );
}
