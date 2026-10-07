"use client";

import { useState } from "react";
import type { ShotDescription } from "@/lib/shots";
import { getStudentId } from "@/lib/student";

export default function ShotCard({
  description,
  source,
  presetId,
  frameId,
  production,
  onLogged,
  onReset,
}: {
  description: ShotDescription;
  source: "text" | "image";
  presetId?: string;
  frameId?: string;
  production?: string;
  onLogged: () => void;
  onReset: () => void;
}) {
  const [state, setState] = useState<"idle" | "saving" | "saved" | "error">("idle");

  const save = () => {
    setState("saving");
    void fetch("/api/log-shot", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        student_id: getStudentId(),
        preset_id: presetId ?? null,
        source,
        frame_id: frameId ?? null,
        production: production || null,
        description,
      }),
    })
      .then((r) => {
        if (!r.ok) throw new Error("save failed");
        setState("saved");
        onLogged();
      })
      .catch(() => setState("error"));
  };

  const rows: [string, string][] = [
    ["taille de plan", description.shotSize],
    ["angle", description.cameraAngle],
    ["focale", `${description.focalLengthMm} mm`],
    ["lumière", description.lighting],
    ["humeur", description.mood],
    ["confiance", `${Math.round(description.confidence * 100)} %`],
  ];

  return (
    <div className="border-l-2 border-amber/70 bg-bezel">
      <dl className="divide-y divide-white/8 px-4">
        {rows.map(([label, value]) => (
          <div key={label} className="flex gap-3 py-2">
            <dt className="w-24 shrink-0 font-mono text-[0.7rem] text-mute">{label}</dt>
            <dd className="min-w-0 text-[0.85rem] leading-snug text-ivory">{value}</dd>
          </div>
        ))}
      </dl>

      <div className="flex items-center gap-2 border-t border-white/8 px-4 py-2.5">
        <span className="font-mono text-[0.7rem] text-mute">palette</span>
        {description.palette.map((color) => (
          <span
            key={color}
            className="size-4 border border-white/20"
            style={{ backgroundColor: color }}
            title={color}
          />
        ))}
      </div>

      <p className="border-t border-white/8 px-4 py-3 font-mono text-[0.72rem] leading-relaxed text-ivory/80">
        {description.generationPrompt}
      </p>

      <div className="flex items-center gap-2 border-t border-white/8 px-4 py-3">
        <button
          type="button"
          onClick={save}
          disabled={state === "saving" || state === "saved"}
          className="bg-amber px-3 py-1.5 text-[0.8rem] font-semibold text-[#0e1418] transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          {state === "saved" ? "enregistré" : state === "saving" ? "…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="border border-white/15 px-3 py-1.5 text-[0.8rem] text-mute transition-colors hover:border-white/40 hover:text-ivory"
        >
          Recommencer
        </button>
        {state === "error" && (
          <span className="ml-auto font-mono text-[0.7rem] text-amber">
            échec de l&apos;enregistrement
          </span>
        )}
      </div>
    </div>
  );
}
