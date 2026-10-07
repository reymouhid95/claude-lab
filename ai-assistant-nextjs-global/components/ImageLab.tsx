"use client";

import { useEffect, useRef, useState } from "react";
import ShotCard from "./ShotCard";
import { isShotDescription, type ShotDescription } from "@/lib/shots";

const MAX_DIMENSION = 1600;
const OUTPUT_MIME = "image/jpeg";

type Picked = { base64: string; previewUrl: string; width: number; height: number };

/** Redimensionne côté client (max 1600 px) et convertit en JPEG : moins de poids à envoyer. */
function resize(file: File): Promise<Picked> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Lecture du fichier impossible."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("Fichier image illisible."));
      img.onload = () => {
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas indisponible."));
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL(OUTPUT_MIME, 0.9);
        resolve({
          base64: dataUrl.slice(dataUrl.indexOf(",") + 1),
          previewUrl: dataUrl,
          width,
          height,
        });
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export default function ImageLab({
  onLogged,
  production,
  onBusyChange,
}: {
  onLogged: () => void;
  production?: string;
  /** Reports analysis activity up to the header REC. */
  onBusyChange?: (busy: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [picked, setPicked] = useState<Picked | null>(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ description: ShotDescription; frameId: string } | null>(
    null,
  );

  // Unmounting mid-analysis (tab switch) must not leave REC stuck on.
  useEffect(() => () => onBusyChange?.(false), [onBusyChange]);

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    setDraft(null);
    try {
      setPicked(await resize(file));
      setFileName(file.name);
    } catch (e) {
      setPicked(null);
      setError(e instanceof Error ? e.message : "Fichier illisible.");
    }
  };

  const analyze = () => {
    if (!picked || loading) return;
    setLoading(true);
    setError(null);
    onBusyChange?.(true);

    void fetch("/api/analyze-image", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64: picked.base64, mimeType: OUTPUT_MIME }),
    })
      .then(
        (r) =>
          r.json() as Promise<{ description?: unknown; frameId?: unknown; error?: string }>,
      )
      .then((data) => {
        if (isShotDescription(data.description) && typeof data.frameId === "string") {
          setDraft({ description: data.description, frameId: data.frameId });
        } else {
          setError(data.error ?? "Analyse incomplète. Essaie une image plus lisible.");
        }
      })
      .catch(() => setError("Connexion perdue avec le service d'analyse."))
      .finally(() => {
        setLoading(false);
        onBusyChange?.(false);
      });
  };

  const reset = () => {
    setDraft(null);
    setPicked(null);
    setFileName("");
    if (inputRef.current) inputRef.current.value = "";
  };

  if (draft) {
    return (
      <div className="space-y-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/api/frames/${draft.frameId}`}
          alt="Frame analysée"
          className="w-full border border-white/10 object-cover"
        />
        <ShotCard
          description={draft.description}
          source="image"
          frameId={draft.frameId}
          production={production}
          onLogged={onLogged}
          onReset={reset}
        />
      </div>
    );
  }

  return (
    <div>
      <p className="text-[0.85rem] leading-relaxed text-mute">
        Charge une image de référence : l&apos;analyse en extrait la fiche de plan et garde la frame
        dans ton journal.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={(e) => void pick(e.target.files?.[0])}
        className="mt-3 block w-full text-[0.8rem] text-mute file:mr-3 file:border file:border-white/15 file:bg-transparent file:px-3 file:py-2.5 file:text-[0.8rem] file:text-ivory file:transition-colors file:duration-150 hover:file:border-amber"
      />

      {picked && (
        <div className="mt-3 flex items-start gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={picked.previewUrl}
            alt="Aperçu de l'image choisie"
            className="size-20 shrink-0 border border-white/10 object-cover"
          />
          <p className="font-mono text-[0.7rem] leading-relaxed text-mute">
            {fileName}
            <br />
            {picked.width} × {picked.height}
          </p>
        </div>
      )}

      <button
        type="button"
        onClick={analyze}
        disabled={!picked || loading}
        className="mt-3 flex min-h-11 items-center justify-center bg-amber px-4 text-[0.82rem] font-semibold text-[#0e1418] transition duration-150 hover:opacity-90 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-35"
      >
        {loading ? "Analyse…" : "Analyser l'image"}
      </button>

      {error && (
        <p className="mt-3 border-l-2 border-amber pl-3 text-[0.82rem] leading-relaxed text-ivory/90">
          {error}
        </p>
      )}
    </div>
  );
}
