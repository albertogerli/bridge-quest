/**
 * Native bridge — detects if running inside Capacitor iOS/Android app
 * and provides native capabilities (haptics, status bar, etc.)
 *
 * Uses global Capacitor plugins (injected by native shell) instead of
 * npm imports so the web build doesn't need Capacitor dependencies.
 */

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

export function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return (window as any).Capacitor?.getPlatform?.() === "ios";
}

export type Platform = "ios" | "android" | "pwa" | "web";

/** Detect the platform the user is currently running on. */
export function getPlatform(): Platform {
  if (typeof window === "undefined") return "web";
  const cap = (window as any).Capacitor;
  if (cap?.isNativePlatform?.()) {
    const p = cap.getPlatform?.();
    if (p === "ios") return "ios";
    if (p === "android") return "android";
  }
  try {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    if (standalone) return "pwa";
  } catch {}
  return "web";
}

/** Light haptic feedback on tap */
export async function hapticTap() {
  if (!isNativeApp()) return;
  try {
    const Haptics = (window as any).Capacitor?.Plugins?.Haptics;
    await Haptics?.impact?.({ style: "Light" });
  } catch {}
}

/** Medium haptic on success */
export async function hapticSuccess() {
  if (!isNativeApp()) return;
  try {
    const Haptics = (window as any).Capacitor?.Plugins?.Haptics;
    await Haptics?.notification?.({ type: "SUCCESS" });
  } catch {}
}

/** Heavy haptic on error */
export async function hapticError() {
  if (!isNativeApp()) return;
  try {
    const Haptics = (window as any).Capacitor?.Plugins?.Haptics;
    await Haptics?.notification?.({ type: "ERROR" });
  } catch {}
}

/** Configure iOS status bar */
export async function configureStatusBar() {
  if (!isNativeApp()) return;
  try {
    const StatusBar = (window as any).Capacitor?.Plugins?.StatusBar;
    await StatusBar?.setStyle?.({ style: "Dark" });
  } catch {}
}
