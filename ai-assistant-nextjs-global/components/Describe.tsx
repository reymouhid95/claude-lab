"use client";

import { useState } from "react";
import ShotCard from "./ShotCard";
import { isShotDescription, type ShotDescription } from "@/lib/shots";

const MAX_CHARS = 2000;

export default function Describe({
  onLogged,
  production,
}: {
  onLogged: () => void;
  production?: string;
}) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<ShotDescription | null>(null);

  const analyze = () => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    setLoading(true);
    setError(null);

    void fetch("/api/analyze-text", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    })
      .then((r) => r.json())
      .then((data) => {
        if (isShotDescription(data.description)) {
          setDraft(data.description);
        } else {
          setError(data.error ?? "Analyse incomplète. Reformule ta description.");
        }
      })
      .catch(() => setError("Connexion perdue avec le service d'analyse."))
      .finally(() => setLoading(false));
  };

  if (draft) {
    return (
      <ShotCard
        description={draft}
        source="text"
        production={production}
        onLogged={onLogged}
        onReset={() => setDraft(null)}
      />
    );
  }

  return (
    <div>
      <p className="text-[0.85rem] leading-relaxed text-mute">
        Décris ta prise en français : l&apos;analyse renvoie une fiche que tu peux corriger avant
        l&apos;enregistrement.
      </p>

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={6}
        maxLength={MAX_CHARS}
        placeholder="Gros plan d'une étudiante face caméra dans un couloir, lumière naturelle à gauche…"
        disabled={loading}
        className="mt-3 w-full resize-y border border-white/15 bg-bezel px-3 py-2.5 text-[0.88rem] leading-relaxed text-ivory placeholder:text-mute/80 focus:border-amber"
      />

      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={analyze}
          disabled={loading || text.trim().length === 0}
          className="bg-amber px-4 py-2 text-[0.82rem] font-semibold text-[#0e1418] transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-35"
        >
          {loading ? "Analyse…" : "Analyser"}
        </button>
        <span className="font-mono text-[0.7rem] text-mute">
          {text.length} / {MAX_CHARS}
        </span>
      </div>

      {error && (
        <p className="mt-3 border-l-2 border-amber pl-3 text-[0.82rem] leading-relaxed text-ivory/90">
          {error}
        </p>
      )}
    </div>
  );
}
