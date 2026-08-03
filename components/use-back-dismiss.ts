"use client";

import { useEffect, useRef } from "react";

const overlayHistoryKey = "__tupedido360Overlay";

export function useBackDismiss(active: boolean, onDismiss: () => void) {
  const onDismissRef = useRef(onDismiss);
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  useEffect(() => {
    if (!active) return;
    const marker = `${Date.now()}-${Math.random()}`;
    const currentState = window.history.state;
    const baseState = currentState && typeof currentState === "object" ? currentState : {};
    window.history.pushState({ ...baseState, [overlayHistoryKey]: marker }, "", window.location.href);
    const handleBack = () => onDismissRef.current();
    window.addEventListener("popstate", handleBack);
    return () => {
      window.removeEventListener("popstate", handleBack);
      if (window.history.state?.[overlayHistoryKey] === marker) window.history.back();
    };
  }, [active]);
}
