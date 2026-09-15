import { notFound } from "next/navigation";
import { getRun } from "@/lib/store";
import { RunClient } from "@/components/RunClient";

export const dynamic = "force-dynamic";

export default async function RunPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const run = await getRun(id);
  if (!run) notFound();

  return <RunClient initialRun={run} runId={id} />;
}
