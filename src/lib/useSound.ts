"use client";

import { useCallback, useEffect, useState } from "react";
import { isMuted, playSound, subscribeMuted, toggleMuted } from "./audio";

/** Handlers to spread onto anything interactive. */
export function useSound() {
  const onPointerEnter = useCallback(() => playSound("hover"), []);
  const onPointerDown = useCallback(() => playSound("click"), []);
  return { onPointerEnter, onPointerDown };
}

export function useMuted() {
  const [muted, setMuted] = useState(false);
  useEffect(() => {
    setMuted(isMuted());
    return subscribeMuted(setMuted);
  }, []);
  return { muted, toggle: toggleMuted };
}

export { playSound };
