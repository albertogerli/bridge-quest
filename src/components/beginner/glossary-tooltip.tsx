"use client";

import { useState, useRef, useEffect, type ReactNode } from "react";
import { getGlossaryEntry } from "@/data/glossary";

interface GlossaryTooltipProps {
  /** Key in the GLOSSARY dictionary */
  term: string;
  /** The text displayed inline (usually the term itself) */
  children: ReactNode;
}

export function GlossaryTooltip({ term, children }: GlossaryTooltipProps) {
  const entry = getGlossaryEntry(term);
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLSpanElement>(null);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("touchstart", handler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("touchstart", handler);
    };
  }, [open]);

  // Auto-close after 4s on mobile
  useEffect(() => {
    if (!open) return;
    timeoutRef.current = setTimeout(() => setOpen(false), 4000);
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [open]);

  if (!entry) {
    return <>{children}</>;
  }

  return (
    <span ref={containerRef} className="relative inline-block">
      <span
        className="cursor-help border-b border-dashed border-[#c8a44e]/40 text-inherit"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((prev) => !prev);
        }}
      >
        {children}
        <span className="ml-0.5 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full bg-[#c8a44e]/15 text-[8px] font-bold text-[#8f6b16] align-text-top">
          ?
        </span>
      </span>

      {open && (
        <span
          className="absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-normal"
          role="tooltip"
        >
          <span className="block w-64 rounded-2xl border border-[#c8a44e]/30 bg-[#fffdf5] px-4 py-3 shadow-xl shadow-[#c8a44e]/10">
            <span className="flex items-center gap-2 mb-1.5">
              <span className="text-base">{entry.emoji}</span>
              <span className="text-sm font-bold text-[#12305f]">{entry.term}</span>
            </span>
            <span className="block text-xs leading-relaxed text-[#44536d]">
              {entry.definition}
            </span>
          </span>
          {/* Arrow */}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-[6px] border-transparent border-t-[#fffdf5]" />
        </span>
      )}
    </span>
  );
}
