"use client";

import { useCallback, useSyncExternalStore } from "react";
import { isMuted, playSound, subscribeMuted, toggleMuted } from "./audio";

/** Handlers to spread onto anything interactive. */
export function useSound() {
  const onPointerEnter = useCallback(() => playSound("hover"), []);
  const onPointerDown = useCallback(() => playSound("click"), []);
  return { onPointerEnter, onPointerDown };
}

export function useMuted() {
  /*
   * useSyncExternalStore rather than state synced in an effect: the previous
   * version always rendered "unmuted" first and corrected after hydration, so a
   * returning visitor who had muted the site watched the icon flip on every
   * page load. The server snapshot is false because there is no localStorage to
   * read at build time.
   */
  const muted = useSyncExternalStore(
    subscribeMuted,
    isMuted,
    () => false,
  );
  return { muted, toggle: toggleMuted };
}

export { playSound };
