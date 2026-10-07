import { env } from "cloudflare:workers";
import { ensureSchema } from "@/lib/memory";

type Row = {
  id: number;
  student_level: string;
  preset_id: string | null;
  description_json: string | null;
  source: string;
  production: string | null;
  frame_id: string | null;
  shot_timestamp: string;
};

export async function GET(req: Request) {
  const url = new URL(req.url);
  const studentId = url.searchParams.get("student_id") ?? "demo-student";
  const level = url.searchParams.get("level");
  const production = url.searchParams.get("production");

  let limit = 50;
  const rawLimit = Number.parseInt(url.searchParams.get("limit") ?? "50", 10);
  if (Number.isFinite(rawLimit)) limit = Math.min(Math.max(rawLimit, 1), 200);

  const where: string[] = ["student_id = ?"];
  const params: (string | number)[] = [studentId];
  if (level) {
    where.push("student_level = ?");
    params.push(level);
  }
  if (production) {
    where.push("production = ?");
    params.push(production);
  }
  params.push(limit);

  try {
    await ensureSchema(env.DB);
    const { results } = await env.DB.prepare(
      "SELECT id, student_level, preset_id, description_json, source, production, frame_id, shot_timestamp "
      + `FROM logged_shots WHERE ${where.join(" AND ")} ORDER BY id DESC LIMIT ?`,
    )
      .bind(...params)
      .all<Row>();

    const entries = results.map((row) => {
      let description: unknown = null;
      if (row.description_json) {
        try {
          description = JSON.parse(row.description_json);
        } catch {
          description = null;
        }
      }
      return {
        id: row.id,
        student_level: row.student_level,
        preset_id: row.preset_id,
        source: row.source,
        production: row.production,
        frame_id: row.frame_id,
        shot_timestamp: row.shot_timestamp,
        description,
      };
    });

    return Response.json({ count: entries.length, entries });
  } catch (error) {
    console.error("journal failed:", error);
    return Response.json({ error: String(error), entries: [] }, { status: 500 });
  }
}
