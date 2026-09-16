import { NextResponse } from "next/server";
import { getEngineInfo } from "@/lib/engine";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Public engine status for UI badge — never returns the API key. */
export async function GET() {
  const info = getEngineInfo();
  return NextResponse.json({
    mode: info.mode,
    setting: info.setting,
    model: info.model ?? null,
    label: info.label,
    // baseUrl omitted from client payload to reduce fingerprinting; mode+model enough for badge
  });
}
