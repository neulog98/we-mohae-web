"use client";

export function trackEvent(name: string, properties: Record<string, string | number | boolean | null> = {}) {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new CustomEvent("weMohae:analytics", { detail: { name, properties, at: new Date().toISOString() } }));
  if (process.env.NODE_ENV !== "production") {
    console.info("[analytics]", name, properties);
  }
}

export function captureClientError(error: unknown, context: Record<string, string> = {}) {
  if (typeof window === "undefined") return;
  const message = error instanceof Error ? error.message : String(error);
  window.dispatchEvent(new CustomEvent("weMohae:error", { detail: { message, context, at: new Date().toISOString() } }));
  if (process.env.NODE_ENV !== "production") {
    console.error("[client-error]", message, context);
  }
}
