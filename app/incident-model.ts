import type { InspectionSource } from "./inspection-model";
import type { LawSource } from "./law-model";
import type { FormBlueprint } from "./form-builder";
import { today, departmentPath } from "./risk-model";
import type { ImportRecords } from "./bulk-import";

export type AuditSource = { auditId: string; fieldId: string; question: string; comment?: string };
export type Answers = Record<string, string | string[]>;
export type Cause = { id: string; name: string; group: string; active: boolean };
export type Reportee = { id: string; name: string; destination: string; kind: "Internal" | "External"; active: boolean };
export type IncidentType = { name: string; active: boolean; subtypes: string[]; inactiveSubtypes?: string[]; multiple: boolean; assignmentRequired: boolean; investigationEnabled: boolean; investigationRequired: boolean; confidential: boolean; attachments: boolean; targetDays: number; reportTemplate: string; investigationTemplate: string };
export type Evidence = { name: string; url?: string };
export type Person = { id: string; name: string; kind: string; involvement: string; injury: string };
export type Loss = { id: string; from: string; to: string; kind: string; note: string };
export type Investigation = { state: "In progress" | "Completed"; template: FormBlueprint; answers: Answers; investigator: string; safety: boolean; hazard: string; environment: boolean; aspect: string; impact: string; duration: string; unit: string; causes: string[]; reportable: boolean; reportees: string[]; losses: Loss[]; hoursLost: number; actionRequired: boolean; closingNote: string; evidence: Evidence[] };
export type Incident = { lawSource?: LawSource; auditSource?: AuditSource; inspectionSource?: InspectionSource; id: string; title: string; type: string; subtype: string; severity: string; occurred: string; department: string; locationDetail: string; shift: string; immediate: string; firstAid: string; nurse: boolean; assigned: string[]; notify: string[]; due: string; confidential: boolean; active: boolean; draft: boolean; closed: boolean; people: Person[]; template: FormBlueprint; answers: Answers; evidence: Evidence[]; investigation?: Investigation; history: { at: string; note: string }[] };
export type TrendCriteria = { from: string; to: string; type: string; subtype: string; cause: string; department: string };
export type IncidentAction = { lawSource?: LawSource; auditSource?: AuditSource; inspectionSource?: InspectionSource; id: string; title: string; kind: "Corrective" | "Preventive"; incidents: string[]; owner: string; department: string; due: string; priority: string; category: string; status: "Open" | "In progress" | "Awaiting effectiveness" | "Effective" | "Ineffective"; completion: string; reviewer: string; reviewDate: string; reviewNote: string; evidence: Evidence[]; followupOf?: string; trend?: { criteria: TrendCriteria; matched: string[]; captured: string } };
export type IncidentTask = { id: string; action: string; title: string; owner: string; department: string; due: string; priority: string; completed: boolean; completion: string; evidence: Evidence[] };
export type IncidentData = { incidents: Incident[]; actions: IncidentAction[]; tasks: IncidentTask[]; types: IncidentType[]; causes: Cause[]; reportees: Reportee[]; exportColumns: string[] };
export const incidentTypeNames = ["Accident", "Complaint", "Non Compliance", "Dangerous Occurrence", "Inspection Finding", "Environmental Incident", "Near Miss", "Audit Non Conformance", "Safety Comment"];
export const causeGroups = ["Equipment", "Materials", "Methods", "People", "Workplace"];
export const defaultColumns = ["Reference", "Title", "Type", "Subtype", "Severity", "Occurred", "Site", "Department", "Status", "Assigned", "Days lost"];
export const snapshot = <T,>(value: T): T => JSON.parse(JSON.stringify(value));
export const addDays = (date: string, n: number) => { const d = new Date(`${date.slice(0, 10)}T12:00:00`); d.setDate(d.getDate() + n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`; };
export const recordHistory = (i: Incident, note: string): Incident => ({ ...i, history: [...i.history, { at: new Date().toISOString(), note: `${note} · Alex Morgan` }] });
export const lostDays = (i: Incident) => (i.investigation?.losses || []).filter(l => l.kind !== "Restricted duties").reduce((sum, l) => sum + Math.max(0, Math.round((Date.parse(`${l.to}T12:00:00Z`) - Date.parse(`${l.from}T12:00:00Z`)) / 86400000) + 1), 0);
export const visibleFields = (form: FormBlueprint, site: string) => form.fields.filter(f => !f.siteIds?.length || f.siteIds.includes(site));
export const missingAnswers = (form: FormBlueprint, answers: Answers, site: string) => visibleFields(form, site).filter(f => f.required && f.type !== "Section heading" && (Array.isArray(answers[f.id]) ? !(answers[f.id] as string[]).length : !String(answers[f.id] || "").trim())).map(f => f.label);
export function resolvedAction(a: IncidentAction, actions: IncidentAction[], seen = new Set<string>()): boolean {
  if (a.status === "Effective") return true;
  if (a.status !== "Ineffective" || seen.has(a.id)) return false;
  seen.add(a.id);
  const followups = actions.filter(b => b.followupOf === a.id && a.incidents.every(id => b.incidents.includes(id)));
  return followups.length > 0 && followups.every(b => resolvedAction(b, actions, new Set(seen)));
}
export function incidentStatus(i: Incident, data: IncidentData) {
  if (i.draft) return "Draft";
  if (i.closed) return "Closed";
  if (!i.investigation) return "Open";
  if (i.investigation.state === "In progress") return "Investigating";
  const actions = data.actions.filter(a => a.incidents.includes(i.id));
  if (actions.some(a => a.status === "Ineffective" && !resolvedAction(a, data.actions))) return "Follow-up required";
  if (actions.some(a => ["Open", "In progress"].includes(a.status))) return "Action in progress";
  if (actions.some(a => a.status === "Awaiting effectiveness")) return "Awaiting effectiveness";
  if (i.investigation.actionRequired && !actions.length) return "Action required";
  return "Ready to close";
}
export function closureBlock(i: Incident, data: IncidentData) {
  if (i.draft) return "Submit the draft before closing.";
  const config = data.types.find(t => t.name === i.type);
  if (!i.investigation && config?.investigationRequired) return "This incident type requires a completed investigation.";
  if (i.investigation?.state === "In progress") return "Complete the investigation first.";
  const linked = data.actions.filter(a => a.incidents.includes(i.id));
  if (i.investigation?.actionRequired && !linked.length) return "Raise or link the required action first.";
  if (linked.some(a => !resolvedAction(a, data.actions))) return "Complete actions and verify effectiveness, including any follow-up actions.";
  return "";
}
export function matchesTrend(i: Incident, c: TrendCriteria) {
  return i.active && !i.draft && i.occurred.slice(0, 10) >= c.from && i.occurred.slice(0, 10) <= c.to && (!c.type || i.type === c.type) && (!c.subtype || i.subtype === c.subtype) && (!c.cause || i.investigation?.causes.includes(c.cause)) && (!c.department || i.department === c.department);
}
export function initialIncidentData(forms: FormBlueprint[]): IncidentData {
  const report = snapshot(forms.find(f => f.id === "form-incident")!);
  const investigation = snapshot(forms.find(f => f.id === "form-investigation")!);
  const types = incidentTypeNames.map(name => ({ name, active: true, subtypes: name === "Audit Non Conformance" ? ["Major Non Conformance"] : name === "Accident" ? ["First aid", "Lost time", "Reportable injury"] : name === "Near Miss" ? ["Vehicle movement", "Slip / trip", "Equipment"] : name === "Environmental Incident" ? ["Spill", "Release", "Waste"] : ["General"], multiple: true, assignmentRequired: true, investigationEnabled: true, investigationRequired: !["Safety Comment", "Complaint"].includes(name), confidential: name === "Accident", attachments: true, targetDays: 7, reportTemplate: report.id, investigationTemplate: investigation.id }));
  const causes = [
    ["Equipment", "Defective equipment"], ["Equipment", "Inadequate guarding"], ["Materials", "Poor labelling or storage"], ["Methods", "Inadequate procedure"], ["Methods", "Insufficient maintenance"], ["People", "Training gap"], ["People", "PPE not used"], ["Workplace", "Poor signage"], ["Workplace", "Poor housekeeping"], ["Workplace", "Unsafe layout"],
  ].map(([group, name], n) => ({ id: `cause-${n + 1}`, group, name, active: true }));
  const make = (id: string, title: string, type: string, subtype: string, severity: string, department: string, occurred: string, assigned: string): Incident => ({ id, title, type, subtype, severity, department, occurred: `${occurred}T09:15`, locationDetail: department === "dep-3" ? "Loading bay 2" : "Production line 1", shift: "Day", immediate: "Area made safe and supervisor informed.", firstAid: type === "Accident" ? "First aider attended; returned to duties." : "", nurse: false, assigned: [assigned], notify: ["user-1"], due: addDays(occurred, 7), confidential: type === "Accident", active: true, draft: false, closed: false, people: [{ id: `${id}-person`, name: "Jordan Kelly", kind: "Employee", involvement: type === "Accident" ? "Injured" : "Witness", injury: type === "Accident" ? "Minor hand cut" : "None" }], template: snapshot(report), answers: { "incident-title": title, "incident-when": `${occurred}T09:15`, "incident-where": department === "dep-3" ? "Cork Distribution / Warehouse" : "Dublin Plant / Production Floor", "incident-what": type === "Near Miss" ? "A pedestrian entered the forklift route. The driver stopped safely." : title, "incident-injured": type === "Accident" ? "Yes" : "No" }, evidence: [], history: [{ at: `${occurred}T10:00:00`, note: "Incident recorded · Alex Morgan" }] });
  const inv = (closingNote: string, causes: string[], actionRequired = true): Investigation => ({ state: "Completed", template: snapshot(investigation), answers: { "investigation-summary": closingNote, "investigation-root": "Existing controls were not consistently applied." }, investigator: "user-2", safety: true, hazard: "Workplace movement", environment: false, aspect: "", impact: "", duration: "", unit: "minutes", causes, reportable: false, reportees: [], losses: [], hoursLost: 0, actionRequired, closingNote, evidence: [] });
  const incidents = [make("INC-261", "Near miss at loading bay", "Near Miss", "Vehicle movement", "Major", "dep-3", "2026-09-29", "user-2"), make("INC-260", "Hydraulic oil spill contained", "Environmental Incident", "Spill", "Major", "dep-2", "2026-09-26", "user-1"), make("INC-255", "Hand cut during maintenance", "Accident", "First aid", "Minor", "dep-2", "2026-09-23", "user-2"), make("INC-252", "Missing pedestrian signage", "Inspection Finding", "General", "Minor", "dep-3", "2026-09-19", "user-2"), make("INC-249", "Slip near wash station", "Accident", "Lost time", "Major", "dep-1", "2026-09-14", "user-1"), make("INC-245", "Forklift reversing observation", "Near Miss", "Vehicle movement", "Minor", "dep-3", "2026-09-10", "user-2")];
  incidents[0].investigation = { ...inv("Review loading bay routes and visibility.", ["cause-8", "cause-10"]), state: "In progress" };
  incidents[1].investigation = { ...inv("Hose failure; containment prevented drain contamination.", ["cause-1", "cause-5"]), safety: false, environment: true, aspect: "Oil storage and handling", impact: "Potential surface water pollution", duration: "30", unit: "minutes" };
  incidents[2].investigation = inv("New gloves issued; no further action required.", ["cause-7"], false); incidents[2].closed = true;
  incidents[3].investigation = inv("Signage replaced. Monitor driver and pedestrian behaviour.", ["cause-8"]);
  incidents[4].investigation = { ...inv("Improve housekeeping and surface drainage.", ["cause-9"]), losses: [{ id: "loss-1", from: "2026-09-15", to: "2026-09-17", kind: "Lost time injury", note: "Three calendar days absent." }] };
  incidents[5].investigation = inv("Route marking needs improvement.", ["cause-8", "cause-10"]);
  const action = (id: string, title: string, incidents: string[], department: string, due: string, status: IncidentAction["status"]): IncidentAction => ({ id, title, kind: "Corrective", incidents, department, owner: "user-2", due, priority: "High", category: "Engineering control", status, completion: status === "Awaiting effectiveness" ? "New signs installed and photographed." : "", reviewer: "user-1", reviewDate: status === "Awaiting effectiveness" ? "2026-09-30" : "", reviewNote: "", evidence: [] });
  return { incidents, actions: [action("ACT-093", "Refresh loading bay markings", ["INC-261", "INC-245"], "dep-3", "2026-10-07", "In progress"), action("ACT-092", "Replace hose and inspect hydraulic lines", ["INC-260"], "dep-2", "2026-09-30", "Open"), action("ACT-090", "Install pedestrian warning signs", ["INC-252"], "dep-3", "2026-09-25", "Awaiting effectiveness"), action("ACT-088", "Improve wash station drainage", ["INC-249"], "dep-1", "2026-10-09", "Open")], tasks: [{ id: "IT-031", action: "ACT-093", title: "Agree pedestrian route with logistics team", owner: "user-2", department: "dep-3", due: "2026-10-03", priority: "High", completed: false, completion: "", evidence: [] }, { id: "IT-029", action: "ACT-090", title: "Install and photograph new signs", owner: "user-3", department: "dep-3", due: "2026-09-24", priority: "Normal", completed: true, completion: "Signs installed at all crossing points.", evidence: [{ name: "pedestrian-signs.jpg" }] }], types, causes, reportees: [{ id: "reportee-1", name: "EHS leadership", destination: "ehs@northstar.example", kind: "Internal", active: true }, { id: "reportee-2", name: "External regulator (example)", destination: "Official reporting portal — example only", kind: "External", active: true }], exportColumns: defaultColumns };
}
export function incidentSite(i: Incident, records: ImportRecords) { return departmentPath(records, i.department).site?.id || ""; }
export function newIncident(template: FormBlueprint): Incident { return { id: "", title: "", type: "Near Miss", subtype: "Vehicle movement", severity: "Minor", occurred: `${today()}T09:00`, department: "", locationDetail: "", shift: "", immediate: "", firstAid: "", nurse: false, assigned: [], notify: [], due: addDays(today(), 7), confidential: false, active: true, draft: true, closed: false, people: [{ id: "person-1", name: "", kind: "Employee", involvement: "Witness", injury: "None" }], template: snapshot(template), answers: {}, evidence: [], history: [] }; }
