/**
 * Gemini REST client for the worker (ported from the Flask `litellm` calls).
 *
 * One model everywhere: `gemini-flash-lite-latest`, the stable alias used by
 * PromptLens — its separate free-tier budget suits a student audience.
 */
import type { ShotDescription } from "./shots";

const MODEL = "gemini-flash-lite-latest";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

export type Part = {
  text?: string;
  /** Inline base64 payload used by the vision analysis (Gemini REST shape). */
  inlineData?: { mimeType: string; data: string };
  functionCall?: { name: string; args?: Record<string, unknown> };
  functionResponse?: { name: string; response: unknown };
  /** Gemini 3 requires thought signatures to round-trip with tool calls. */
  thought?: boolean;
  thoughtSignature?: string;
};

export type Content = { role: "user" | "model"; parts: Part[] };

export class GeminiError extends Error {}

async function generate(
  apiKey: string,
  body: Record<string, unknown>,
): Promise<Record<string, unknown>> {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": apiKey },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new GeminiError(`Gemini ${res.status}: ${detail.slice(0, 300)}`);
  }
  return (await res.json()) as Record<string, unknown>;
}

function candidateText(data: Record<string, unknown>): string {
  const candidates = data.candidates as { content?: { parts?: Part[] } }[] | undefined;
  const parts = candidates?.[0]?.content?.parts ?? [];
  return parts
    .map((p) => p.text ?? "")
    .join("")
    .trim();
}

const VAULT_TOOL = {
  name: "search_vault",
  description:
    "Cherche dans les notes personnelles (vault) : projets, activité ATA SUARL, "
    + "journal d'opérations, profil. À utiliser quand la question porte sur un projet, "
    + "une personne, une décision passée ou l'activité professionnelle. Retourne les "
    + "extraits pertinents, ou une liste des sujets disponibles si rien ne correspond.",
  parameters: {
    type: "object",
    properties: { query: { type: "string" } },
    required: ["query"],
  },
};

/**
 * Agent loop: generate with the vault tool attached, run `searchVault` when
 * the model calls it, feed the result back, repeat (bounded like any tool
 * loop — three rounds is what the assistant needs in practice).
 */
export async function runChat(opts: {
  apiKey: string;
  system: string;
  contents: Content[];
  searchVault: (query: string) => string;
}): Promise<string> {
  const contents = [...opts.contents];

  for (let round = 0; round < 3; round += 1) {
    const data = await generate(opts.apiKey, {
      systemInstruction: { parts: [{ text: opts.system }] },
      contents,
      tools: [{ functionDeclarations: [VAULT_TOOL] }],
    });

    const candidates = data.candidates as { content?: { parts?: Part[] } }[] | undefined;
    const modelParts = candidates?.[0]?.content?.parts ?? [];
    const call = modelParts.find((p) => p.functionCall);

    if (!call?.functionCall) {
      const text = candidateText(data);
      return text || "Je n'ai pas de réponse à te proposer sur ce sujet.";
    }

    const { name, args } = call.functionCall;
    const query = typeof args?.query === "string" ? args.query : "";
    const result = name === "search_vault"
      ? opts.searchVault(query)
      : `Outil inconnu : ${name}`;

    // Echo the model's parts verbatim: Gemini 3 rejects a functionCall round
    // trip without its thought_signature.
    contents.push({ role: "model", parts: modelParts });
    contents.push({
      role: "user",
      parts: [{ functionResponse: { name, response: { result } } }],
    });
  }

  throw new GeminiError("L'agent n'a pas terminé en trois tours d'outils.");
}

/** Prompt contract copied from PromptLens `functions/src/prompt.ts`. */
export const SHOT_SYSTEM_PROMPT = [
  "You are a cinematography reference analyst for AI video productions.",
  "From the user's shot description or reference image, produce a JSON object with:",
  "shotSize (e.g. gros plan, plan large), cameraAngle, focalLengthMm (a plausible",
  "lens in millimetres), lighting (setup and quality), palette (3 to 6 dominant",
  "hex colors as #RRGGBB), mood, generationPrompt (a self-contained English",
  "prompt that recreates the shot), confidence (0 to 1).",
  "Answer with JSON only, matching the requested schema exactly.",
].join(" ");

const HEX_COLOR = /^#[0-9a-fA-F]{6}$/;

/** Narrow Gemini's answer at the API boundary before trusting it. */
function looksLikeDescription(value: unknown): value is ShotDescription {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  const palette = v.palette;
  const confidence = v.confidence;
  return (
    typeof v.shotSize === "string"
    && typeof v.cameraAngle === "string"
    && typeof v.focalLengthMm === "number"
    && !Number.isNaN(v.focalLengthMm)
    && v.focalLengthMm > 0
    && typeof v.lighting === "string"
    && Array.isArray(palette)
    && palette.length >= 1
    && palette.length <= 8
    && palette.every((c) => typeof c === "string" && HEX_COLOR.test(c))
    && typeof v.mood === "string"
    && typeof v.generationPrompt === "string"
    && v.generationPrompt.length >= 10
    && typeof confidence === "number"
    && confidence >= 0
    && confidence <= 1
  );
}

export async function describeShot(
  apiKey: string,
  userContent: string | Part[],
): Promise<ShotDescription> {
  const parts: Part[] = typeof userContent === "string" ? [{ text: userContent }] : userContent;
  const data = await generate(apiKey, {
    systemInstruction: { parts: [{ text: SHOT_SYSTEM_PROMPT }] },
    contents: [{ role: "user", parts }],
    generationConfig: { responseMimeType: "application/json", temperature: 0.3 },
  });

  const text = candidateText(data);
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new GeminiError("Le modèle n'a pas renvoyé de JSON.");
  }
  if (!looksLikeDescription(parsed)) {
    throw new GeminiError("La fiche renvoyée est incomplète. Reformule ou réessaie.");
  }
  return parsed;
}
