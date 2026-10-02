"use client";

import { Select } from "./select";

import { useMemo, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Plus, Search, Trash2, Users } from "lucide-react";
import type { ImportRecords } from "./bulk-import";
import { scopeOptions, type RoleAssignment, type ScopeKind } from "./access-model";

const PAGE_SIZE = 20;
const scopeKinds: { value: ScopeKind; label: string }[] = [
  { value: "company", label: "Whole company" },
  { value: "businessUnits", label: "Business unit" },
  { value: "sites", label: "Site" },
  { value: "locations", label: "Location" },
  { value: "departments", label: "Department" },
];

export function AssignmentDirectory({ records, assignments, roleFilter, onRoleFilterChange, onAdd, onRemove }: {
  records: ImportRecords;
  assignments: RoleAssignment[];
  roleFilter: string;
  onRoleFilterChange: (value: string) => void;
  onAdd: (assignment: RoleAssignment) => void;
  onRemove: (id: string) => void;
}) {
  const [userQuery, setUserQuery] = useState("");
  const [userId, setUserId] = useState("");
  const [roleId, setRoleId] = useState("");
  const [scopeKind, setScopeKind] = useState<ScopeKind | "">("");
  const [scopeQuery, setScopeQuery] = useState("");
  const [scopeId, setScopeId] = useState("");
  const [error, setError] = useState("");
  const [directoryQuery, setDirectoryQuery] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");
  const [page, setPage] = useState(1);

  const usersById = useMemo(() => new Map(records.users.map(user => [user.id, user])), [records.users]);
  const rolesById = useMemo(() => new Map(records.roles.map(role => [role.id, role])), [records.roles]);
  const allScopes = useMemo(() => scopeOptions(records), [records]);
  const scopesByValue = useMemo(() => new Map(allScopes.map(scope => [scope.value, scope])), [allScopes]);
  const selectedUser = usersById.get(userId);
  const selectedScope = scopeKind === "company" ? allScopes[0] : scopesByValue.get(`${scopeKind}:${scopeId}`);
  const matchingUsers = useMemo(() => {
    const term = userQuery.trim().toLowerCase();
    if (term.length < 2) return [];
    return records.users.filter(user => `${user.name} ${user.detail || ""}`.toLowerCase().includes(term));
  }, [records.users, userQuery]);
  const matchingScopes = useMemo(() => {
    if (!scopeKind || scopeKind === "company") return [];
    const term = scopeQuery.trim().toLowerCase();
    return allScopes.filter(scope => scope.kind === scopeKind && (!term || scope.label.toLowerCase().includes(term)));
  }, [allScopes, scopeKind, scopeQuery]);
  const filteredAssignments = useMemo(() => {
    const term = directoryQuery.trim().toLowerCase();
    return assignments.filter(assignment => {
      const user = usersById.get(assignment.userId);
      return (!term || `${user?.name || ""} ${user?.detail || ""}`.toLowerCase().includes(term))
        && (!roleFilter || assignment.roleId === roleFilter)
        && (!scopeFilter || assignment.scopeKind === scopeFilter);
    }).sort((a, b) => (usersById.get(a.userId)?.name || "").localeCompare(usersById.get(b.userId)?.name || "") || (rolesById.get(a.roleId)?.name || "").localeCompare(rolesById.get(b.roleId)?.name || ""));
  }, [assignments, usersById, rolesById, directoryQuery, roleFilter, scopeFilter]);
  const pageCount = Math.max(1, Math.ceil(filteredAssignments.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visibleAssignments = filteredAssignments.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const start = filteredAssignments.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const end = Math.min(currentPage * PAGE_SIZE, filteredAssignments.length);

  const add = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!userId || !roleId || !scopeKind || !selectedScope) { setError("Choose a user, role and exact scope."); return; }
    if (assignments.some(item => item.userId === userId && item.roleId === roleId && item.scopeKind === scopeKind && item.scopeId === selectedScope.id)) {
      setError("This user already has that role at this scope.");
      return;
    }
    onAdd({ id: `assignment-${crypto.randomUUID()}`, userId, roleId, scopeKind, scopeId: selectedScope.id });
    setRoleId("");
    setScopeKind("");
    setScopeId("");
    setScopeQuery("");
    setError("");
  };

  return <div className="directory-stack">
    <section className="directory-summary" aria-label="Access overview"><div><strong>{records.users.length.toLocaleString()}</strong><span>users</span></div><div><strong>{records.roles.length.toLocaleString()}</strong><span>roles</span></div><div><strong>{assignments.length.toLocaleString()}</strong><span>assignments</span></div></section>
    <section className="directory-card"><div className="directory-heading"><div><span className="page-eyebrow">GRANT ACCESS</span><h2>Add a role assignment</h2><p>Find a person, choose a role, and select exactly where it applies. Keep the person selected to add another role.</p></div></div>
      <form className="directory-add-form" onSubmit={add}>
        <div className="directory-user-picker"><label htmlFor="assign-user-search">User</label>{selectedUser ? <div className="directory-selected"><span className="directory-person-icon"><Users size={15} /></span><span><strong>{selectedUser.name}</strong><small>{selectedUser.detail}</small></span><button type="button" onClick={() => { setUserId(""); setUserQuery(""); setError(""); }}>Change</button></div> : <><div className="directory-search-input"><Search size={15} /><input id="assign-user-search" value={userQuery} onChange={event => { setUserQuery(event.target.value); setError(""); }} placeholder="Search name or email" autoComplete="off" /></div>{userQuery.trim().length >= 2 && <div className="directory-results" aria-label="Matching users">{matchingUsers.slice(0, 8).map(user => <button type="button" key={user.id} onClick={() => { setUserId(user.id); setUserQuery(""); setError(""); }}><strong>{user.name}</strong><small>{user.detail}</small></button>)}{matchingUsers.length === 0 && <p>No users found.</p>}{matchingUsers.length > 8 && <p>Showing 8 of {matchingUsers.length}. Type more to narrow the search.</p>}</div>}{userQuery.trim().length < 2 && <small className="directory-field-hint">Type at least 2 characters. Only matches are shown.</small>}</>}</div>
        <label>Role<Select value={roleId} onChange={event => { setRoleId(event.target.value); setError(""); }} required><option value="">Choose a role</option>{records.roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</Select></label>
        <div className="directory-scope-picker"><label htmlFor="assign-scope-kind">Scope level</label><Select id="assign-scope-kind" value={scopeKind} onChange={event => { setScopeKind(event.target.value as ScopeKind | ""); setScopeId(""); setScopeQuery(""); setError(""); }} required><option value="">Choose a level</option>{scopeKinds.map(kind => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</Select>{scopeKind && scopeKind !== "company" && <><div className="directory-search-input"><Search size={15} /><input aria-label="Find scope" value={scopeQuery} onChange={event => { setScopeQuery(event.target.value); setScopeId(""); setError(""); }} placeholder={`Find a ${scopeKinds.find(kind => kind.value === scopeKind)?.label.toLowerCase()}`} autoComplete="off" /></div>{selectedScope && <div className="directory-scope-selected">Selected: <strong>{selectedScope.label}</strong></div>}<div className="directory-results scope-results" aria-label="Matching scopes">{matchingScopes.slice(0, 8).map(scope => <button type="button" className={scope.id === scopeId ? "selected" : ""} key={scope.value} onClick={() => { setScopeId(scope.id || ""); setError(""); }}>{scope.label}</button>)}{matchingScopes.length === 0 && <p>No matching scopes.</p>}{matchingScopes.length > 8 && <p>Showing 8 of {matchingScopes.length}. Search to narrow the list.</p>}</div></>}</div>
        {error && <p className="assignment-error" role="alert">{error}</p>}
        <button className="directory-assign-button" type="submit"><Plus size={16} /> Assign role</button>
      </form>
    </section>
    <section className="directory-card"><div className="directory-heading"><div><span className="page-eyebrow">ACCESS DIRECTORY</span><h2>Current assignments</h2><p>Search and filter assignments without loading every user into a menu.</p></div><span className="assignment-count">{filteredAssignments.length.toLocaleString()} results</span></div>
      <div className="directory-filters"><div className="directory-search-input"><Search size={16} /><input aria-label="Search assignments by user" value={directoryQuery} onChange={event => { setDirectoryQuery(event.target.value); setPage(1); }} placeholder="Search user name or email" /></div><Select aria-label="Filter assignments by role" value={roleFilter} onChange={event => { onRoleFilterChange(event.target.value); setPage(1); }}><option value="">All roles</option>{records.roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</Select><Select aria-label="Filter assignments by scope" value={scopeFilter} onChange={event => { setScopeFilter(event.target.value); setPage(1); }}><option value="">All scopes</option>{scopeKinds.map(kind => <option key={kind.value} value={kind.value}>{kind.label}</option>)}</Select></div>
      {filteredAssignments.length ? <div className="assignment-table-wrap"><table className="assignment-table"><thead><tr><th>User</th><th>Role</th><th>Applies to</th><th /></tr></thead><tbody>{visibleAssignments.map(item => { const user = usersById.get(item.userId); const protectedAdmin = item.userId === "user-1" && item.roleId === "role-1" && item.scopeKind === "company"; const scopeValue = item.scopeKind === "company" ? "company" : `${item.scopeKind}:${item.scopeId}`; return <tr key={item.id}><td><strong>{user?.name || "Unknown user"}</strong><small className="directory-user-email">{user?.detail}</small></td><td>{rolesById.get(item.roleId)?.name || "Unknown role"}</td><td><span className="scope-pill">{scopesByValue.get(scopeValue)?.label || "Unknown scope"}</span></td><td><button type="button" aria-label={`Remove ${rolesById.get(item.roleId)?.name || "role"} assignment for ${user?.name || "user"}`} title={protectedAdmin ? "Keep a tenant administrator" : "Remove assignment"} disabled={protectedAdmin} onClick={() => onRemove(item.id)}><Trash2 size={15} /></button></td></tr>; })}</tbody></table></div> : <div className="directory-empty">No assignments match these filters.</div>}
      <div className="directory-pagination"><span>Showing {start}–{end} of {filteredAssignments.length.toLocaleString()}</span><div><button type="button" aria-label="Previous assignment page" disabled={currentPage === 1} onClick={() => setPage(currentPage - 1)}><ChevronLeft size={16} /></button><span>Page {currentPage} of {pageCount}</span><button type="button" aria-label="Next assignment page" disabled={currentPage === pageCount} onClick={() => setPage(currentPage + 1)}><ChevronRight size={16} /></button></div></div>
    </section>
    <p className="context-note">This demo filters in browser memory. A live tenant should query and paginate assignments on the server.</p>
  </div>;
}
