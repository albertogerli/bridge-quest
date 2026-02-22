"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const LS_KEY_ENABLED = "bq_notifications";
const LS_KEY_LAST_ACTIVITY = "bq_last_activity";
const TWENTY_HOURS_MS = 20 * 60 * 60 * 1000;

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

function registerNotificationSW() {
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/sw-notifications.js").catch(() => {
      // Silent fail - notifications still work without SW, just no click handling
    });
  }
}

function showNotification(title: string, body: string, icon?: string) {
  if (!isNotificationSupported()) return;
  if (Notification.permission !== "granted") return;

  try {
    // Try using service worker registration for better PWA support
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.ready.then((registration) => {
        registration.showNotification(title, {
          body,
          icon: icon || "/icons/icon-192x192.png",
          badge: "/icons/icon-192x192.png",
          tag: "bridgequest-reminder",
        } as NotificationOptions);
      }).catch(() => {
        // Fallback to basic Notification API
        new Notification(title, {
          body,
          icon: icon || "/icons/icon-192x192.png",
          tag: "bridgequest-reminder",
        });
      });
    } else {
      new Notification(title, {
        body,
        icon: icon || "/icons/icon-192x192.png",
        tag: "bridgequest-reminder",
      });
    }
  } catch {
    // Notification failed silently
  }
}

export function useNotifications() {
  const [supported, setSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermissionState>("default");
  const [enabled, setEnabled] = useState(false);
  const reminderChecked = useRef(false);

  // Initialize state
  useEffect(() => {
    const sup = isNotificationSupported();
    setSupported(sup);
    if (sup) {
      setPermission(Notification.permission as NotificationPermissionState);
      setEnabled(getStoredEnabled() && Notification.permission === "granted");
      registerNotificationSW();
    }
  }, []);

  // Request permission and enable notifications
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isNotificationSupported()) return false;

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationPermissionState);

      if (result === "granted") {
        setEnabled(true);
        setStoredEnabled(true);
        registerNotificationSW();
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

  // Schedule a delayed reminder using setTimeout (for when user might leave)
  const scheduleReminder = useCallback(() => {
    if (!enabled) return;

    // Schedule a reminder for 20 hours from now
    // This will only fire if the tab remains open (edge case but useful for PWA)
    const timer = setTimeout(() => {
      showNotification(
        "Torna a giocare!",
        "Non perdere la streak! Gioca oggi \ud83c\udfaf"
      );
    }, TWENTY_HOURS_MS);

    return () => clearTimeout(timer);
  }, [enabled]);

  return {
    supported,
    permission,
    enabled,
    toggle,
    requestPermission,
    checkReminders,
    scheduleReminder,
    notifyLessonComplete,
  };
}
