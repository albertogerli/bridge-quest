"use client";

import { useEffect, useRef, type RefObject } from "react";

/**
 * Focus trap riusabile per i dialog "custom" (quelli non basati su Radix
 * `Dialog`, che il trap ce l'ha già). Rilievo perizie 2026-08: i modali fatti a
 * mano non intrappolavano il focus, non lo restituivano alla chiusura e non
 * rispondevano a Escape.
 *
 * Comportamento, quando `active` diventa true:
 *  1. memorizza l'elemento che aveva il focus e glielo restituisce alla chiusura;
 *  2. sposta il focus sul primo elemento focusabile del contenitore
 *     (o sul contenitore stesso, reso programmaticamente focusabile);
 *  3. cicla Tab / Shift+Tab restando dentro al contenitore;
 *  4. richiama `onEscape` alla pressione di Escape.
 *
 * Uso tipico:
 * ```tsx
 * const ref = useRef<HTMLDivElement>(null);
 * useFocusTrap(ref, open, { onEscape: close });
 * return open ? <div ref={ref} role="dialog" aria-modal="true" …/> : null;
 * ```
 */

const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button:not([disabled])",
  "input:not([disabled]):not([type='hidden'])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "iframe",
  "audio[controls]",
  "video[controls]",
  "summary",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]",
].join(",");

/** Elementi realmente raggiungibili da tastiera dentro `container`. */
function getFocusable(container: HTMLElement): HTMLElement[] {
  return Array.from(
    container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)
  ).filter(
    (el) =>
      !el.hasAttribute("disabled") &&
      el.getAttribute("aria-hidden") !== "true" &&
      el.tabIndex > -1 &&
      (el.offsetWidth > 0 || el.offsetHeight > 0 || el.getClientRects().length > 0)
  );
}

export interface FocusTrapOptions {
  /** Chiamata su Escape (di norma la funzione che chiude il dialog). */
  onEscape?: () => void;
  /** Se false il focus non viene spostato dentro il contenitore all'apertura. */
  autoFocus?: boolean;
}

export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  active: boolean,
  options: FocusTrapOptions = {}
): void {
  const { onEscape, autoFocus = true } = options;

  // Callback tenuta in un ref: così un `onEscape` inline non fa ripartire il
  // trap (e quindi non ruba di nuovo il focus) a ogni render del genitore.
  const onEscapeRef = useRef<(() => void) | undefined>(undefined);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  }, [onEscape]);

  useEffect(() => {
    if (!active) return;
    const container = containerRef.current;
    if (!container) return;

    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;

    let raf = 0;
    if (autoFocus) {
      // rAF: i dialog animati (motion) possono non essere ancora misurabili
      // nello stesso frame del commit, e getFocusable filtra per visibilità.
      raf = requestAnimationFrame(() => {
        const focusables = getFocusable(container);
        const target = focusables[0];
        if (target) {
          target.focus();
        } else {
          if (!container.hasAttribute("tabindex")) {
            container.setAttribute("tabindex", "-1");
          }
          container.focus();
        }
      });
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (onEscapeRef.current) {
          event.preventDefault();
          event.stopPropagation();
          onEscapeRef.current();
        }
        return;
      }
      if (event.key !== "Tab") return;

      const focusables = getFocusable(container);
      if (focusables.length === 0) {
        // Nessun elemento focusabile: il focus resta sul contenitore.
        event.preventDefault();
        return;
      }

      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      const inside = current !== null && container.contains(current);

      if (event.shiftKey) {
        if (!inside || current === first) {
          event.preventDefault();
          last.focus();
        }
      } else if (!inside || current === last) {
        event.preventDefault();
        first.focus();
      }
    };

    // capture: intercetta Escape/Tab prima degli handler dei figli.
    document.addEventListener("keydown", handleKeyDown, true);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      document.removeEventListener("keydown", handleKeyDown, true);
      if (previouslyFocused && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      }
    };
  }, [active, autoFocus, containerRef]);
}
