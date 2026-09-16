import { NextResponse } from "next/server";
import { getRun } from "@/lib/store";

export const runtime = "nodejs";

type DeployManual = {
  mode: "manual";
  reason: string;
  instructions: string[];
  commands: string[];
  downloadUrl: string;
  vercelNewUrl: string;
  vercelImportHint: string;
};

type DeployVercel = {
  mode: "vercel";
  url?: string;
  inspectorUrl?: string;
  deploymentId?: string;
  readyState?: string;
  message: string;
};

type DeployError = {
  mode: "error";
  error: string;
  fallback: DeployManual;
};

function manualPayload(id: string, projectName: string, reason: string): DeployManual {
  return {
    mode: "manual",
    reason,
    instructions: [
      `Download the scaffold ZIP for ${projectName}.`,
      "Unzip it, then from that folder run the commands below.",
      "Or import the GitHub repo / local folder at vercel.com/new.",
      "Optional: set VERCEL_TOKEN (and optionally VERCEL_ORG_ID / VERCEL_PROJECT_ID) on the Forge host to enable one-click API deploy.",
    ],
    commands: [
      "npm install",
      "npx vercel",
      "# production:",
      "npx vercel --prod",
    ],
    downloadUrl: `/api/runs/${id}/scaffold`,
    vercelNewUrl: "https://vercel.com/new",
    vercelImportHint:
      "Use “Import” → upload the unzipped scaffold folder, or connect a Git repo that contains it.",
  };
}

/**
 * POST /api/runs/:id/deploy
 * - With VERCEL_TOKEN: zip scaffold files → create Vercel deployment via API
 * - Without: return manual instructions + npx vercel commands
 */
export async function POST(
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

  const projectName = run.scaffold.projectName || "forge-app";
  const token = (process.env.VERCEL_TOKEN || "").trim();
  const orgId = (process.env.VERCEL_ORG_ID || "").trim();
  const projectId = (process.env.VERCEL_PROJECT_ID || "").trim();

  if (!token) {
    return NextResponse.json(
      manualPayload(
        id,
        projectName,
        "VERCEL_TOKEN is not set on this Forge host — use manual deploy."
      )
    );
  }

  try {
    // Vercel Deployments API accepts file tree as { file, data } with utf-8 text
    const files = run.scaffold.files.map((f) => ({
      file: f.path,
      data: f.content,
    }));

    const body: Record<string, unknown> = {
      name: projectName.slice(0, 64),
      files,
      projectSettings: {
        framework: "nextjs",
      },
    };
    if (projectId) {
      body.project = projectId;
    }

    const qs = orgId ? `?teamId=${encodeURIComponent(orgId)}` : "";
    const res = await fetch(`https://api.vercel.com/v13/deployments${qs}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = (await res.json().catch(() => ({}))) as Record<
      string,
      unknown
    >;

    if (!res.ok) {
      const errMsg =
        (typeof data.error === "object" &&
          data.error &&
          "message" in data.error &&
          String((data.error as { message?: string }).message)) ||
        (typeof data.message === "string" && data.message) ||
        `Vercel API ${res.status}`;
      const fallback = manualPayload(
        id,
        projectName,
        `Vercel API deploy failed: ${errMsg}`
      );
      const payload: DeployError = {
        mode: "error",
        error: errMsg,
        fallback,
      };
      return NextResponse.json(payload, { status: 502 });
    }

    const url =
      (typeof data.url === "string" && `https://${data.url}`) ||
      (typeof data.alias === "string" && `https://${data.alias}`) ||
      undefined;
    const inspectorUrl =
      typeof data.inspectorUrl === "string" ? data.inspectorUrl : undefined;
    const deploymentId =
      typeof data.id === "string"
        ? data.id
        : typeof data.uid === "string"
          ? data.uid
          : undefined;
    const readyState =
      typeof data.readyState === "string" ? data.readyState : undefined;

    const payload: DeployVercel = {
      mode: "vercel",
      url,
      inspectorUrl,
      deploymentId,
      readyState,
      message: url
        ? `Deployment created — ${url}`
        : "Deployment created on Vercel. Check the dashboard for status.",
    };
    return NextResponse.json(payload);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Deploy failed";
    // Still return manual fallback
    const payload: DeployError = {
      mode: "error",
      error: msg,
      fallback: manualPayload(id, projectName, msg),
    };
    return NextResponse.json(payload, { status: 500 });
  }
}

/** GET returns deploy readiness + instructions without triggering a deploy. */
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

  const hasToken = Boolean((process.env.VERCEL_TOKEN || "").trim());
  return NextResponse.json({
    ready: true,
    hasVercelToken: hasToken,
    projectName: run.scaffold.projectName,
    guide: manualPayload(
      id,
      run.scaffold.projectName,
      hasToken
        ? "VERCEL_TOKEN is configured — POST to deploy via API, or use manual commands."
        : "No VERCEL_TOKEN — use manual deploy commands."
    ),
  });
}
