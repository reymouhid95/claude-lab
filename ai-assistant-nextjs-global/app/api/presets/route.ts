import { NextResponse } from "next/server";

const FLASK_URL = process.env.FLASK_URL ?? "http://127.0.0.1:5001";

export async function GET(req: Request) {
  const level = new URL(req.url).searchParams.get("level") ?? "master1";

  try {
    const upstream = await fetch(`${FLASK_URL}/api/presets?level=${encodeURIComponent(level)}`, {
      cache: "no-store",
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ count: 0, level, presets: [] }, { status: 200 });
  }
}
