import { env } from "cloudflare:workers";
import { runChat } from "@/lib/gemini";
import { instructionsForLevel } from "@/lib/levels";
import { loadHistory, saveExchange, sessionKey } from "@/lib/memory";
import { searchVault } from "@/lib/vault";

const LEVELS = ["master1", "master2", "licence", "alternance"];

export async function POST(req: Request) {
  let body: {
    message?: unknown;
    student_level?: unknown;
    student_id?: unknown;
  } | null = null;
  try {
    body = await req.json();
  } catch {
    // fallthrough to the validation below
  }

  const message = typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) {
    return Response.json({ error: "Champ 'message' requis" }, { status: 400 });
  }

  const rawLevel = typeof body?.student_level === "string" ? body.student_level : "master1";
  const level = LEVELS.includes(rawLevel) ? rawLevel : "master1";
  const studentId = typeof body?.student_id === "string" && body.student_id
    ? body.student_id
    : "demo-student";

  const apiKey = (env as unknown as Record<string, unknown>).GEMINI_API_KEY;
  if (typeof apiKey !== "string" || apiKey.length === 0) {
    return Response.json(
      { error: "Service d'IA non configuré sur le serveur.", success: false },
      { status: 500 },
    );
  }

  const sessionId = sessionKey(studentId, level);
  const history = await loadHistory(env.DB, sessionId);

  try {
    const response = await runChat({
      apiKey,
      system: instructionsForLevel(level),
      contents: [...history, { role: "user", parts: [{ text: message }] }],
      searchVault,
    });

    await saveExchange(env.DB, sessionId, message, response);

    return Response.json({
      response,
      session_id: sessionId,
      student_level: level,
      success: true,
    });
  } catch (error) {
    console.error("chat failed:", error);
    return Response.json(
      { error: "Réponse indisponible pour le moment. Réessaie dans un instant.", success: false },
      { status: 502 },
    );
  }
}
