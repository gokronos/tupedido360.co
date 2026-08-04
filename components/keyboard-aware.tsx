"use client";

import { useEffect } from "react";

export function KeyboardAware() {
  useEffect(() => {
    const viewport = window.visualViewport;
    const root = document.documentElement;

    function updateKeyboardState() {
      const keyboardOpen = Boolean(
        viewport && window.innerHeight - viewport.height > 140,
      );
      root.classList.toggle("keyboard-open", keyboardOpen);
    }

    function revealField(event: FocusEvent) {
      const field = event.target;
      if (!(field instanceof HTMLInputElement) &&
          !(field instanceof HTMLTextAreaElement) &&
          !(field instanceof HTMLSelectElement)) return;
      window.setTimeout(() => {
        field.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 350);
    }

    viewport?.addEventListener("resize", updateKeyboardState);
    document.addEventListener("focusin", revealField);
    return () => {
      viewport?.removeEventListener("resize", updateKeyboardState);
      document.removeEventListener("focusin", revealField);
      root.classList.remove("keyboard-open");
    };
  }, []);

  return null;
}
