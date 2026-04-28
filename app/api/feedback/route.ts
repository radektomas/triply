import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      liked?: unknown;
      missing?: unknown;
      email?: unknown;
    };

    const liked = String(body.liked ?? "").trim();
    const missing = String(body.missing ?? "").trim();
    const email = String(body.email ?? "").trim();

    if (!liked && !missing) {
      return NextResponse.json(
        { error: "At least one field required" },
        { status: 400 },
      );
    }

    const webhookUrl = process.env.N8N_FEEDBACK_URL;
    if (!webhookUrl) {
      console.error("[api/feedback] N8N_FEEDBACK_URL not configured");
      return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }

    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        liked: liked.slice(0, 1000),
        missing: missing.slice(0, 1000),
        email: email.slice(0, 200),
      }),
    });

    if (!res.ok) throw new Error(`Webhook returned ${res.status}`);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/feedback] error:", err);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
