"use client";

import { useState, useEffect, useCallback } from "react";

export interface Appunto {
  lessonId: number;
  moduleId: string;
  lessonTitle: string;
  moduleTitle: string;
  rules: string[];
  date: string;
}

const STORAGE_KEY = "bq_appunti";

export function useAppunti() {
  const [appunti, setAppunti] = useState<Appunto[]>([]);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) setAppunti(JSON.parse(stored));
    } catch {}
  }, []);

  const saveRules = useCallback((entry: Omit<Appunto, "date">) => {
    if (entry.rules.length === 0) return;
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as Appunto[];
      // Don't duplicate: check if this module's rules are already saved
      const key = `${entry.lessonId}-${entry.moduleId}`;
      const exists = stored.some((a) => `${a.lessonId}-${a.moduleId}` === key);
      if (exists) return;
      const updated = [...stored, { ...entry, date: new Date().toISOString().slice(0, 10) }];
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      setAppunti(updated);
    } catch {}
  }, []);

  const clearAll = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      setAppunti([]);
    } catch {}
  }, []);

  return { appunti, saveRules, clearAll };
}
