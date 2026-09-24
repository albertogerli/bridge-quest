"use client";

import { useEffect } from "react";
import type {} from "@serwist/next/typings";
import { registerServiceWorker } from "@/lib/register-service-worker";

export function ServiceWorkerRegistration() {
  useEffect(() => {
    // Serwist is absent in development and in unsupported browser contexts.
    if (!window.isSecureContext || !("serviceWorker" in navigator) || !window.serwist) return;
    void registerServiceWorker(window.serwist);
  }, []);
  return null;
}
