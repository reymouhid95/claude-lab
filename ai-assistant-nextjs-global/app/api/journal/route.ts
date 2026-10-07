import { NextResponse } from "next/server";

const FLASK_URL = process.env.FLASK_URL ?? "http://127.0.0.1:5001";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const params = new URLSearchParams();
  for (const key of ["student_id", "level", "limit", "production"]) {
    const value = url.searchParams.get(key);
    if (value) params.set(key, value);
  }

  try {
    const upstream = await fetch(`${FLASK_URL}/api/journal?${params}`, { cache: "no-store" });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json({ count: 0, entries: [] }, { status: 202 });
  }
}
