"use client";

import { useEffect, useRef, useState } from "react";

function formatTimecode(totalFrames: number) {
  const fps = 25;
  const frames = totalFrames % fps;
  const totalSeconds = Math.floor(totalFrames / fps);
  const s = totalSeconds % 60;
  const m = Math.floor(totalSeconds / 60) % 60;
  const h = Math.floor(totalSeconds / 3600);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(frames)}`;
}

/**
 * Timecode de régie : avance uniquement pendant qu'une requête tourne
 * (REC actif). Au repos il reste figé — un compteur qui défile sans
 * raison est du bruit, pas de l'information.
 */
export default function Timecode({ active }: { active: boolean }) {
  const [frames, setFrames] = useState(0);
  const lastRef = useRef(0);

  useEffect(() => {
    if (!active) return;
    lastRef.current = Date.now();
    const id = window.setInterval(() => {
      const now = Date.now();
      const delta = now - lastRef.current;
      lastRef.current = now;
      setFrames((f) => f + Math.round((delta / 1000) * 25));
    }, 80);
    return () => window.clearInterval(id);
  }, [active]);

  return (
    <span
      className={`font-mono text-[0.78rem] tracking-tight tabular-nums ${
        active ? "text-ivory/70" : "text-ivory/35"
      }`}
    >
      {formatTimecode(frames)}
    </span>
  );
}
