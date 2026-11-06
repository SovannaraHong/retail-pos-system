"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function useOverlayTransition(onClosed: () => void, duration = 300) {
  const [open, setOpen] = useState(false);
  const closing = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const onClosedRef = useRef(onClosed);

  useEffect(() => {
    onClosedRef.current = onClosed;
  });

  useEffect(() => {
    let inner = 0;
    // two frames: the closed state must be painted once, or there is no transition
    const outer = requestAnimationFrame(() => {
      inner = requestAnimationFrame(() => setOpen(true));
    });
    return () => {
      cancelAnimationFrame(outer);
      cancelAnimationFrame(inner);
      clearTimeout(timer.current);
    };
  }, []);

  const close = useCallback(() => {
    if (closing.current) return;
    closing.current = true;
    setOpen(false);
    timer.current = setTimeout(() => onClosedRef.current(), duration);
  }, [duration]);

  return { open, close };
}
