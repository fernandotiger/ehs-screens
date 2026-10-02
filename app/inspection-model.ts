import type { FormBlueprint, FormField } from "./form-builder";
import type { ImportRecords } from "./bulk-import";
import type { RiskData } from "./risk-model";
import { departmentPath, today } from "./risk-model";
import { addDays, newIncident, resolvedAction, snapshot, type Evidence, type IncidentData } from "./incident-model";

export type InspectionSource = { inspectionId: string; fieldId: string; question: string; comment: string };
export type InspectionCheck = { answer: string | string[]; result: "" | "Pass" | "Needs attention" | "N/A"; note: string; priority: "Normal" | "High" | "Critical"; immediate: string; disposition: "" | "Corrected on site" | "Corrective action" | "Incident"; owner: string; due: string; riskId: string; actionId?: string; incidentId?: string; evidence: Evidence[] };
export type Inspection = { qrOriginId?: string; id: string; title: string; template: FormBlueprint; department: string; inspector: string; scheduled: string; performed: string; area: string; notes: string; checks: Record<string, InspectionCheck>; evidence: Evidence[]; summary: string; completedAt: string; active: boolean; history: { at: string; note: string }[] };
export type InspectionData = { inspections: Inspection[] };
export const inspectionId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 6).toUpperCase()}`;
export const inspectionHistory = (note: string) => ({ at: new Date().toISOString(), note: `${note} · Alex Morgan` });
const system: FormField[] = [
  { id: "inspection-title", label: "Inspection title", type: "Short text", required: true, system: true },
  { id: "inspection-site", label: "Site or location", type: "Short text", required: true, system: true },
  { id: "inspection-date", label: "Inspection date", type: "Date", required: true, system: true },
  { id: "inspection-person", label: "Inspector", type: "Person", required: true, system: true },
  { id: "inspection-area", label: "Area or equipment", type: "Short text", required: true, system: true },
];
const question = (id: string, label: string, helpText: string): FormField => ({ id, label, helpText, type: "Yes / No", required: true });
export const initialInspectionForms: FormBlueprint[] = [
  { id: "form-inspection", name: "Workplace inspection", target: "Inspection", status: "Published", version: 1, fields: [...system,
    { id: "inspection-workplace", label: "People & workplace", type: "Section heading", required: false },
    question("inspection-routes", "Are walkways and traffic routes clear?", "Check segregation, markings and access during the work being observed."),
    question("inspection-exits", "Are emergency exits and fire equipment accessible?", "Check access without moving obstructions first; record any immediate response."),
    question("inspection-ppe", "Is the required PPE being used?", "Observe the work and check the PPE specified for it."),
    question("inspection-storage", "Are materials stored safely and the area tidy?", "Check stacking, spills and the condition of storage areas."),
  ] },
  { id: "form-inspection-equipment", name: "Equipment pre-use check", target: "Inspection", status: "Published", version: 1, fields: [...system,
    question("equipment-condition", "Is the equipment free from visible damage?", "Record the equipment identifier in Area or equipment."),
    question("equipment-guards", "Are guards and safety devices in place?", "Use the approved equipment procedure to establish which checks are safe to perform."),
    question("equipment-controls", "Have the required pre-use checks been completed?", "Describe defects and the immediate response; these sample questions do not replace equipment instructions."),
    { id: "equipment-reading", label: "Meter reading / operating hours", type: "Number", required: false, helpText: "Record if available; use N/A with a reason where no meter is fitted." },
  ] },
];
export const ladderInspectionForm: FormBlueprint = { id: "form-inspection-ladder", name: "Ladder condition check", target: "Inspection", status: "Published", version: 1, fields: [...system,
  question("ladder-identification", "Is the ladder identified and suitable for the planned task?", "Confirm the equipment identifier and the approved task before use."),
  question("ladder-condition", "Are the rails, rungs and feet free from visible damage?", "Use the company procedure for the specific ladder. Record any defect and immediate response."),
  question("ladder-storage", "Is the ladder stored safely and ready for use?", "Record contamination, access or storage issues. This demonstration does not replace manufacturer instructions."),
] };
initialInspectionForms.push(ladderInspectionForm);
export const inspectionSite = (i: Inspection, records: ImportRecords) => departmentPath(records, i.department).site?.id || "";
export const inspectionQuestions = (i: Inspection | FormBlueprint) => ("template" in i ? i.template : i).fields.filter(f => !f.system && f.type !== "Section heading");
export const inspectionTemplateAvailable = (form: FormBlueprint, site: string) => form.target === "Inspection" && form.status === "Published" && inspectionQuestions(form).some(f => !f.siteIds?.length || f.siteIds.includes(site));
export const inspectionSnapshot = (form: FormBlueprint, site: string): FormBlueprint => ({ ...snapshot(form), fields: snapshot(form.fields.filter(f => !f.siteIds?.length || f.siteIds.includes(site))) });
export const emptyCheck = (i: Inspection): InspectionCheck => ({ answer: "", result: "", note: "", priority: "Normal", immediate: "", disposition: "", owner: i.inspector, due: addDays(today(), 7), riskId: "", evidence: [] });
export const inspectionProgress = (i: Inspection) => { const qs = inspectionQuestions(i); return qs.length ? Math.round(qs.filter(q => !!i.checks[q.id]?.result).length / qs.length * 100) : 0; };
export const inspectionStatus = (i: Inspection) => !i.active ? "Archived" : i.completedAt ? "Completed" : Object.values(i.checks).some(c => c.result || (Array.isArray(c.answer) ? c.answer.length : c.answer.trim())) ? "In progress" : i.scheduled < today() ? "Overdue" : "Scheduled";
export function validInspectionDate(value: string) { return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T12:00:00Z`)) && new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value; }

export function validateInspection(i: Inspection, records: ImportRecords) {
  if (!i.title.trim() || !i.area.trim() || !validInspectionDate(i.scheduled)) throw Error("Enter a title, area or equipment and valid scheduled date.");
  if (!records.users.some(u => u.id === i.inspector) || !records.departments.some(d => d.id === i.department) || !inspectionSite(i, records)) throw Error("Choose an existing inspector and department with a site.");
  if (!inspectionQuestions(i).length) throw Error("Use an Inspection template with at least one question visible for this site.");
}
export function findingResolved(c: InspectionCheck, data: IncidentData) {
  if (c.disposition === "Corrected on site") return !!c.immediate.trim();
  const action = data.actions.find(a => a.id === c.actionId);
  if (action) return resolvedAction(action, data.actions);
  const incident = data.incidents.find(i => i.id === c.incidentId);
  return !!incident?.closed && !incident.draft;
}
export function inspectionFindings(data: InspectionData) {
  return data.inspections.flatMap(inspection => inspectionQuestions(inspection).flatMap(field => inspection.checks[field.id]?.result === "Needs attention" ? [{ inspection, field, check: inspection.checks[field.id] }] : []));
}
export function inspectionCompletionBlock(i: Inspection, records: ImportRecords, incidents: IncidentData, risks: RiskData): string {
  try { validateInspection(i, records); } catch (e) { return (e as Error).message; }
  if (!i.active) return "Restore this inspection before recording work.";
  if (!validInspectionDate(i.performed) || i.performed > today()) return "Enter the actual inspection date, today or earlier.";
  if (!i.summary.trim()) return "Enter a closing summary describing the inspection outcome.";
  for (const q of inspectionQuestions(i)) {
    const c = i.checks[q.id];
    if (!c?.result) return `Record a result for: ${q.label}`;
    if (c.result === "N/A") { if (!c.note.trim()) return `Explain why this check is N/A: ${q.label}`; continue; }
    if (q.required && (Array.isArray(c.answer) ? !c.answer.length : !String(c.answer).trim())) return `Answer the required question: ${q.label}`;
    if (q.type === "Number" && c.answer !== "" && !Number.isFinite(Number(c.answer))) return `Enter a valid number for: ${q.label}`;
    if (q.type === "Dropdown" && c.answer && !q.options?.includes(String(c.answer))) return `Choose a configured option for: ${q.label}`;
    if (q.type === "Multiple choice" && (!Array.isArray(c.answer) || c.answer.some(value => !q.options?.includes(value)))) return `Choose configured options for: ${q.label}`;
    if (q.type === "Yes / No" && !["Yes", "No"].includes(String(c.answer))) return `Choose Yes or No for: ${q.label}`;
    if (q.type === "Yes / No" && c.answer === "No" && c.result === "Pass") return `A No answer cannot pass this check: ${q.label}`;
    if (c.riskId && !risks.assessments.some(a => a.id === c.riskId && departmentPath(records, a.departmentId).site?.id === inspectionSite(i, records))) return `Choose a Risk assessment in this inspection's site: ${q.label}`;
    if (c.result !== "Needs attention") continue;
    if (!c.note.trim()) return `Describe the issue: ${q.label}`;
    if (c.priority === "Critical" && !c.immediate.trim()) return `Record the immediate response to the critical finding: ${q.label}`;
    if (c.disposition === "Corrected on site") { if (!c.immediate.trim()) return `Describe the correction on site: ${q.label}`; }
    else if (c.disposition === "Corrective action") {
      if (!incidents.actions.some(a => a.id === c.actionId && a.inspectionSource?.inspectionId === i.id && a.inspectionSource.fieldId === q.id)) return `Create the corrective action for: ${q.label}`;
    } else if (c.disposition === "Incident") {
      if (!incidents.incidents.some(a => a.id === c.incidentId && a.inspectionSource?.inspectionId === i.id && a.inspectionSource.fieldId === q.id)) return `Create the incident draft for: ${q.label}`;
    } else return `Choose how to follow up: ${q.label}`;
  }
  return "";
}
export function completeInspection(i: Inspection, records: ImportRecords, incidents: IncidentData, risks: RiskData) {
  if (i.completedAt) return i;
  const error = inspectionCompletionBlock(i, records, incidents, risks); if (error) throw Error(error);
  return { ...snapshot(i), completedAt: new Date().toISOString(), history: [...i.history, inspectionHistory("Inspection completed; corrective work is tracked separately")] };
}

export function nextQrInspection(completed: Inspection, date: string, forms: FormBlueprint[], data: InspectionData, records: ImportRecords): Inspection {
  if (!completed.completedAt || !completed.active) throw Error("Complete the active inspection before scheduling its next check.");
  if (!validInspectionDate(date) || date <= today()) throw Error("Choose a future date for the next inspection.");
  const origin = completed.qrOriginId || completed.id;
  if (data.inspections.some(i => i.id !== completed.id && i.active && !i.completedAt && (i.qrOriginId || i.id) === origin)) throw Error("An outstanding inspection already uses this QR label. Complete or archive it before scheduling another.");
  const form = forms.find(f => f.id === completed.template.id && inspectionTemplateAvailable(f, inspectionSite(completed, records)));
  if (!form) throw Error("Publish an available version of this Inspection form before scheduling the next check.");
  return { ...snapshot(completed), id: inspectionId("INS"), qrOriginId: origin, title: completed.title, scheduled: date, performed: "", template: inspectionSnapshot(form, inspectionSite(completed, records)), checks: {}, evidence: [], summary: "", completedAt: "", history: [inspectionHistory(`Next inspection scheduled from ${completed.id}; equipment QR label retained`)] };
}

export function routeInspectionFinding(i: Inspection, fieldId: string, data: IncidentData, forms: FormBlueprint[], records: ImportRecords) {
  validateInspection(i, records);
  if (!i.active || i.completedAt) throw Error("Follow-up can be created only on an active inspection before completion.");
  const q = inspectionQuestions(i).find(f => f.id === fieldId), c = i.checks[fieldId];
  if (!q || c?.result !== "Needs attention" || !c.note.trim()) throw Error("Record the issue before creating follow-up.");
  if (!validInspectionDate(i.performed) || i.performed > today()) throw Error("Enter the actual inspection date before raising follow-up.");
  if (c.priority === "Critical" && !c.immediate.trim()) throw Error("Record the immediate response for this critical issue.");
  if (!records.users.some(u => u.id === c.owner) || !validInspectionDate(c.due)) throw Error("Choose a follow-up owner and valid due date.");
  const source: InspectionSource = { inspectionId: i.id, fieldId, question: q.label, comment: c.note };
  const previousAction = data.actions.find(a => a.inspectionSource?.inspectionId === i.id && a.inspectionSource.fieldId === fieldId && !a.followupOf);
  const previousIncident = data.incidents.find(a => a.inspectionSource?.inspectionId === i.id && a.inspectionSource.fieldId === fieldId);
  if (previousAction || previousIncident) {
    const checked = { ...c, disposition: previousAction ? "Corrective action" as const : "Incident" as const, actionId: previousAction?.id, incidentId: previousIncident?.id };
    return { inspection: { ...i, checks: { ...i.checks, [fieldId]: checked } }, incidents: data };
  }
  let inc = data, checked = { ...c };
  if (c.disposition === "Corrective action") {
    const id = inspectionId("ACT"); checked.actionId = id;
    inc = { ...data, actions: [{ id, title: `${i.area}: ${q.label}`, kind: "Corrective", incidents: [], owner: c.owner, department: i.department, due: c.due, priority: c.priority, category: "Inspection follow-up", status: "Open", completion: "", reviewer: "", reviewDate: "", reviewNote: "", evidence: snapshot(c.evidence), inspectionSource: source }, ...data.actions] };
  } else if (c.disposition === "Incident") {
    const config = data.types.find(t => t.name === "Inspection Finding" && t.active);
    const form = forms.find(f => f.id === config?.reportTemplate && f.target === "Incident" && f.status === "Published" && (f.incidentPurpose || "Report") === "Report");
    if (!config || !form) throw Error("Activate Inspection Finding in Incident Settings and bind a published Incident report form first.");
    const subtype = config.subtypes.find(s => !config.inactiveSubtypes?.includes(s)); if (!subtype) throw Error("Activate a subtype for Inspection Finding in Incident Settings.");
    const report = newIncident(form); report.people = [];
    Object.assign(report, { id: inspectionId("INC"), title: `${i.title}: ${q.label}`, type: config.name, subtype, severity: c.priority === "Critical" ? "Critical" : c.priority === "High" ? "Major" : "Minor", occurred: `${i.performed}T09:00`, department: i.department, locationDetail: i.area, immediate: c.immediate, due: c.due, confidential: config.confidential, assigned: [c.owner], inspectionSource: source, evidence: snapshot(c.evidence), history: [inspectionHistory(`Draft created from ${i.id}; complete required report answers in Incident`)] });
    const values: Record<string, string> = { "Incident title": report.title, "Date and time of event": report.occurred, "Site or location": departmentPath(records, i.department).site?.name || "", "What happened?": `${q.label}\n${c.note}\nObserved at ${i.area}` };
    for (const f of form.fields) if (values[f.label]) report.answers[f.id] = values[f.label];
    checked.incidentId = report.id; inc = { ...data, incidents: [report, ...data.incidents] };
  } else throw Error("Choose Corrective action or Incident before creating follow-up.");
  return { inspection: { ...snapshot(i), checks: { ...snapshot(i.checks), [fieldId]: checked }, history: [...i.history, inspectionHistory(`${c.disposition} ${checked.actionId || checked.incidentId} created for ${q.label}`)] }, incidents: inc };
}

export function initialInspectionData(forms: FormBlueprint[]): InspectionData {
  const workplace = forms.find(f => f.id === "form-inspection")!, equipment = forms.find(f => f.id === "form-inspection-equipment")!;
  const make = (id: string, title: string, department: string, inspector: string, scheduled: string, area: string, template = workplace): Inspection => ({ id, title, template: snapshot(template), department, inspector, scheduled, performed: "", area, notes: "", checks: {}, evidence: [], summary: "", completedAt: "", active: true, history: [inspectionHistory("Sample inspection scheduled")] });
  const cork = make("INS-101", "Cork · loading bay walkaround", "dep-3", "user-2", today(), "Warehouse · loading bay 2"); cork.performed = today();
  cork.checks["inspection-routes"] = { ...emptyCheck(cork), answer: "No", result: "Needs attention", note: "Pedestrian markings are worn at the loading bay entrance.", priority: "High", immediate: "Temporary cones separate the pedestrian route.", disposition: "Corrective action", riskId: "RA-1042" };
  cork.checks["inspection-exits"] = { ...emptyCheck(cork), answer: "Yes", result: "Pass", note: "Exit route and fire equipment accessible." };
  const done = make("INS-100", "Dublin · housekeeping check", "dep-1", "user-1", addDays(today(), -2), "Production Floor"); done.performed = done.scheduled; done.summary = "All sample checks passed; no follow-up required."; done.completedAt = `${done.performed}T12:00:00Z`;
  for (const q of inspectionQuestions(done)) done.checks[q.id] = { ...emptyCheck(done), answer: "Yes", result: "Pass" };
  done.history.push(inspectionHistory("Sample inspection completed"));
  const ladder = make("INS-LAD001", "Ladder LAD-001 · condition check", "dep-2", "user-3", today(), "Ladder LAD-001 · maintenance store", forms.find(f => f.id === "form-inspection-ladder")!);
  return { inspections: [cork, make("INS-102", "Dublin · equipment pre-use check", "dep-2", "user-3", addDays(today(), 1), "Press line · equipment P-04", equipment), make("INS-103", "Cork · storage area check", "dep-3", "user-2", addDays(today(), -3), "Warehouse · racking area"), done, ladder] };
}
