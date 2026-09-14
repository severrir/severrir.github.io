"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useMuted } from "@/lib/useSound";

export function SoundToggle({ className = "" }: { className?: string }) {
  const { muted, toggle } = useMuted();

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={muted}
      aria-label={muted ? "Turn interface sound on" : "Turn interface sound off"}
      title={muted ? "Sound off" : "Sound on"}
      className={`grid size-9 place-items-center rounded-md text-text-2 transition-colors duration-200 hover:text-text ${className}`}
    >
      {muted ? (
        <VolumeX className="size-4" strokeWidth={1.5} aria-hidden="true" />
      ) : (
        <Volume2 className="size-4" strokeWidth={1.5} aria-hidden="true" />
      )}
    </button>
  );
}
