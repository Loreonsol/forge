import { NextResponse } from "next/server";
import { getRun } from "@/lib/store";
import { scaffoldToZipBuffer } from "@/lib/zip";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  ctx: { params: Promise<{ id: string }> }
) {
  const { id } = await ctx.params;
  const run = await getRun(id);
  if (!run) {
    return NextResponse.json({ error: "Run not found" }, { status: 404 });
  }
  if (!run.scaffold) {
    return NextResponse.json(
      { error: "Scaffold not ready yet" },
      { status: 409 }
    );
  }

  const buffer = await scaffoldToZipBuffer(run.scaffold);
  const filename = `${run.scaffold.projectName}.zip`;

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
