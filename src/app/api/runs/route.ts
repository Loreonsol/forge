import { NextResponse } from "next/server";
import { createAndRunPipeline } from "@/lib/pipeline";
import { listRuns } from "@/lib/store";
import type { CreateRunRequest, Platform, Tone } from "@/lib/types";

export const runtime = "nodejs";

const PLATFORMS: Platform[] = ["web", "mobile", "api"];
const TONES: Tone[] = ["professional", "playful", "bold", "minimal", "friendly"];

export async function GET() {
  const runs = await listRuns(30);
  return NextResponse.json({
    runs: runs.map((r) => ({
      id: r.id,
      createdAt: r.createdAt,
      stage: r.stage,
      idea: r.input.idea,
      name: r.brief?.selectedName,
    })),
  });
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as CreateRunRequest;
    const idea = typeof body.idea === "string" ? body.idea.trim() : "";
    if (idea.length < 3) {
      return NextResponse.json(
        { error: "Idea must be at least 3 characters." },
        { status: 400 }
      );
    }

    const platform =
      body.platform && PLATFORMS.includes(body.platform)
        ? body.platform
        : "web";
    const tone =
      body.tone && TONES.includes(body.tone) ? body.tone : "professional";

    const run = await createAndRunPipeline({
      idea,
      audience: body.audience,
      platform,
      tone,
    });

    return NextResponse.json({ id: run.id, stage: run.stage }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to create run";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
