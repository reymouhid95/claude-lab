import { NextResponse } from "next/server";

const FLASK_URL = process.env.FLASK_URL ?? "http://127.0.0.1:5001";

export async function GET(_req: Request, ctx: RouteContext<"/api/frames/[frameId]">) {
  const { frameId } = await ctx.params;

  try {
    const upstream = await fetch(`${FLASK_URL}/api/frames/${encodeURIComponent(frameId)}`, {
      cache: "no-store",
    });
    if (!upstream.ok) {
      return NextResponse.json({ error: "Frame introuvable." }, { status: upstream.status });
    }
    const blob = await upstream.blob();
    return new NextResponse(blob, {
      headers: {
        "Content-Type": upstream.headers.get("Content-Type") ?? "application/octet-stream",
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Frame injoignable." }, { status: 502 });
  }
}
