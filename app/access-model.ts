import type { ImportRecords } from "./bulk-import";

export type ScopeKind = "company" | "businessUnits" | "sites" | "locations" | "departments";
export type RoleAssignment = { id: string; userId: string; roleId: string; scopeKind: ScopeKind; scopeId?: string };
export type RolePermissions = Record<string, string[]>;
export type ScopeOption = { value: string; label: string; kind: ScopeKind; id?: string };
export type PermissionGroup = { id: string; title: string; description: string; permissions: { id: string; label: string }[] };

export const permissionGroups: PermissionGroup[] = [
  { id: "risk", title: "Risk", description: "Assessments and the tasks that control risks.", permissions: [
    { id: "risk.view", label: "View risks" }, { id: "risk.create", label: "Create risks" },
    { id: "risk.edit", label: "Edit risks" }, { id: "risk.approve", label: "Approve risks" },
    { id: "risk.task.view", label: "View tasks" }, { id: "risk.task.create", label: "Create tasks" },
    { id: "risk.task.assign", label: "Assign tasks" }, { id: "risk.task.complete", label: "Complete assigned tasks" },
    { id: "risk.task.verify", label: "Verify completed tasks" },
  ] },
  { id: "incident", title: "Incident", description: "Reports, investigations and corrective actions.", permissions: [
    { id: "incident.view", label: "View incidents" }, { id: "incident.create", label: "Report incidents" },
    { id: "incident.triage", label: "Triage incidents" }, { id: "incident.investigate", label: "Investigate incidents" },
    { id: "incident.close", label: "Close or reopen incidents" },
    { id: "incident.action.view", label: "View actions" }, { id: "incident.action.create", label: "Create actions" },
    { id: "incident.action.assign", label: "Assign actions" }, { id: "incident.action.complete", label: "Complete assigned actions" },
    { id: "incident.action.verify", label: "Verify completed actions" },
    { id: "incident.recurring.manage", label: "Manage recurring actions" },
  ] },
  { id: "audit", title: "Audit", description: "Scheduled audits, findings and reports.", permissions: [
    { id: "audit.view", label: "View audits" }, { id: "audit.schedule", label: "Schedule audits" },
    { id: "audit.create", label: "Create audits" }, { id: "audit.conduct", label: "Conduct audits" },
    { id: "audit.finding.manage", label: "Record findings & evidence" },
    { id: "audit.report.publish", label: "Publish reports" }, { id: "audit.close", label: "Close audits" },
  ] },
  { id: "inspection", title: "Inspection", description: "Routine workplace and equipment checks with connected follow-up.", permissions: [
    { id: "inspection.view", label: "View inspections & findings" }, { id: "inspection.schedule", label: "Schedule inspections" },
    { id: "inspection.conduct", label: "Record checks & evidence" }, { id: "inspection.complete", label: "Complete inspections" },
    { id: "inspection.followup", label: "Raise actions & incident drafts" }, { id: "inspection.archive", label: "Archive & restore inspections" },
    { id: "inspection.export", label: "Export inspection reports" },
  ] },
  { id: "document", title: "Document", description: "Controlled files and their review cycle.", permissions: [
    { id: "document.view", label: "View documents" }, { id: "document.create", label: "Create documents" },
    { id: "document.edit", label: "Edit drafts" }, { id: "document.review", label: "Review documents" },
    { id: "document.approve", label: "Approve documents" }, { id: "document.publish", label: "Publish documents" },
    { id: "document.download", label: "Download documents" }, { id: "document.archive", label: "Archive documents" },
  ] },
  { id: "law", title: "Law", description: "Requirements, obligations and compliance evaluations.", permissions: [
    { id: "law.view", label: "View requirements" }, { id: "law.requirement.manage", label: "Manage requirements" },
    { id: "law.evaluation.create", label: "Create evaluations" }, { id: "law.evaluation.approve", label: "Approve evaluations" },
  ] },
  { id: "forms", title: "Form Builder", description: "One form schema can be used by incidents, risks, audits and inspections.", permissions: [
    { id: "forms.view", label: "View form designs" }, { id: "forms.design", label: "Create & edit draft forms" },
    { id: "forms.publish", label: "Publish form versions" }, { id: "forms.archive", label: "Archive forms" },
  ] },
  { id: "configuration", title: "Configuration", description: "Tenant administration and commercial settings.", permissions: [
    { id: "config.structure.manage", label: "Manage company structure" }, { id: "config.users.manage", label: "Manage users" },
    { id: "config.roles.manage", label: "Manage roles & assignments" }, { id: "config.bulkImport", label: "Run bulk import" },
    { id: "config.branding.manage", label: "Change branding" }, { id: "config.subscription.manage", label: "Manage subscription" },
    { id: "config.jobs.view", label: "View scheduled jobs & run history" },
    { id: "config.jobs.manage", label: "Create, edit & pause scheduled jobs" }, { id: "config.jobs.test", label: "Test scheduled jobs" },
  ] },
];

export const allPermissionIds = permissionGroups.flatMap(group => group.permissions.map(permission => permission.id));

export const initialRolePermissions: RolePermissions = {
  "role-1": allPermissionIds,
  "role-2": ["risk.view", "risk.create", "risk.edit", "risk.task.view", "risk.task.create", "risk.task.assign", "risk.task.verify", "incident.view", "incident.create", "incident.triage", "incident.investigate", "incident.action.view", "incident.action.create", "incident.action.assign", "incident.action.verify", "audit.view", "audit.schedule", "audit.create", "audit.finding.manage", "document.view", "law.view"],
  "role-3": ["risk.view", "risk.task.view", "risk.task.complete", "incident.create", "incident.action.view", "incident.action.complete", "document.view", "law.view"],
  "role-4": ["audit.view", "audit.conduct", "audit.finding.manage", "audit.report.publish", "document.view"],
  "role-5": ["forms.view", "forms.design", "risk.view", "incident.view", "audit.view"],
};

export const initialRoleAssignments: RoleAssignment[] = [
  { id: "assignment-1", userId: "user-1", roleId: "role-1", scopeKind: "company" },
  { id: "assignment-2", userId: "user-2", roleId: "role-2", scopeKind: "sites", scopeId: "site-1" },
  { id: "assignment-3", userId: "user-2", roleId: "role-4", scopeKind: "sites", scopeId: "site-2" },
  { id: "assignment-4", userId: "user-3", roleId: "role-3", scopeKind: "company" },
];

const scopeName: Record<Exclude<ScopeKind, "company">, string> = {
  businessUnits: "Business unit", sites: "Site", locations: "Location", departments: "Department",
};

export function scopeOptions(records: ImportRecords): ScopeOption[] {
  return [
    { value: "company", label: "Whole company", kind: "company" },
    ...(["businessUnits", "sites", "locations", "departments"] as const).flatMap(kind =>
      records[kind].map(row => ({ value: `${kind}:${row.id}`, label: `${scopeName[kind]} · ${row.name}`, kind, id: row.id }))
    ),
  ];
}

export function scopeLabel(assignment: RoleAssignment, records: ImportRecords): string {
  if (assignment.scopeKind === "company") return "Whole company";
  return `${scopeName[assignment.scopeKind]} · ${records[assignment.scopeKind].find(row => row.id === assignment.scopeId)?.name || "Unknown"}`;
}

export function importedRolePermissions(moduleNames: string[]): string[] {
  const entryPoint: Record<string, string> = { Risk: "risk.view", Incident: "incident.view", Audit: "audit.view", Inspection: "inspection.view", Document: "document.view", Law: "law.view" };
  return moduleNames.map(name => allPermissionIds.includes(name) ? name : entryPoint[name]).filter(Boolean);
}
