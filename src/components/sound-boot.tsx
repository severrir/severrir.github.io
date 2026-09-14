"use client";

import { useEffect } from "react";
import { initAudio } from "@/lib/audio";

export function SoundBoot() {
  useEffect(() => {
    initAudio();
  }, []);
  return null;
}
