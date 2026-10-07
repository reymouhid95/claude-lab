"use client";

import Timecode from "./Timecode";

export const LEVELS = [
  { id: "master1", label: "Master 1 — IA & Cybersécurité" },
  { id: "master2", label: "Master 2 — Cybersécurité" },
  { id: "licence", label: "Licence — Multimédia" },
  { id: "alternance", label: "Alternance — ATA SUARL" },
] as const;

export type LevelId = (typeof LEVELS)[number]["id"];

export default function Header({
  level,
  onLevelChange,
  production,
  onProductionChange,
  busy,
}: {
  level: LevelId;
  onLevelChange: (level: LevelId) => void;
  production: string;
  onProductionChange: (value: string) => void;
  /** True while the worker is actually processing a request. */
  busy: boolean;
}) {
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-bezel/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-6 gap-y-3 px-5 py-3">
        <div className="flex items-center gap-2.5">
          {/* REC is truthful: lit only while a request is running, dim at rest. */}
          <span
            className={`inline-block size-2.5 rounded-full bg-amber ${
              busy ? "rec-dot" : "opacity-25"
            }`}
            aria-hidden
          />
          <span
            className={`font-mono text-[0.7rem] font-medium tracking-[0.14em] ${
              busy ? "text-amber" : "text-amber/40"
            }`}
          >
            REC
          </span>
          <Timecode active={busy} />
        </div>

        <div className="mr-auto flex items-baseline gap-2">
          <span className="font-display text-[1.05rem] font-bold tracking-tight text-ivory">
            Assistant Production Vidéo
          </span>
          <span className="hidden font-mono text-[0.72rem] text-mute sm:inline">
            ATA SUARL × Swiss Umef
          </span>
        </div>

        <label className="flex items-center gap-2">
          <span className="font-mono text-[0.7rem] text-mute">production</span>
          <input
            type="text"
            value={production}
            onChange={(e) => onProductionChange(e.target.value)}
            placeholder="Ma production"
            aria-label="Production courante"
            className="w-32 border border-white/15 bg-bezel-2 px-2.5 py-2.5 text-[0.82rem] text-ivory placeholder:text-mute/80 transition-colors duration-150 hover:border-amber/60 focus:border-amber sm:w-40"
          />
        </label>

        <label className="flex items-center gap-2">
          <span className="font-mono text-[0.7rem] text-mute">niveau</span>
          <select
            value={level}
            onChange={(e) => onLevelChange(e.target.value as LevelId)}
            className="max-w-[13rem] cursor-pointer truncate border border-white/15 bg-bezel-2 px-2.5 py-2.5 text-[0.82rem] text-ivory transition-colors duration-150 hover:border-amber/60"
          >
            {LEVELS.map((l) => (
              <option key={l.id} value={l.id} className="bg-bezel text-ivory">
                {l.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </header>
  );
}
