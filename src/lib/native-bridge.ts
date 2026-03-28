/**
 * Native bridge — detects if running inside Capacitor iOS app
 * and provides native capabilities (haptics, status bar, etc.)
 */

export function isNativeApp(): boolean {
  if (typeof window === "undefined") return false;
  return !!(window as any).Capacitor?.isNativePlatform?.();
}

export function isIOS(): boolean {
  if (typeof window === "undefined") return false;
  return (window as any).Capacitor?.getPlatform?.() === "ios";
}

/** Light haptic feedback on tap */
export async function hapticTap() {
  if (!isNativeApp()) return;
  try {
    const { Haptics, ImpactStyle } = await import("@capacitor/haptics");
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch {}
}

/** Medium haptic on success */
export async function hapticSuccess() {
  if (!isNativeApp()) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Success });
  } catch {}
}

/** Heavy haptic on error */
export async function hapticError() {
  if (!isNativeApp()) return;
  try {
    const { Haptics, NotificationType } = await import("@capacitor/haptics");
    await Haptics.notification({ type: NotificationType.Error });
  } catch {}
}

/** Configure iOS status bar */
export async function configureStatusBar() {
  if (!isNativeApp()) return;
  try {
    const { StatusBar, Style } = await import("@capacitor/status-bar");
    await StatusBar.setStyle({ style: Style.Dark });
  } catch {}
}
