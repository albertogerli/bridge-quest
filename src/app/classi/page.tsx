"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { useEnrolledClasses } from "@/store/use-classes-store";
import { joinClass } from "@/lib/instructors";
import { useT } from "@/contexts/traduzioni-provider";

export default function ClassiPage() {
  const t = useT();
  const { classes, isLoading, isLoaded, error, refresh } = useEnrolledClasses();

  const [code, setCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joinedName, setJoinedName] = useState<string | null>(null);

  async function handleJoin() {
    const trimmed = code.trim();
    if (trimmed.length < 6) return;
    setJoining(true);
    setJoinError(null);
    setJoinedName(null);
    try {
      const c = await joinClass(trimmed);
      setJoinedName(c.name);
      setCode("");
      await refresh();
    } catch (err) {
      setJoinError(err instanceof Error ? err.message : "Impossibile iscriversi alla classe");
    } finally {
      setJoining(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
      <div className="mb-6">
        <div className="flex items-center gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#c8a44e]">
            {t("Le mie classi")}
          </p>
          <span className="rounded-full bg-[#c8a44e]/15 px-2 py-0.5 text-[12px] font-bold uppercase tracking-wider text-[#9a7b2e] dark:text-[#c8a44e]">
            {t("Beta")}
          </span>
        </div>
        <h1 className="font-display text-3xl font-bold text-foreground sm:text-4xl">
          {t("Corsi e compiti")}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("Iscriviti con il codice del tuo istruttore e gioca le smazzate assegnate.")}
        </p>
      </div>

      {/* Join box */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="text-lg">{t("Iscriviti a una classe")}</CardTitle>
          <CardDescription>{t("Inserisci il codice invito a 6 caratteri.")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleJoin()}
              maxLength={6}
              placeholder="A7B9XZ"
              className="w-full rounded-md border border-border bg-background px-3 py-2 text-center font-mono text-lg font-semibold uppercase tracking-[0.4em] outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50 sm:max-w-[200px]"
            />
            <Button onClick={handleJoin} disabled={joining || code.trim().length < 6}>
              {joining ? "Iscrizione…" : "Iscriviti"}
            </Button>
          </div>
          {joinError && <p className="mt-2 text-sm text-destructive">{joinError}</p>}
          {joinedName && (
            <p className="mt-2 text-sm text-primary">Iscritto a “{joinedName}” ✓</p>
          )}
        </CardContent>
      </Card>

      {/* Enrolled list */}
      {error && (
        <div className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {!isLoaded && isLoading && (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" />
        </div>
      )}

      {isLoaded && classes.length === 0 && (
        <p className="py-8 text-center text-sm text-muted-foreground">
          {t("Non sei ancora iscritto a nessuna classe.")}
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {classes.map((c, i) => (
          <motion.div
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Link href={`/classi/${c.id}`} className="block h-full">
              <Card className="h-full transition-shadow hover:shadow-lg">
                <CardHeader>
                  <CardTitle className="font-display text-xl">{c.name}</CardTitle>
                  {c.description && (
                    <CardDescription className="line-clamp-2">{c.description}</CardDescription>
                  )}
                </CardHeader>
              </Card>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
