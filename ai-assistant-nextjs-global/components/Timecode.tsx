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

/** Timecode de régie : le seul indicateur vivant de l'en-tête. */
export default function Timecode() {
  const [frames, setFrames] = useState(0);
  const startRef = useRef(0);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;

    startRef.current = Date.now();
    const id = window.setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      setFrames(Math.floor((elapsed / 1000) * 25));
    }, 80);
    return () => window.clearInterval(id);
  }, []);

  return (
    <span className="font-mono text-[0.78rem] tracking-tight tabular-nums text-ivory/70">
      {formatTimecode(frames)}
    </span>
  );
}
