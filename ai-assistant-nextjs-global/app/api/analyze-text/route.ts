import { NextResponse } from "next/server";

const FLASK_URL = process.env.FLASK_URL ?? "http://127.0.0.1:5001";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Corps JSON invalide" }, { status: 400 });
  }

  try {
    const upstream = await fetch(`${FLASK_URL}/api/analyze-text`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      cache: "no-store",
    });
    const data = await upstream.json();
    return NextResponse.json(data, { status: upstream.status });
  } catch {
    return NextResponse.json(
      { error: "Le service d'analyse est injoignable. Réessaie dans un instant.", success: false },
      { status: 502 },
    );
  }
}
