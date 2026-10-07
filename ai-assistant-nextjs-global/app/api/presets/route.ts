import { getPresetsForLevel } from "@/lib/presets";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const level = url.searchParams.get("level") ?? "master1";
  return Response.json({ presets: getPresetsForLevel(level) });
}
