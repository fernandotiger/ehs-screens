import type { FormBlueprint, FormField, AuditMethod, AuditSettings } from "./form-builder";
import type { ImportRecords } from "./bulk-import";
import { addDays, incidentStatus, missingAnswers, newIncident, resolvedAction, snapshot, type Evidence, type IncidentData } from "./incident-model";
import { departmentPath, today } from "./risk-model";

export const findingTypes = ["Conforming", "Observation", "Insufficient Finding", "Opportunity for Improvement", "Minor Non Conformance", "Major Non Conformance", "Not Applicable", "Good Practice"] as const;
export type FindingType = typeof findingTypes[number];
export type Plan = { id: string; name: string; start: number; end: number; areas: string[]; notes: string; active: boolean };
export type ProgrammeType = { id: string; name: string; method: "Standard" | "Express"; description: string; active: boolean };
export type Programme = { id: string; name: string; plan: string; type: string; owner: string; review: string; description: string; template: string; active: boolean; completed: boolean; managedBy: "User" | "Scheduler"; root?: string };
export type ThirdParty = { id: string; name: string; company: string; email: string; phone: string; active: boolean };
export type Finding = { answer: string | string[]; type: FindingType; comment: string; score: string; recorded: boolean; closed: boolean; origin?: { audit: string; field: string } };
export type Audit = { id: string; name: string; programme: string; template: FormBlueprint; lead: string; secondary: string[]; department: string; auditeeKind: "Employee" | "Third party"; auditee: string; start: string; duration: number; unit: string; scope: string; observed: string; participants: string; adHoc: boolean; notes: string; evidence: Evidence[]; findings: Record<string, Finding>; completed: boolean; closingNote: string; review: "None" | "Pending" | "Reviewed"; reviewer: string; reviewNote: string; active: boolean; history: { at: string; note: string }[]; rule?: string };
export type Rule = Omit<Audit, "id" | "template" | "findings" | "completed" | "closingNote" | "review" | "reviewer" | "reviewNote" | "evidence" | "history" | "rule"> & { id: string; templateId: string; frequency: "Daily" | "Weekly" | "Monthly" | "Quarterly" | "Annually"; leadDays: number; until: string };
export type AuditData = { plans: Plan[]; programmes: Programme[]; types: ProgrammeType[]; parties: ThirdParty[]; audits: Audit[]; rules: Rule[] };
export const newId = (prefix: string) => `${prefix}-${crypto.randomUUID().slice(0, 7).toUpperCase()}`;
export const defaultAuditSettings = (method: AuditMethod = "Standard"): AuditSettings => ({ method, defaultFinding: "Conforming", siteIds: [], mobile: true, assignMajorToAuditee: true });
const systemFields: FormField[] = [
  { id: "audit-title", label: "Audit title", type: "Short text", required: true, system: true },
  { id: "audit-site", label: "Site or location", type: "Short text", required: true, system: true },
  { id: "audit-date", label: "Scheduled date", type: "Date", required: true, system: true },
  { id: "audit-lead", label: "Lead auditor", type: "Person", required: true, system: true },
  { id: "audit-scope", label: "Scope and objectives", type: "Long text", required: true, system: true },
];
const question = (id: string, label: string, type: FormField["type"] = "Long text", helpText = "Record what you observed and the evidence checked."): FormField => ({ id, label, type, helpText, required: true, auditScore: { min: 0, max: 5, step: 1 } });
export const initialAuditForms: FormBlueprint[] = [
  { id: "form-audit-standard", name: "Management system assurance", target: "Audit", status: "Published", version: 1, auditSettings: defaultAuditSettings(), fields: [...systemFields, { id: "as-section", label: "People & controls", type: "Section heading", required: false }, question("as-training", "Is training current for the work being carried out?"), question("as-controls", "Are critical controls implemented and effective?"), question("as-records", "Are records complete and available?")] },
  { id: "form-audit-score", name: "5S & safety scored audit", target: "Audit", status: "Published", version: 1, auditSettings: defaultAuditSettings("Scorable"), fields: [...systemFields, { id: "sc-workplace", label: "Workplace organisation", type: "Section heading", required: false }, question("sc-clear", "Are walkways clear and correctly marked?", "Yes / No"), question("sc-storage", "Is equipment stored in designated locations?", "Yes / No"), { id: "sc-safety", label: "Safety controls", type: "Section heading", required: false }, question("sc-guards", "Are machine guards in place and inspected?", "Yes / No"), question("sc-emergency", "Is emergency equipment accessible?", "Yes / No")] },
  { id: "form-audit-express", name: "Workplace safety walkabout", target: "Audit", status: "Published", version: 1, auditSettings: defaultAuditSettings("Express"), fields: [...systemFields, question("ex-ppe", "Appropriate PPE is being worn", "Yes / No"), question("ex-exits", "Emergency exits are clear", "Yes / No"), { ...question("ex-condition", "Housekeeping condition", "Dropdown"), options: ["Good", "Acceptable", "Needs attention"] }, question("ex-observation", "Describe your observations", "Long text")] },
];
export const methodOf = (a: Audit | FormBlueprint) => ("template" in a ? a.template : a).auditSettings?.method || "Standard";
export const questions = (a: Audit | FormBlueprint) => ("template" in a ? a.template : a).fields.filter(f => !f.system && f.type !== "Section heading");
export const emptyFinding = (a: Audit): Finding => ({ answer: "", type: (a.template.auditSettings?.defaultFinding || "Conforming") as FindingType, comment: "", score: "", recorded: false, closed: false });
export const answered = (f?: Finding) => !!f?.recorded && (f.type === "Not Applicable" || (Array.isArray(f.answer) ? f.answer.length > 0 : !!String(f.answer).trim()));
export const progress = (a: Audit) => { const qs = questions(a); return qs.length ? Math.round(qs.filter(q => methodOf(a) === "Express" ? answered(a.findings[q.id]) : a.findings[q.id]?.closed).length / qs.length * 100) : 0; };
export const auditStatus = (a: Audit) => !a.active ? "Archived" : a.review === "Pending" ? "Awaiting review" : a.review === "Reviewed" ? "Reviewed" : a.completed ? "Completed" : Object.values(a.findings).some(f => f.recorded) ? "In progress" : a.start.slice(0, 10) < today() ? "Overdue" : "Scheduled";
export const auditSite = (a: Audit | Rule, records: ImportRecords) => departmentPath(records, a.department).site?.id || "";
export const templateAvailable = (f: FormBlueprint, site: string, method: "Standard" | "Express") => f.target === "Audit" && f.status === "Published" && !!questions(f).filter(q => !q.siteIds?.length || q.siteIds.includes(site)).length && (!f.auditSettings?.siteIds.length || f.auditSettings.siteIds.includes(site)) && (method === "Express" ? methodOf(f) === "Express" : methodOf(f) !== "Express");
export function auditSnapshot(f: FormBlueprint, site: string) { return { ...snapshot(f), fields: snapshot(f.fields.filter(q => !q.siteIds?.length || q.siteIds.includes(site))) }; }
export function scoreSummary(a: Audit) {
  const groups: { label: string; earned: number; possible: number; scored: number; total: number; percentage: number | null }[] = [];
  let current = "General";
  for (const q of a.template.fields) {
    if (q.system) continue;
    if (q.type === "Section heading") { current = q.label; continue; }
    let g = groups.find(g => g.label === current);
    if (!g) { g = { label: current, earned: 0, possible: 0, scored: 0, total: 0, percentage: null }; groups.push(g); }
    const f = a.findings[q.id];
    g.total++;
    if (f?.recorded && f.type !== "Not Applicable" && f.score !== "" && validScore(q, f.score)) { g.earned += Number(f.score); g.possible += q.auditScore?.max ?? 5; g.scored++; }
  }
  groups.forEach(g => { g.percentage = g.possible ? Math.round(g.earned / g.possible * 100) : null; });
  const earned = groups.reduce((s, g) => s + g.earned, 0), possible = groups.reduce((s, g) => s + g.possible, 0);
  return { groups, earned, possible, percentage: possible ? Math.round(earned / possible * 100) : null };
}
export function validScore(q: FormField, value: string) { const { min, max, step } = q.auditScore || { min: 0, max: 5, step: 1 }; const n = Number(value); return value !== "" && Number.isFinite(n) && step > 0 && n >= min && n <= max && Math.abs((n - min) / step - Math.round((n - min) / step)) < 0.00001; }
export function findingError(a: Audit, q: FormField, f: Finding) {
  if (!findingTypes.includes(f.type)) return "Select a finding classification.";
  if (!answered({ ...f, recorded: true })) return "Enter an answer, or classify it as Not Applicable.";
  if (["Major Non Conformance", "Minor Non Conformance", "Opportunity for Improvement", "Insufficient Finding", "Not Applicable"].includes(f.type) && !f.comment.trim()) return "Describe the finding or explain why the question does not apply.";
  if (methodOf(a) === "Scorable" && f.type !== "Not Applicable" && !validScore(q, f.score)) return "Enter a score within the configured range and increment.";
  return "";
}
export function history(a: Audit, note: string): Audit { return { ...a, history: [...a.history, { at: new Date().toISOString(), note: `${note} · Alex Morgan` }] }; }
export function lineage(d: AuditData, p: string) { const programme = d.programmes.find(x => x.id === p); return programme?.root || programme?.id || p; }
export function trails(d: AuditData) {
  return d.audits.flatMap(a => questions(a).filter(q => a.findings[q.id]?.closed && a.findings[q.id].type === "Insufficient Finding").map(q => ({ audit: a, field: q, finding: a.findings[q.id], resolvedBy: d.audits.find(b => Object.values(b.findings).some(f => f.closed && f.type !== "Insufficient Finding" && f.type !== "Not Applicable" && f.origin?.audit === a.id && f.origin.field === q.id))?.id })));
}
export const linksFor = (a: Audit, field: string, inc: IncidentData) => [...inc.incidents.filter(i => i.auditSource?.auditId === a.id && i.auditSource.fieldId === field).map(i => ({ kind: "incident" as const, id: i.id, title: i.title, status: incidentStatus(i,inc) })), ...inc.actions.filter(i => i.auditSource?.auditId === a.id && i.auditSource.fieldId === field).map(i => ({ kind: "action" as const, id: i.id, title: i.title, status: i.status === "Ineffective" && resolvedAction(i,inc.actions) ? "Effective follow-up" : i.status }))];
/** A single transaction for locked findings and generated Incident records. */
export function commitFindings(a: Audit, next: Record<string, Finding>, inc: IncidentData, forms: FormBlueprint[], records: ImportRecords): { audit: Audit; incidents: IncidentData; error: string } {
  const audit = snapshot(a), incidents = snapshot(inc);
  for (const q of questions(a)) {
    const previous = a.findings[q.id];
    const f = next[q.id];
    if (previous?.closed) { audit.findings[q.id] = previous; continue; }
    if (!f?.recorded) continue;
    const error = findingError(a, q, f);
    if (error) return { audit: a, incidents: inc, error: `${q.label}: ${error}` };
    audit.findings[q.id] = snapshot(f);
    if (!f.closed || linksFor(a, q.id, incidents).length) continue;
    const auditSource = { auditId: a.id, fieldId: q.id, question: q.label, comment: f.comment };
    const owner = a.auditeeKind === "Employee" ? a.auditee : a.lead;
    if (f.type === "Major Non Conformance") {
      const config = incidents.types.find(t => t.name === "Audit Non Conformance");
      const template = forms.find(t => t.id === config?.reportTemplate && t.target === "Incident" && t.status === "Published" && (t.incidentPurpose || "Report") === "Report");
      if (!config?.active || !template) return { audit: a, incidents: inc, error: "Publish the Audit Non Conformance report template and activate that incident type in Incident → Settings before closing a major finding." };
      const report = newIncident(template);
      Object.assign(report, { id: newId("INC"), title: `${a.name}: ${q.label}`, type: config.name, subtype: config.subtypes[0] || "General", severity: "Major", department: a.department, occurred: a.start, due: addDays(today(), config.targetDays), assigned: [a.template.auditSettings?.assignMajorToAuditee ? owner : a.lead], confidential: config.confidential, people: [{ id: newId("person"), name: records.users.find(u => u.id === a.lead)?.name || "Lead auditor", kind: "Employee", involvement: "Witness", injury: "None" }], immediate: "Raised from a closed audit finding. Investigate the root cause and track follow-up here.", auditSource });
      for (const field of template.fields) {
        const values: Record<string, string> = { "Incident title": report.title, "Date and time of event": a.start, "Site or location": [departmentPath(records, a.department).site?.name, departmentPath(records, a.department).location?.name].join(" / "), "What happened?": `${q.label}\n${f.comment}\nAudit answer: ${Array.isArray(f.answer) ? f.answer.join(", ") : f.answer}`, "Was anyone injured?": "No" };
        if (values[field.label]) report.answers[field.id] = values[field.label];
      }
      report.draft = missingAnswers(template, report.answers, auditSite(a, records)).length > 0;
      report.history = [{ at: new Date().toISOString(), note: `Generated from ${a.id}, ${q.label}. ${report.draft ? "Complete additional required report fields before submission." : "Investigation required."} · Alex Morgan` }];
      incidents.incidents.unshift(report);
    } else if (["Minor Non Conformance", "Opportunity for Improvement"].includes(f.type)) {
      incidents.actions.unshift({ id: newId("ACT"), title: `${a.name}: ${q.label}`, kind: f.type === "Minor Non Conformance" ? "Corrective" : "Preventive", incidents: [], owner, department: a.department, due: addDays(today(), 14), priority: f.type === "Minor Non Conformance" ? "High" : "Normal", category: "Audit follow-up", status: "Open", completion: "", reviewer: a.lead, reviewDate: "", reviewNote: "", evidence: [], auditSource });
    }
  }
  return { audit: history(audit, "Findings saved; confirmed findings locked and follow-up linked"), incidents, error: "" };
}
export function newAudit(template: FormBlueprint, programme: string, site: string): Audit { return { id: newId("AUD"), name: "", programme, template: auditSnapshot(template, site), lead: "user-1", secondary: [], department: "", auditeeKind: "Employee", auditee: "", start: `${today()}T09:00`, duration: 1, unit: "hours", scope: "", observed: "", participants: "", adHoc: false, notes: "", evidence: [], findings: {}, completed: false, closingNote: "", review: "None", reviewer: "user-1", reviewNote: "", active: true, history: [] }; }
export function scheduleError(a: Audit, d: AuditData, records: ImportRecords) {
  const p = d.programmes.find(p => p.id === a.programme), plan = d.plans.find(x => x.id === p?.plan), type = d.types.find(t => t.id === p?.type);
  if (!p?.active || p.completed || !plan?.active || !type?.active) return "Choose an active, open programme in an active plan with an active programme type.";
  if (!a.name.trim() || !a.scope.trim() || !a.lead || !a.department || !a.auditee || !a.start || !Number.isFinite(a.duration) || a.duration <= 0) return "Complete the name, scope, lead, department, auditee, date/time and positive duration.";
  if (!records.users.some(u => u.id === a.lead) || !records.departments.some(x => x.id === a.department)) return "Choose an existing user and department.";
  if (a.auditeeKind === "Employee" ? !records.users.some(u => u.id === a.auditee) : !d.parties.some(p => p.id === a.auditee && p.active)) return "Choose an active auditee.";
  const year = Number(a.start.slice(0, 4));
  if (year < plan.start || year > plan.end) return `Schedule inside the plan period (${plan.start}–${plan.end}).`;
  if (!questions(a).length || (type.method === "Express" ? methodOf(a) !== "Express" : methodOf(a) === "Express")) return "Choose a compatible Audit template with at least one question.";
  if (a.adHoc && methodOf(a) !== "Express") return "Only Express audits can be ad hoc.";
  return "";
}
export function archiveBlock(kind: "audit" | "programme" | "plan", id: string, d: AuditData, inc: IncidentData) {
  const ps = kind === "plan" ? d.programmes.filter(p => p.plan === id) : d.programmes.filter(p => p.id === id);
  const audits = kind === "audit" ? d.audits.filter(a => a.id === id) : d.audits.filter(a => ps.some(p => p.id === a.programme));
  if (audits.some(a => a.completed) || ps.some(p => p.completed)) return "Completed audits and programmes must be retained.";
  if (audits.some(a => [...inc.incidents, ...inc.actions].some(i => i.auditSource?.auditId === a.id))) return "This record has Incident follow-up. Retain it to preserve traceability.";
  if (kind !== "audit" && (audits.some(a => a.active) || d.rules.some(r => r.active && ps.some(p => p.id === r.programme)))) return "Archive child audits and pause recurring schedules first.";
  if (kind === "plan" && ps.some(p => p.active)) return "Archive child programmes first.";
  return "";
}
export function occurrence(rule: Pick<Rule, "start" | "frequency">, index: number) {
  const [date, time = "09:00"] = rule.start.split("T"); const [year, month, day] = date.split("-").map(Number);
  const d = new Date(Date.UTC(year, month - 1, day, 12));
  if (rule.frequency === "Daily" || rule.frequency === "Weekly") d.setUTCDate(day + index * (rule.frequency === "Daily" ? 1 : 7));
  else { const months = index * (rule.frequency === "Monthly" ? 1 : rule.frequency === "Quarterly" ? 3 : 12); const last = new Date(Date.UTC(year, month - 1 + months + 1, 0)).getUTCDate(); d.setUTCFullYear(year, month - 1 + months, Math.min(day, last)); }
  return `${d.toISOString().slice(0, 10)}T${time}`;
}
export function rulePreview(r: Rule, d: AuditData, count = 6) { return Array.from({ length: Math.min(12, Math.max(1, count)) }, (_, n) => occurrence(r, n)).filter(t => !r.until || t.slice(0, 10) <= r.until).map(start => ({ start, notify: addDays(start, -r.leadDays), existing: d.audits.find(a => a.rule === r.id && a.start === start)?.id })); }
export function generateRule(r: Rule, d: AuditData, forms: FormBlueprint[], records: ImportRecords, count = 6): { data: AuditData; created: number; error: string } {
  if (!r.active) return { data: d, created: 0, error: "Resume this schedule before generating audits." };
  const programme = d.programmes.find(p => p.id === r.programme), plan = d.plans.find(p => p.id === programme?.plan), type = d.types.find(t => t.id === programme?.type);
  const template = forms.find(f => f.id === r.templateId);
  if (!programme?.active || programme.completed || !plan?.active || !type?.active || !template || !templateAvailable(template, auditSite(r, records), type.method)) return { data: d, created: 0, error: "The programme, type, plan and a compatible published Form Builder template must be active." };
  const next = snapshot(d); let created = 0;
  for (const item of rulePreview(r, d, count)) {
    if (item.existing) continue;
    const year = Number(item.start.slice(0, 4)); let target = next.programmes.find(p => p.id === programme.id)!;
    if (year < plan.start) return { data: d, created: 0, error: "The recurrence begins before its original plan period." };
    if (year > plan.end) {
      let future = next.plans.find(p => p.active && p.start === year && p.end === year && p.areas.join("|") === plan.areas.join("|"));
      if (!future) { future = { ...snapshot(plan), id: newId("AP"), name: `${year} · ${plan.name.replace(/^\d{4}\s*[·–-]\s*/, "")}`, start: year, end: year }; next.plans.push(future); }
      let rolled = next.programmes.find(p => p.plan === future.id && (p.root || p.id) === (programme.root || programme.id) && p.active && !p.completed);
      if (!rolled) { rolled = { ...snapshot(programme), id: newId("PG"), plan: future.id, review: `${year}-12-31`, managedBy: "Scheduler", root: programme.root || programme.id, completed: false, active: true }; next.programmes.push(rolled); }
      target = rolled;
    }
    const a: Audit = { ...newAudit(template, target.id, auditSite(r, records)), name: r.name, lead: r.lead, secondary: r.secondary, department: r.department, auditeeKind: r.auditeeKind, auditee: r.auditee, start: item.start, duration: r.duration, unit: r.unit, scope: r.scope, observed: r.observed, participants: r.participants, notes: r.notes, rule: r.id };
    const error = scheduleError(a, next, records); if (error) return { data: d, created: 0, error };
    next.audits.push(history(a, `Generated manually from ${r.id}. Notification preview: ${item.notify}`)); created++;
  }
  return { data: next, created, error: "" };
}
export function initialAuditData(forms: FormBlueprint[]): AuditData {
  const year = Number(today().slice(0, 4));
  const programmes: Programme[] = [
    { id: "PG-001", name: "Management system assurance", plan: "AP-001", type: "AT-1", owner: "user-1", review: `${year}-12-15`, description: "Verify the controls that protect people, environment and business performance.", template: "form-audit-standard", active: true, completed: false, managedBy: "User" },
    { id: "PG-002", name: "5S & workplace safety", plan: "AP-001", type: "AT-2", owner: "user-2", review: `${year}-12-20`, description: "Monthly scored checks of organisation and critical safety controls.", template: "form-audit-score", active: true, completed: false, managedBy: "User" },
    { id: "PG-003", name: "Weekly safety walkabouts", plan: "AP-001", type: "AT-3", owner: "user-1", review: `${year}-12-31`, description: "Short observations across production and logistics.", template: "form-audit-express", active: true, completed: false, managedBy: "User" },
    { id: "PG-004", name: "Supplier assurance", plan: "AP-001", type: "AT-4", owner: "user-3", review: `${year}-11-30`, description: "Check contractor competence and operational controls.", template: "form-audit-standard", active: true, completed: false, managedBy: "User" },
  ];
  const make = (id: string, name: string, programme: string, form: string, department: string, offset: number): Audit => { const a = newAudit(forms.find(f => f.id === form)!, programme, department === "dep-3" ? "site-2" : "site-1"); return history({ ...a, id, name, department, auditee: "user-2", start: `${addDays(today(), offset)}T09:00`, scope: "Observe the work area, interview the team and verify records against the published checklist." }, "Audit scheduled from published Form Builder template"); };
  const audits = [make("AUD-104", "Dublin · 5S & safety review", "PG-002", "form-audit-score", "dep-2", 0), make("AUD-103", "Management controls · Dublin", "PG-001", "form-audit-standard", "dep-1", -3), make("AUD-105", "Cork · weekly walkabout", "PG-003", "form-audit-express", "dep-3", 2), make("AUD-106", "Supplier · contractor assurance", "PG-004", "form-audit-standard", "dep-2", 7), make("AUD-101", "September management review", "PG-001", "form-audit-standard", "dep-1", -14)];
  audits[1].findings["as-training"] = { answer: "Training records verified for the production team.", type: "Conforming", comment: "Certificates current.", score: "", recorded: true, closed: true };
  audits[3].auditeeKind = "Third party"; audits[3].auditee = "TP-1";
  questions(audits[4]).forEach(q => { audits[4].findings[q.id] = { answer: q.id === "as-records" ? "Supplier competency record could not be located." : "Control verified through records and interview.", type: q.id === "as-records" ? "Insufficient Finding" : "Conforming", comment: q.id === "as-records" ? "Recheck contractor competency evidence at the next assurance audit." : "Evidence reviewed.", score: "", recorded: true, closed: true }; });
  audits[4].completed = true; audits[4].closingNote = "All findings recorded. Carry missing supplier evidence forward.";
  const sample = audits[2];
  const rule: Rule = { id: "RS-001", name: "Cork · weekly walkabout", programme: "PG-003", lead: "user-1", secondary: ["user-2"], department: "dep-3", auditeeKind: "Employee", auditee: "user-2", start: sample.start, duration: 30, unit: "minutes", scope: sample.scope, observed: "Logistics team", participants: "", adHoc: false, notes: "", active: true, templateId: "form-audit-express", frequency: "Weekly", leadDays: 2, until: "" };
  audits[2].rule = rule.id;
  return { plans: [{ id: "AP-001", name: `${year} · Northstar assurance plan`, start: year, end: year, areas: ["Health & Safety", "Environment", "Quality / Business"], notes: "Annual internal and supplier assurance across all operational sites.", active: true }], programmes, audits, rules: [rule], types: [{ id: "AT-1", name: "Internal management system", method: "Standard", description: "Management system and compliance assurance.", active: true }, { id: "AT-2", name: "5S / 6S scored inspections", method: "Standard", description: "Scorable templates for workplace organisation.", active: true }, { id: "AT-3", name: "Workplace walkabouts", method: "Express", description: "Fast safety observations and review.", active: true }, { id: "AT-4", name: "Supplier assurance", method: "Standard", description: "Third-party controls and competence.", active: true }], parties: [{ id: "TP-1", name: "Jamie Walsh", company: "Greenline Engineering", email: "jamie@greenline.example", phone: "+353 1 555 0198", active: true }] };
}
