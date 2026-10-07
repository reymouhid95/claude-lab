import { env } from "cloudflare:workers";
import { describeShot, GeminiError } from "@/lib/gemini";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const SUPPORTED = ["image/png", "image/jpeg", "image/webp", "image/heic", "image/heif"];

function apiKey(): string | undefined {
  const value = (env as unknown as Record<string, unknown>).GEMINI_API_KEY;
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function POST(req: Request) {
  let body: { imageBase64?: unknown; mimeType?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    // fallthrough to the validation below
  }

  const imageBase64 = typeof body?.imageBase64 === "string" ? body.imageBase64 : "";
  const mimeType = typeof body?.mimeType === "string" ? body.mimeType : "";
  if (!imageBase64) {
    return Response.json({ error: "Image requise." }, { status: 400 });
  }
  if (!SUPPORTED.includes(mimeType)) {
    return Response.json({ error: "Format non supporté." }, { status: 400 });
  }

  // atob is the b64decode(validate=True) equivalent: it throws on invalid
  // input instead of silently dropping characters (the Flask bug we fixed).
  let bytes: Uint8Array;
  try {
    const binary = atob(imageBase64);
    if (binary.length === 0) {
      return Response.json({ error: "Image vide." }, { status: 400 });
    }
    if (binary.length > MAX_IMAGE_BYTES) {
      return Response.json({ error: "Image trop volumineuse : 4 Mo maximum." }, { status: 413 });
    }
    bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
  } catch {
    return Response.json({ error: "Base64 invalide." }, { status: 400 });
  }

  const key = apiKey();
  if (!key) {
    return Response.json(
      { error: "Service d'IA non configuré sur le serveur.", success: false },
      { status: 500 },
    );
  }

  try {
    const description = await describeShot(key, [
      { text: "Analyze the shot shown in this reference image." },
      { inlineData: { mimeType, data: imageBase64 } },
    ]);

    const extension = mimeType.split("/")[1];
    const frameId = `${crypto.randomUUID().replaceAll("-", "")}.${extension}`;
    await env.FRAMES.put(`assistant/${frameId}`, bytes, {
      httpMetadata: { contentType: mimeType },
    });

    return Response.json({ success: true, description, frameId });
  } catch (error) {
    const message = error instanceof GeminiError
      ? error.message
      : "Analyse indisponible pour le moment.";
    console.error("analyze-image failed:", error);
    return Response.json({ error: message, success: false }, { status: 502 });
  }
}
