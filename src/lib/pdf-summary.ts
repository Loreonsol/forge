import { jsPDF } from "jspdf";
import type { ForgeRun } from "./types";

function slugifyName(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 48) || "product"
  );
}

function wrapLines(
  doc: jsPDF,
  text: string,
  maxWidth: number,
  fontSize: number
): string[] {
  doc.setFontSize(fontSize);
  return doc.splitTextToSize(text, maxWidth) as string[];
}

/**
 * Client-side Forge summary PDF (jspdf) — no secrets / external APIs.
 * Multi-page: cover + brief, plan, next steps.
 */
export function buildSummaryPdf(run: ForgeRun): { blob: Blob; filename: string } {
  const brief = run.brief;
  const plan = run.plan;
  const name = brief?.selectedName || "Forge product";
  const filename = `${slugifyName(name)}-forge-summary.pdf`;

  const doc = new jsPDF({ unit: "pt", format: "letter" });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentW = pageW - margin * 2;
  const ember: [number, number, number] = [249, 115, 22];
  const ink: [number, number, number] = [15, 15, 20];
  const mist: [number, number, number] = [100, 100, 110];
  const snow: [number, number, number] = [40, 40, 48];

  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageH - margin) {
      doc.addPage();
      y = margin;
      drawFooter();
    }
  };

  const drawFooter = () => {
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(...mist);
    doc.text(
      `Forge summary · ${name} · page ${pageCount}`,
      margin,
      pageH - 24
    );
    doc.setDrawColor(...ember);
    doc.setLineWidth(1.5);
    doc.line(margin, pageH - 36, pageW - margin, pageH - 36);
  };

  const heading = (label: string, size = 14) => {
    ensureSpace(36);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(size);
    doc.setTextColor(...ember);
    doc.text(label.toUpperCase(), margin, y);
    y += size + 10;
    doc.setTextColor(...ink);
  };

  const body = (text: string, size = 10, leading = 14) => {
    const lines = wrapLines(doc, text, contentW, size);
    ensureSpace(lines.length * leading + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(size);
    doc.setTextColor(...snow);
    for (const line of lines) {
      ensureSpace(leading);
      doc.text(line, margin, y);
      y += leading;
    }
    y += 6;
  };

  const bullet = (text: string) => {
    const lines = wrapLines(doc, text, contentW - 16, 10);
    ensureSpace(lines.length * 13 + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...ember);
    doc.text("•", margin, y);
    doc.setTextColor(...snow);
    for (let i = 0; i < lines.length; i++) {
      ensureSpace(13);
      doc.text(lines[i], margin + 14, y);
      y += 13;
    }
    y += 4;
  };

  // —— Cover / header ——
  doc.setFillColor(12, 13, 20);
  doc.rect(0, 0, pageW, 120, "F");
  doc.setDrawColor(...ember);
  doc.setLineWidth(3);
  doc.line(0, 120, pageW, 120);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.setTextColor(...ember);
  doc.text("FORGE", margin, 40);

  doc.setFontSize(22);
  doc.setTextColor(247, 247, 248);
  doc.text(name, margin, 68);

  const oneLiner = brief?.oneLiner || run.input.idea;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(196, 196, 204);
  const coverLines = wrapLines(doc, oneLiner, contentW, 11);
  let cy = 90;
  for (const line of coverLines.slice(0, 2)) {
    doc.text(line, margin, cy);
    cy += 14;
  }

  y = 148;
  drawFooter();

  body(`Original idea: ${run.input.idea}`, 9, 12);
  if (run.input.audience) body(`Audience hint: ${run.input.audience}`, 9, 12);
  body(
    `Platform: ${run.input.platform || "web"} · Tone: ${run.input.tone || "professional"} · Run ${run.id.slice(0, 8)}`,
    9,
    12
  );
  y += 8;

  // —— Brief ——
  heading("Product brief");
  if (brief) {
    body(`One-liner: ${brief.oneLiner}`);
    body(`Target user: ${brief.targetUser}`);
    body(`Problem: ${brief.problem}`);
    body(`Value prop: ${brief.valueProp}`);
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...mist);
    doc.text("Name options", margin, y);
    y += 16;
    for (const n of brief.nameOptions) {
      bullet(n === brief.selectedName ? `${n} (selected)` : n);
    }
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...mist);
    doc.text("Differentiators", margin, y);
    y += 16;
    for (const d of brief.differentiators) bullet(d);
  } else {
    body("Brief not ready yet.");
  }

  // —— Plan ——
  doc.addPage();
  y = margin;
  drawFooter();
  heading("Build plan");
  if (plan) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...mist);
    doc.text("v0 features", margin, y);
    y += 16;
    for (const f of plan.v0Features) bullet(f);

    y += 6;
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...mist);
    doc.text("Tech stack", margin, y);
    y += 16;
    bullet(`Frontend: ${plan.techStack.frontend.join(", ")}`);
    bullet(`Backend: ${plan.techStack.backend.join(", ")}`);
    bullet(`Infra: ${plan.techStack.infra.join(", ")}`);

    y += 6;
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...mist);
    doc.text("Milestones", margin, y);
    y += 16;
    for (const m of plan.milestones) {
      bullet(`${m.title} (${m.estimate}) — ${m.description}`);
    }

    y += 6;
    ensureSpace(20);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...mist);
    doc.text("Out of scope", margin, y);
    y += 16;
    for (const o of plan.outOfScope) bullet(o);
  } else {
    body("Plan not ready yet.");
  }

  // —— Next steps ——
  doc.addPage();
  y = margin;
  drawFooter();
  heading("Next steps");
  body(
    "Use this summary as the shared source of truth with co-founders, housemates, or early users. Then ship the smallest loop that proves the one-liner."
  );
  const steps = [
    "Download the scaffold ZIP from Forge and run `npm install && npm run dev`.",
    "Replace sample dashboard data with your core entity (meals, chores, plans, jobs).",
    "Ship the first happy-path outcome in under a week — polish empty states after.",
    "Share the landing preview; collect waitlist emails before expanding scope.",
    "Revisit milestones only after you see real activation or drop-off.",
  ];
  for (const s of steps) bullet(s);

  y += 12;
  ensureSpace(40);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(9);
  doc.setTextColor(...mist);
  body(
    `Generated by Forge · ${new Date(run.createdAt).toLocaleString()} · zero API keys required.`,
    9,
    12
  );

  const blob = doc.output("blob");
  return { blob, filename };
}

export function downloadSummaryPdf(run: ForgeRun): void {
  const { blob, filename } = buildSummaryPdf(run);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
