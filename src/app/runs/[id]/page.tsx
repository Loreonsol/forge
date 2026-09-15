import { getRun } from "@/lib/store";
import { RunClient } from "@/components/RunClient";

export const dynamic = "force-dynamic";

export default async function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // Store reloads from disk; still pass null through so the client can
  // recover via /api/runs/:id if SSR and the writer briefly disagree.
  const run = await getRun(id);

  return <RunClient initialRun={run} runId={id} />;
}
