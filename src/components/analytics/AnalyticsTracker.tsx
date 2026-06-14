"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { captureClientError, trackEvent } from "@/lib/analytics/client";

export function AnalyticsTracker() {
  const pathname = usePathname();

  useEffect(() => {
    trackEvent("page_view", { pathname });
  }, [pathname]);

  useEffect(() => {
    function handleError(event: ErrorEvent) {
      captureClientError(event.error ?? event.message, { source: "window.error" });
    }
    function handleUnhandledRejection(event: PromiseRejectionEvent) {
      captureClientError(event.reason, { source: "unhandledrejection" });
    }
    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);
    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
    };
  }, []);

  return null;
}
