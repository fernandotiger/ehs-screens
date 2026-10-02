import type { Inspection, InspectionData } from "./inspection-model";
import type { RiskData } from "./risk-model";
import { departmentPath, today } from "./risk-model";
import type { ImportRecords } from "./bulk-import";
import type { ScheduledJob } from "./scheduled-jobs";

export type QrTarget = { kind: "risk" | "inspection"; id: string };
export const workspaceKey = "northstar";
export function qrUrl(base: string, target: QrTarget) {
  const url = new URL(base);
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw Error("Enter your workspace's HTTP or HTTPS website address.");
  url.search = ""; url.hash = "";
  url.searchParams.set("workspace", workspaceKey); url.searchParams.set("qr", `${target.kind}:${target.id}`);
  return url.href;
}
export function parseQr(value: string, currentUrl: string): QrTarget {
  const input = value.trim();
  if (/^(RA|INS)-[A-Z0-9-]+$/i.test(input)) return { kind: input.toUpperCase().startsWith("RA-") ? "risk" : "inspection", id: input.toUpperCase() };
  let url: URL; try { url = new URL(input, currentUrl); } catch { throw Error("Scan an OleoQ label or enter its RA / INS reference."); }
  const current = new URL(currentUrl);
  if (!["https:", "http:"].includes(url.protocol) || url.origin !== current.origin || url.pathname !== current.pathname || url.username || url.password || url.searchParams.getAll("qr").length !== 1 || url.searchParams.getAll("workspace").length !== 1 || url.searchParams.get("workspace") !== workspaceKey) throw Error("This is not a QR label for this workspace. Open it on the correct company website.");
  const match = /^(risk|inspection):((?:RA|INS)-[A-Z0-9-]+)$/i.exec(url.searchParams.get("qr") || "");
  if (!match || (match[1].toLowerCase() === "risk") !== match[2].toUpperCase().startsWith("RA-")) throw Error("The label's record reference is invalid.");
  return { kind: match[1].toLowerCase() as QrTarget["kind"], id: match[2].toUpperCase() };
}
// A repeated inspection carries its original label reference; no reprinting is needed.
export const inspectionLabelId = (i: Inspection) => i.qrOriginId || i.id;
export function resolveQrInspection(data: InspectionData, label: string) {
  const family = data.inspections.filter(i => inspectionLabelId(i) === label);
  const pending = family.filter(i => i.active && !i.completedAt).sort((a, b) => a.scheduled.localeCompare(b.scheduled));
  return pending[0] || family.filter(i => i.active).sort((a, b) => (b.completedAt || b.scheduled).localeCompare(a.completedAt || a.scheduled))[0] || family.find(i => i.id === label) || family[0];
}
export type FieldDueItem = { id: string; title: string; kind: "risk.review" | "inspection"; departmentId: string; ownerId: string; due: string; daysUntilDue: number; qr: QrTarget };
export const daysFrom = (date: string, from: string) => Math.round((Date.parse(`${date}T12:00:00Z`) - Date.parse(`${from}T12:00:00Z`)) / 86400000);
export function fieldDueItems(risks: RiskData, inspections: InspectionData, date = today()): FieldDueItem[] {
  return [...risks.assessments.filter(a => a.status === "Approved" && a.reviewDate).map(a => ({ id: a.id, title: a.title, kind: "risk.review" as const, departmentId: a.departmentId, ownerId: a.ownerId, due: a.reviewDate, daysUntilDue: daysFrom(a.reviewDate, date), qr: { kind: "risk" as const, id: a.id } })), ...inspections.inspections.filter(i => i.active && !i.completedAt).map(i => ({ id: i.id, title: i.title, kind: "inspection" as const, departmentId: i.department, ownerId: i.inspector, due: i.scheduled, daysUntilDue: daysFrom(i.scheduled, date), qr: { kind: "inspection" as const, id: inspectionLabelId(i) } }))].filter(i => Number.isFinite(i.daysUntilDue));
}
export function matchesFieldJob(item: FieldDueItem, job: ScheduledJob, records: ImportRecords) {
  if (!job.targets.includes(item.kind)) return false;
  const p = departmentPath(records, item.departmentId);
  if (job.scope !== "company" && ![`departments:${p.department?.id}`, `locations:${p.location?.id}`, `sites:${p.site?.id}`, `businessUnits:${p.unit?.id}`].includes(job.scope)) return false;
  return job.kind === "overdue" ? item.daysUntilDue <= -job.overdueDays : job.kind === "upcoming" ? item.daysUntilDue >= 0 && item.daysUntilDue <= job.advanceDays : true;
}
export function fieldReminders(items: FieldDueItem[], jobs: ScheduledJob[], records: ImportRecords) {
  return items.flatMap(item => {
    const matching = jobs.filter(j => j.enabled && j.owners && j.channels.includes("inApp") && j.kind !== "digest" && matchesFieldJob(item, j, records));
    return matching.length ? [{ ...item, schedules: matching.map(j => j.name) }] : [];
  });
}
