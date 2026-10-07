import { env } from "cloudflare:workers";
import { ensureSchema } from "@/lib/memory";

const SOURCES = ["preset", "text", "image"];

export async function POST(req: Request) {
  let body: Record<string, unknown> | null = null;
  try {
    body = await req.json();
  } catch {
    // fallthrough to the validation below
  }
  if (!body) {
    return Response.json({ error: "JSON corporel manquant" }, { status: 400 });
  }

  const studentId = typeof body.student_id === "string" && body.student_id
    ? body.student_id
    : "demo-student";
  const studentLevel = typeof body.student_level === "string" ? body.student_level : "master1";
  const presetId = typeof body.preset_id === "string" ? body.preset_id : null;
  const description = body.description ?? {};
  const production = typeof body.production === "string" && body.production
    ? body.production
    : null;
  const frameId = typeof body.frame_id === "string" && body.frame_id ? body.frame_id : null;
  const rawSource = typeof body.source === "string" ? body.source : "preset";
  const source = SOURCES.includes(rawSource) ? rawSource : "preset";

  try {
    await ensureSchema(env.DB);
    const result = await env.DB.prepare(
      "INSERT INTO logged_shots (student_id, student_level, preset_id, description_json, source, production, frame_id) "
      + "VALUES (?, ?, ?, ?, ?, ?, ?)",
    )
      .bind(
        studentId,
        studentLevel,
        presetId,
        JSON.stringify(description),
        source,
        production,
        frameId,
      )
      .run();

    const rowId = (result as { meta?: { last_row_id?: number } }).meta?.last_row_id;
    return Response.json({
      success: true,
      message: "Shot loggé avec succès",
      shot_id: rowId ?? null,
    });
  } catch (error) {
    console.error("log-shot failed:", error);
    return Response.json({ error: String(error), success: false }, { status: 500 });
  }
}
