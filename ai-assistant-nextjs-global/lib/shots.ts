/** Fiche de plan renvoyée par l'analyse (contrat repris de PromptLens). */
export type ShotDescription = {
  shotSize: string;
  cameraAngle: string;
  focalLengthMm: number;
  lighting: string;
  palette: string[];
  mood: string;
  generationPrompt: string;
  confidence: number;
};

export function isShotDescription(value: unknown): value is ShotDescription {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.shotSize === "string" &&
    typeof v.cameraAngle === "string" &&
    typeof v.focalLengthMm === "number" &&
    typeof v.lighting === "string" &&
    Array.isArray(v.palette) &&
    typeof v.mood === "string" &&
    typeof v.generationPrompt === "string" &&
    typeof v.confidence === "number"
  );
}
