"use client";

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (cmd: string, event: string, params?: Params) => void;
  }
}

export function track(event: string, params?: Params) {
  if (typeof window === "undefined") return;
  try {
    window.gtag?.("event", event, params);
  } catch {
    // never let analytics break the UI
  }
}
