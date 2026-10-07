import { env } from "cloudflare:workers";

const FRAME_ID = /^[0-9a-f]{32}\.[a-z0-9]+$/;

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ frameId: string }> },
) {
  const { frameId } = await ctx.params;

  if (!FRAME_ID.test(frameId)) {
    return Response.json({ error: "Identifiant invalide." }, { status: 400 });
  }

  try {
    const object = await env.FRAMES.get(`assistant/${frameId}`);
    if (!object) {
      return Response.json({ error: "Frame introuvable." }, { status: 404 });
    }
    return new Response(object.body, {
      headers: {
        "Content-Type": object.httpMetadata?.contentType ?? "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch (error) {
    console.error("frames read failed:", error);
    return Response.json({ error: "Frame injoignable." }, { status: 502 });
  }
}
