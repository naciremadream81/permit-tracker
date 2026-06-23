import JSZip from "jszip";
import { getFile } from "./files";
import { countyById } from "./counties";
import { PERMIT_TYPE_LABELS, STATUS_LABELS, type PermitPackage } from "./types";

/** Strip characters that break file systems / zip tools. */
function safeName(name: string): string {
  return name.replace(/[\\/:*?"<>|]/g, "-").replace(/\s+/g, " ").trim();
}

function manifest(pkg: PermitPackage): string {
  const county = countyById(pkg.countyId);
  const lines: string[] = [
    `PERMIT PACKAGE SUBMITTAL — ${pkg.reference}`,
    "=".repeat(48),
    "",
    `Client:          ${pkg.client}`,
    `Project address: ${pkg.projectAddress}`,
    `County:          ${county ? `${county.name} County, FL` : pkg.countyId}`,
    `Permit type:     ${PERMIT_TYPE_LABELS[pkg.permitType]}`,
    `Status:          ${STATUS_LABELS[pkg.status]}`,
    `Exported:        ${new Date().toLocaleString("en-US")}`,
  ];

  if (pkg.property) {
    const p = pkg.property;
    lines.push("", "PROPERTY (per FL DOR statewide cadastral roll)");
    lines.push(`  Parcel ID:    ${p.parcelId}`);
    if (p.owner) lines.push(`  Owner:        ${p.owner}`);
    lines.push(`  Site address: ${p.siteAddress}${p.city ? `, ${p.city}` : ""}${p.zip ? ` ${p.zip}` : ""}`);
    lines.push(`  Use:          ${p.useLabel}`);
    if (p.yearBuilt) lines.push(`  Year built:   ${p.yearBuilt}`);
    if (p.justValue) lines.push(`  Just value:   $${p.justValue.toLocaleString("en-US")}`);
    if (p.legal) lines.push(`  Legal:        ${p.legal}`);
  }

  if (pkg.contractor) {
    lines.push("", "MAIN CONTRACTOR");
    lines.push(`  ${pkg.contractor.name}`);
    if (pkg.contractor.license) lines.push(`  License: ${pkg.contractor.license}`);
    if (pkg.contractor.phone) lines.push(`  Phone:   ${pkg.contractor.phone}`);
  }

  if (pkg.subcontractors.length > 0) {
    lines.push("", "SUBCONTRACTORS");
    for (const sub of pkg.subcontractors) {
      lines.push(
        `  ${sub.trade}: ${sub.name}${sub.license ? ` — Lic. ${sub.license}` : ""}${sub.phone ? ` — ${sub.phone}` : ""}`
      );
    }
  }

  lines.push("", "DOCUMENT CHECKLIST");
  pkg.checklist.forEach((item, i) => {
    const n = String(i + 1).padStart(2, "0");
    lines.push(`  ${n}. [${item.done ? "x" : " "}] ${item.label}`);
    if (item.attachments.length === 0) {
      lines.push(`        (no documents attached)`);
    } else {
      for (const a of item.attachments) {
        lines.push(`        - ${a.fileName}`);
      }
    }
  });

  return lines.join("\n") + "\n";
}

export interface ExportResult {
  fileName: string;
  fileCount: number;
  missing: string[]; // checklist items with no attachments
}

/**
 * Bundle every attached document into a zip, one numbered folder per
 * checklist item, plus a manifest. Triggers a browser download.
 */
export async function exportSubmittalZip(pkg: PermitPackage): Promise<ExportResult> {
  const zip = new JSZip();
  zip.file("MANIFEST.txt", manifest(pkg));

  let fileCount = 0;
  const missing: string[] = [];

  for (let i = 0; i < pkg.checklist.length; i++) {
    const item = pkg.checklist[i];
    if (item.attachments.length === 0) {
      missing.push(item.label);
      continue;
    }
    const folder = `${String(i + 1).padStart(2, "0")} ${safeName(item.label)}`;
    const used = new Set<string>();
    for (const att of item.attachments) {
      const blob = await getFile(att.id);
      if (!blob) continue; // metadata without bytes — skip rather than fail the export
      // De-duplicate identical file names within a folder.
      let name = safeName(att.fileName) || "document";
      if (used.has(name)) {
        const dot = name.lastIndexOf(".");
        const stem = dot > 0 ? name.slice(0, dot) : name;
        const ext = dot > 0 ? name.slice(dot) : "";
        let n = 2;
        while (used.has(`${stem} (${n})${ext}`)) n++;
        name = `${stem} (${n})${ext}`;
      }
      used.add(name);
      zip.file(`${folder}/${name}`, blob);
      fileCount++;
    }
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const fileName = `${safeName(pkg.reference)} Submittal.zip`;
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);

  return { fileName, fileCount, missing };
}
