"use client";

import { useEffect } from "react";

let lockCount = 0;
let previousOverflow = "";
let previousPosition = "";
let previousTop = "";
let previousWidth = "";
let lockedScrollY = 0;

export function useLockBodyScroll(active = true) {
  useEffect(() => {
    if (!active) return;
    if (typeof document === "undefined") return;

    if (lockCount === 0) {
      lockedScrollY = window.scrollY;
      previousOverflow = document.body.style.overflow;
      previousPosition = document.body.style.position;
      previousTop = document.body.style.top;
      previousWidth = document.body.style.width;
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.top = `-${lockedScrollY}px`;
      document.body.style.width = "100%";
    }
    lockCount += 1;

    return () => {
      lockCount = Math.max(lockCount - 1, 0);
      if (lockCount === 0) {
        document.body.style.overflow = previousOverflow;
        document.body.style.position = previousPosition;
        document.body.style.top = previousTop;
        document.body.style.width = previousWidth;
        window.scrollTo(0, lockedScrollY);
      }
    };
  }, [active]);
}
