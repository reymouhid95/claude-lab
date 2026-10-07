import { env } from "cloudflare:workers";
import { describeShot, GeminiError } from "@/lib/gemini";

function apiKey(): string | undefined {
  const value = (env as unknown as Record<string, unknown>).GEMINI_API_KEY;
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

export async function POST(req: Request) {
  let body: { text?: unknown } | null = null;
  try {
    body = await req.json();
  } catch {
    // fallthrough to the validation below
  }

  const text = typeof body?.text === "string" ? body.text.trim() : "";
  if (!text) {
    return Response.json({ error: "Texte requis." }, { status: 400 });
  }
  if (text.length > 2000) {
    return Response.json({ error: "2000 caractères maximum." }, { status: 400 });
  }

  const key = apiKey();
  if (!key) {
    return Response.json(
      { error: "Service d'IA non configuré sur le serveur.", success: false },
      { status: 500 },
    );
  }

  try {
    const description = await describeShot(key, `Analyze this shot description: ${text}`);
    return Response.json({ success: true, description });
  } catch (error) {
    const message = error instanceof GeminiError
      ? error.message
      : "Analyse indisponible pour le moment.";
    console.error("analyze-text failed:", error);
    return Response.json({ error: message, success: false }, { status: 502 });
  }
}
