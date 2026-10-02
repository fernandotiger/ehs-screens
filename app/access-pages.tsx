"use client";

import { useMemo, useState, type FormEvent } from "react";
import { ArrowRight, Check, ChevronRight, CircleHelp, Info, LockKeyhole, Plus, Save, Search, ShieldCheck, Users } from "lucide-react";
import type { ImportRecord, ImportRecords } from "./bulk-import";
import { permissionGroups, type RoleAssignment, type RolePermissions } from "./access-model";
import { AssignmentDirectory } from "./assignment-directory";

function PageHeading({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: React.ReactNode }) {
  return <div className="page-header"><div><div className="page-eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

export function RolesPermissionsPage({ records, rolePermissions, assignments, onCreateRole, onSaveRole, onAddAssignment, onRemoveAssignment }: {
  records: ImportRecords;
  rolePermissions: RolePermissions;
  assignments: RoleAssignment[];
  onCreateRole: (role: ImportRecord) => void;
  onSaveRole: (roleId: string, permissions: string[]) => void;
  onAddAssignment: (assignment: RoleAssignment) => void;
  onRemoveAssignment: (id: string) => void;
}) {
  const [selectedId, setSelectedId] = useState("role-1");
  const [activeGroupId, setActiveGroupId] = useState("risk");
  const [draft, setDraft] = useState<string[]>(rolePermissions["role-1"] || []);
  const [showCreate, setShowCreate] = useState(false);
  const [roleName, setRoleName] = useState("");
  const [roleError, setRoleError] = useState("");
  const [view, setView] = useState<"roles" | "assignments">("roles");
  const [roleQuery, setRoleQuery] = useState("");
  const [assignmentRoleFilter, setAssignmentRoleFilter] = useState("");
  const [saved, setSaved] = useState(false);
  const [switchWarning, setSwitchWarning] = useState("");
  const selectedRole = records.roles.find(role => role.id === selectedId) || records.roles[0];
  const group = permissionGroups.find(item => item.id === activeGroupId) || permissionGroups[0];
  const current = rolePermissions[selectedRole?.id] || [];
  const dirty = [...draft].sort().join("|") !== [...current].sort().join("|");
  const roleCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const assignment of assignments) counts.set(assignment.roleId, (counts.get(assignment.roleId) || 0) + 1);
    return counts;
  }, [assignments]);
  const filteredRoles = useMemo(() => records.roles.filter(role => role.name.toLowerCase().includes(roleQuery.trim().toLowerCase())), [records.roles, roleQuery]);

  const selectRole = (id: string) => {
    if (id !== selectedId && dirty) { setSwitchWarning("Save or discard your changes before choosing another role."); return; }
    setSelectedId(id); setDraft(rolePermissions[id] || []); setSaved(false); setSwitchWarning("");
  };
  const toggle = (id: string) => {
    setSaved(false);
    setSwitchWarning("");
    setDraft(currentDraft => {
      const next = new Set(currentDraft);
      if (next.has(id)) {
        next.delete(id);
        if (id === "forms.view") { next.delete("forms.design"); next.delete("forms.publish"); next.delete("forms.archive"); }
        if (id === "forms.design") next.delete("forms.publish");
        if (id === "config.jobs.view") { next.delete("config.jobs.manage"); next.delete("config.jobs.test"); }
      } else {
        next.add(id);
        if (id.startsWith("forms.") && id !== "forms.view") next.add("forms.view");
        if (id === "forms.publish") next.add("forms.design");
        if (id === "config.jobs.manage" || id === "config.jobs.test") next.add("config.jobs.view");
      }
      return [...next];
    });
  };
  const createRole = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const name = roleName.trim();
    if (!name) return;
    if (records.roles.some(role => role.name.toLowerCase() === name.toLowerCase())) { setRoleError("A role with this name already exists."); return; }
    const id = `role-${crypto.randomUUID()}`;
    onCreateRole({ id, name, detail: "Custom role · No permissions yet" });
    setSelectedId(id);
    setDraft([]);
    setRoleName("");
    setRoleError("");
    setShowCreate(false);
    setSaved(false);
  };
  return <>
    <PageHeading eyebrow="CONFIGURATION / ACCESS" title="Roles & permissions" description="Define each role's actions, then assign it to people at the right part of your organisation." action={view === "roles" ? <button className="page-primary" onClick={() => { if (dirty) { setSwitchWarning("Save or discard your changes before creating another role."); return; } setShowCreate(value => !value); }}><Plus size={16} /> Create role</button> : undefined} />
    <div className="access-principle"><ShieldCheck size={20} /><div><strong>What + where = access</strong><p>A role defines actions. An assignment limits those actions to a company, business unit, site, location or department. A person can hold several assignments.</p></div></div>
    <div className="access-switch" role="tablist" aria-label="Access administration views"><button role="tab" aria-selected={view === "roles"} className={view === "roles" ? "active" : ""} onClick={() => setView("roles")}><ShieldCheck size={16} /> Roles <span>{records.roles.length.toLocaleString()}</span>{dirty && <i aria-label="Unsaved changes" />}</button><button role="tab" aria-selected={view === "assignments"} className={view === "assignments" ? "active" : ""} onClick={() => setView("assignments")}><Users size={16} /> Assignments <span>{assignments.length.toLocaleString()}</span></button></div>
    {view === "roles" ? <div className="role-layout">
      <aside className="role-list-card"><div className="role-list-head"><span>YOUR ROLES</span><strong>{records.roles.length}</strong></div>
        {showCreate && <form className="role-create" onSubmit={createRole}><label htmlFor="new-role-name">Role name</label><input id="new-role-name" autoFocus value={roleName} onChange={event => { setRoleName(event.target.value); setRoleError(""); }} placeholder="e.g. Form Designer" required />{roleError && <small role="alert">{roleError}</small>}<button type="submit">Create empty role <ArrowRight size={14} /></button></form>}
        <div className="role-search"><Search size={15} /><input aria-label="Search roles" value={roleQuery} onChange={event => setRoleQuery(event.target.value)} placeholder="Search roles" /></div>
        <div className="role-list">{filteredRoles.map(role => { const count = roleCounts.get(role.id) || 0; return <button key={role.id} className={selectedRole?.id === role.id ? "active" : ""} onClick={() => selectRole(role.id)}><span className="role-avatar">{role.name.slice(0, 1)}</span><span><strong>{role.name}</strong><small>{count} assignment{count === 1 ? "" : "s"}</small></span><ChevronRight size={16} /></button>; })}{!filteredRoles.length && <p className="role-no-results">No roles match “{roleQuery}”.</p>}</div>
      </aside>
      <section className="role-editor" aria-label="Role permission editor"><div className="role-editor-head"><div><span className="page-eyebrow">ROLE PERMISSIONS</span><h2>{selectedRole?.name || "Select a role"}</h2><p>{draft.length} actions selected. Choose a module to edit its permissions.</p></div><div className="role-editor-actions">{dirty && <button className="role-discard" onClick={() => { setDraft(current); setSwitchWarning(""); }}>Discard</button>}<button className="role-save" disabled={!selectedRole || !dirty} onClick={() => { onSaveRole(selectedRole.id, draft); setSaved(true); setSwitchWarning(""); }}><Save size={16} /> Save changes</button></div></div>
        {switchWarning && <div className="role-warning" role="alert">{switchWarning}</div>}
        {saved && <div className="role-saved" role="status"><Check size={15} /> Permissions saved in this demo workspace.</div>}
        <div className="permission-tabs" role="tablist" aria-label="Permission areas">{permissionGroups.map(item => <button key={item.id} type="button" role="tab" aria-selected={activeGroupId === item.id} className={activeGroupId === item.id ? "active" : ""} onClick={() => setActiveGroupId(item.id)}>{item.title}<small>{item.permissions.filter(permission => draft.includes(permission.id)).length}/{item.permissions.length}</small></button>)}</div>
        <div className="permission-panel"><div className="permission-panel-head"><div><h3>{group.title}</h3><p>{group.description}</p></div><span>{group.permissions.length} actions</span></div><div className="permission-options">{group.permissions.map(permission => <label key={permission.id} className={draft.includes(permission.id) ? "checked" : ""}><input type="checkbox" checked={draft.includes(permission.id)} onChange={() => toggle(permission.id)} /><span>{permission.label}</span></label>)}</div>{group.id === "forms" && <p className="permission-hint"><Info size={15} /> Publishing requires View and Design. Give Publish only to a trusted approver.</p>}</div>
        <div className="role-editor-foot"><LockKeyhole size={15} /> This page configures proposed permissions. The prototype does not enforce them on module actions yet.</div>
        <button className="role-view-people" onClick={() => { setAssignmentRoleFilter(selectedRole.id); setView("assignments"); }}><Users size={15} /> View people with this role <ArrowRight size={14} /></button>
      </section>
    </div> : <AssignmentDirectory records={records} assignments={assignments} roleFilter={assignmentRoleFilter} onRoleFilterChange={setAssignmentRoleFilter} onAdd={onAddAssignment} onRemove={onRemoveAssignment} />}
    <p className="context-note"><CircleHelp size={16} /> Production checks must also consider tenant, subscription, record ownership, sensitivity and workflow state. Hiding a button is not authorisation.</p>
  </>;
}

