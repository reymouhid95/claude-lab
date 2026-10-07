"use client";

import { useEffect, useState } from "react";
import type { LevelId } from "./Header";

export type Preset = {
  id: string;
  name: string;
  shotSize: string;
  focalLength: string;
  lighting: string;
  cameraAngle: string;
  mood: string;
  generationPrompt: string;
};

type PresetState = {
  level: LevelId;
  status: "loading" | "ready" | "error";
  presets: Preset[];
};

const LOADING = (level: LevelId): PresetState => ({ level, status: "loading", presets: [] });

export default function Presets({
  level,
  onPick,
}: {
  level: LevelId;
  onPick: (prompt: string) => void;
}) {
  const [state, setState] = useState<PresetState>(() => LOADING(level));

  useEffect(() => {
    let cancelled = false;

    fetch(`/api/presets?level=${level}`)
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        setState({
          level,
          status: "ready",
          presets: Array.isArray(data.presets) ? data.presets : [],
        });
      })
      .catch(() => {
        if (cancelled) return;
        setState({ level, status: "error", presets: [] });
      });

    return () => {
      cancelled = true;
    };
  }, [level]);

  // Pendant le chargement d'un autre niveau, on garde l'état du niveau précédent.
  const view = state.level === level ? state : LOADING(level);

  return (
    <aside className="min-w-0">
      <div className="flex items-baseline justify-between border-b border-white/10 pb-2">
        <h2 className="font-display text-[0.95rem] font-bold tracking-tight text-ivory">
          Catalogue de plans
        </h2>
        <span className="font-mono text-[0.7rem] text-mute">
          {view.status === "loading" ? "chargement" : `${view.presets.length} presets`}
        </span>
      </div>

      {view.status === "error" && (
        <p className="pt-4 text-[0.85rem] leading-relaxed text-mute">
          Catalogue injoignable. Vérifie que le serveur d&apos;assistance tourne, puis recharge la
          page.
        </p>
      )}

      <ul className="divide-y divide-white/10">
        {view.presets.map((p) => (
          <li key={p.id} className="group py-3.5">
            <div className="flex items-baseline gap-3">
              <h3 className="font-display text-[0.95rem] font-semibold leading-tight text-ivory">
                {p.name}
              </h3>
              <button
                type="button"
                onClick={() => onPick(p.generationPrompt)}
                className="ml-auto shrink-0 border border-white/15 px-2.5 py-1 font-mono text-[0.7rem] text-mute transition-colors hover:border-amber hover:text-amber"
              >
                insérer
              </button>
            </div>
            <p className="mt-1.5 font-mono text-[0.7rem] leading-relaxed text-mute">
              {p.shotSize} · {p.focalLength}
              <br />
              {p.lighting}
              {p.cameraAngle ? ` · ${p.cameraAngle}` : ""}
            </p>
          </li>
        ))}
      </ul>
    </aside>
  );
}
