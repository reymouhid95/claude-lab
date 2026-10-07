"use client";

import { useEffect, useState } from "react";
import type { LevelId } from "./Header";
import { getStudentId } from "@/lib/student";

export type JournalEntry = {
  id: number;
  student_level: string;
  preset_id: string | null;
  source: "preset" | "text" | "image";
  production: string | null;
  frame_id: string | null;
  shot_timestamp: string;
  description: Record<string, unknown> | null;
};

const SOURCE_LABEL: Record<JournalEntry["source"], string> = {
  preset: "preset",
  text: "texte",
  image: "image",
};

function formatDate(iso: string) {
  const date = new Date(iso.replace(" ", "T"));
  if (Number.isNaN(date.getTime())) return iso.slice(0, 10);
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function summary(entry: JournalEntry) {
  const d = entry.description;
  if (d) {
    const bits = [d.shotSize, d.focalLengthMm ? `${d.focalLengthMm} mm` : null, d.mood].filter(
      Boolean,
    );
    if (bits.length > 0) return bits.join(" · ");
  }
  return entry.preset_id ? entry.preset_id.replace(/-/g, " ") : "plan enregistré";
}

export default function Journal({
  level,
  version,
  production,
}: {
  level: LevelId;
  version: number;
  production?: string;
}) {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");

  useEffect(() => {
    let cancelled = false;
    const studentId = getStudentId();
    const params = new URLSearchParams({ student_id: studentId, level });
    if (production) params.set("production", production);

    fetch(`/api/journal?${params}`)
      .then((r) => r.json() as Promise<{ entries?: unknown }>)
      .then((data) => {
        if (cancelled) return;
        setEntries(Array.isArray(data.entries) ? data.entries : []);
        setStatus("ready");
      })
      .catch(() => !cancelled && setStatus("error"));

    return () => {
      cancelled = true;
    };
  }, [level, version, production]);

  return (
    <div>
      <div className="flex justify-end pb-1">
        <span className="font-mono text-[0.7rem] text-mute">
          {status === "loading" ? "chargement" : `${entries.length} entrées`}
        </span>
      </div>

      {status === "error" && (
        <p className="pt-4 text-[0.85rem] leading-relaxed text-mute">
          Journal injoignable. Recharge la page dans un instant.
        </p>
      )}

      {status === "ready" && entries.length === 0 && (
        <p className="pt-4 text-[0.85rem] leading-relaxed text-mute">
          Aucun plan enregistré pour ce niveau. Insère un preset pour lancer ton journal.
        </p>
      )}

      <ol className="divide-y divide-white/10">
        {entries.map((e) => (
          <li key={e.id} className="py-3.5">
            <div className="flex items-baseline gap-3">
              <span className="font-mono text-[0.7rem] text-amber">
                {SOURCE_LABEL[e.source] ?? e.source}
              </span>
              <span className="font-mono text-[0.7rem] text-mute">
                {formatDate(e.shot_timestamp)}
              </span>
              {e.production && (
                <span className="ml-auto truncate font-mono text-[0.7rem] text-mute/80">
                  {e.production}
                </span>
              )}
            </div>
            <p className="mt-1 text-[0.88rem] leading-snug text-ivory">{summary(e)}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
