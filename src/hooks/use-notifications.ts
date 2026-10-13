"use client";

import { useState, useCallback, useRef } from "react";

// Serve a `checkReminders`, che gira all'APERTURA della pagina: lì la soglia
// ha senso. Non serviva al promemoria programmato, che infatti non c'è più.
const TWENTY_HOURS_MS = 20 * 60 * 60 * 1000;
const LS_KEY_ENABLED = "bq_notifications";
const LS_KEY_LAST_ACTIVITY = "bq_last_activity";

type NotificationPermissionState = "default" | "granted" | "denied";

function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

function getStoredEnabled(): boolean {
  try {
    return localStorage.getItem(LS_KEY_ENABLED) === "on";
  } catch {
    return false;
  }
}

function setStoredEnabled(value: boolean) {
  try {
    localStorage.setItem(LS_KEY_ENABLED, value ? "on" : "off");
  } catch {}
}

export function updateLastActivity() {
  try {
    localStorage.setItem(LS_KEY_LAST_ACTIVITY, String(Date.now()));
  } catch {}
}

function getLastActivity(): number {
  try {
    return parseInt(localStorage.getItem(LS_KEY_LAST_ACTIVITY) || "0", 10);
  } catch {
    return 0;
  }
}

/**
 * Il clic sulla notifica lo gestisce il service worker dell'app (`src/app/sw.ts`).
 *
 * PRIMA questo file registrava un SECONDO worker, `/sw-notifications.js`, sullo
 * stesso ambito «/» del primo. Un ambito ha un worker solo: registrarne un altro
 * lo SOSTITUISCE. Ogni visita alla home rimpiazzava il worker dell'app con
 * quello delle notifiche, e il layout lo rimetteva alla pagina dopo — due
 * installazioni a pagina, la cache offline persa a ogni giro, e nelle verifiche
 * notturne del 13/10/2026 pagine che si ricaricavano da sole e navigazioni che
 * non partivano.
 *
 * Ora si usa la registrazione che c'è già. Se non c'è (in sviluppo il worker è
 * spento) si ripiega sulla notifica semplice, che funziona lo stesso.
 */
async function showNotification(title: string, body: string, icon?: string) {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;

  const opzioni = {
    body,
    icon: icon || "/icons/icon-192x192.png",
    badge: "/icons/icon-192x192.png",
    tag: "bridgelab-reminder",
  } as NotificationOptions;
  try {
    const registrazione = "serviceWorker" in navigator
      ? await navigator.serviceWorker.getRegistration()
      : undefined;
    if (registrazione) {
      await registrazione.showNotification(title, opzioni);
      return;
    }
  } catch {
    // Si ripiega sulla notifica semplice qui sotto.
  }
  try {
    new Notification(title, opzioni);
  } catch {
    // Notification failed silently
  }
}

export function useNotifications() {
  const [supported] = useState(() => isNotificationSupported());
  const [permission, setPermission] = useState<NotificationPermissionState>(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return "default";
    return Notification.permission as NotificationPermissionState;
  });
  const [enabled, setEnabled] = useState(() => {
    if (typeof window === "undefined" || !("Notification" in window)) return false;
    return getStoredEnabled() && Notification.permission === "granted";
  });
  const reminderChecked = useRef(false);

  // Request permission and enable notifications
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isNotificationSupported()) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermissionState);

      if (result === "granted") {
        setEnabled(true);
        setStoredEnabled(true);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Toggle notifications on/off
  const toggle = useCallback(async () => {
    if (enabled) {
      // Disable
      setEnabled(false);
      setStoredEnabled(false);
    } else {
      // Enable - request permission if needed
      if (permission === "granted") {
        setEnabled(true);
        setStoredEnabled(true);
      } else if (permission === "default") {
        await requestPermission();
      }
      // If denied, nothing we can do - browser blocks re-request
    }
  }, [enabled, permission, requestPermission]);

  // Schedule a lesson completion notification
  const notifyLessonComplete = useCallback(() => {
    if (!enabled) return;
    // Delay slightly so it feels natural, not instant
    setTimeout(() => {
      showNotification(
        "Bravo! Ottimo lavoro!",
        "Vuoi continuare con la prossima lezione? \ud83d\udcda"
      );
    }, 2000);
  }, [enabled]);

  // Check and trigger reminders on page load
  const checkReminders = useCallback(() => {
    if (!enabled || reminderChecked.current) return;
    reminderChecked.current = true;

    // Update activity timestamp on visit
    updateLastActivity();

    const now = Date.now();
    const lastActivity = getLastActivity();
    const isMonday = new Date().getDay() === 1;

    // Monday notification - check if not already shown today
    if (isMonday) {
      const mondayKey = `bq_notif_monday_${new Date().toISOString().slice(0, 10)}`;
      try {
        if (!localStorage.getItem(mondayKey)) {
          localStorage.setItem(mondayKey, "1");
          setTimeout(() => {
            showNotification(
              "Nuovo torneo settimanale!",
              "Nuovo torneo settimanale disponibile! \ud83c\udfc6"
            );
          }, 5000);
          return; // Don't stack notifications
        }
      } catch {}
    }

    // Streak reminder - if last activity was more than 20 hours ago
    if (lastActivity > 0 && now - lastActivity > TWENTY_HOURS_MS) {
      const streakKey = `bq_notif_streak_${new Date().toISOString().slice(0, 10)}`;
      try {
        if (!localStorage.getItem(streakKey)) {
          localStorage.setItem(streakKey, "1");
          setTimeout(() => {
            showNotification(
              "Non perdere la streak!",
              "Non perdere la streak! Gioca oggi \ud83c\udfaf"
            );
          }, 3000);
        }
      } catch {}
    }
  }, [enabled]);

  // RIMOSSO: `scheduleReminder`, un setTimeout di VENTI ORE.
  //
  // Sarebbe scattato solo se la scheda fosse rimasta aperta venti ore di
  // fila. Il commento originale lo sapeva — «only fire if the tab remains
  // open (edge case but useful for PWA)» — ma non è un caso limite: è il caso
  // normale. Nessuno tiene una scheda aperta da un giorno all'altro, e una
  // PWA chiusa non esegue timer. Quel promemoria non è mai partito.
  //
  // Quello che manca per farlo davvero è il push del web: chiavi VAPID, una
  // tabella di sottoscrizioni, un service worker che riceve, e un lavoro
  // periodico che spedisce. Non è una riga da aggiungere qui, è un pezzo a
  // sé, e finché non c'è i promemoria a app chiusa restano quelli via email
  // (cron giornaliero su /api/cron/engagement).

  // Notify when someone sends a challenge
  const notifyChallenge = useCallback((challengerName: string) => {
    if (!enabled) return;
    setTimeout(() => {
      showNotification(
        "Nuova sfida!",
        `${challengerName} ti ha sfidato a bridge! Accetta la sfida.`,
      );
    }, 1000);
  }, [enabled]);

  // Notify when challenge results are ready
  const notifyChallengeResult = useCallback((opponentName: string) => {
    if (!enabled) return;
    setTimeout(() => {
      showNotification(
        "Risultati disponibili!",
        `I risultati della sfida con ${opponentName} sono pronti!`,
      );
    }, 1000);
  }, [enabled]);

  // Notify when someone sends a friend request
  const notifyFriendRequest = useCallback((senderName: string) => {
    if (!enabled) return;
    setTimeout(() => {
      showNotification(
        "Richiesta di amicizia",
        `${senderName} vuole aggiungerti come amico!`,
      );
    }, 1000);
  }, [enabled]);

  return {
    supported,
    permission,
    enabled,
    toggle,
    requestPermission,
    checkReminders,
    notifyLessonComplete,
    notifyChallenge,
    notifyChallengeResult,
    notifyFriendRequest,
  };
}
