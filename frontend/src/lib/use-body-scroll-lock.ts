"use client";

import { useEffect } from "react";

let lockCount = 0;
let lockedScrollY = 0;
let previousHtmlScrollBehavior: string | null = null;
let previousBodyStyles: {
  left: string;
  overflow: string;
  position: string;
  right: string;
  top: string;
  width: string;
} | null = null;

export function useBodyScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked || typeof window === "undefined") {
      return;
    }

    const body = document.body;
    const html = document.documentElement;

    if (lockCount === 0) {
      lockedScrollY = window.scrollY;
      previousHtmlScrollBehavior = html.style.scrollBehavior;
      previousBodyStyles = {
        left: body.style.left,
        overflow: body.style.overflow,
        position: body.style.position,
        right: body.style.right,
        top: body.style.top,
        width: body.style.width,
      };

      html.style.scrollBehavior = "auto";
      body.style.position = "fixed";
      body.style.top = `-${lockedScrollY}px`;
      body.style.left = "0";
      body.style.right = "0";
      body.style.width = "100%";
      body.style.overflow = "hidden";
    }

    lockCount += 1;

    return () => {
      lockCount = Math.max(0, lockCount - 1);

      if (lockCount > 0 || !previousBodyStyles) {
        return;
      }

      body.style.position = previousBodyStyles.position;
      body.style.top = previousBodyStyles.top;
      body.style.left = previousBodyStyles.left;
      body.style.right = previousBodyStyles.right;
      body.style.width = previousBodyStyles.width;
      body.style.overflow = previousBodyStyles.overflow;
      previousBodyStyles = null;

      window.scrollTo(0, lockedScrollY);
      html.style.scrollBehavior = previousHtmlScrollBehavior ?? "";
      previousHtmlScrollBehavior = null;
    };
  }, [locked]);
}
