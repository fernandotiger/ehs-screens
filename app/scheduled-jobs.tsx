"use client";

import { Select } from "./select";

import { Fragment, useMemo, useState, type Dispatch, type FormEvent, type SetStateAction } from "react";
import { AlertCircle, ArrowRight, Bell, CalendarClock, Check, ChevronRight, Clock3, History, Info, Mail, Pause, Play, Plus, Save, Search, Settings2, ShieldCheck, X } from "lucide-react";
import type { ImportRecords } from "./bulk-import";
import type { FieldDueItem } from "./field-access-model";
import { scopeOptions } from "./access-model";

const recordTypes = [
  { id: "risk.review", label: "Risk reviews", module: "Risk" },
  { id: "risk.task", label: "Risk tasks", module: "Risk" },
  { id: "incident.investigation", label: "Investigations", module: "Incident" },
  { id: "incident.action", label: "Corrective actions", module: "Incident" },
  { id: "audit", label: "Audits", module: "Audit" },
  { id: "inspection", label: "Inspections", module: "Inspection" },
  { id: "document.review", label: "Document reviews", module: "Document" },
  { id: "law.evaluation", label: "Compliance evaluations", module: "Law" },
] as const;
export type RecordKind = typeof recordTypes[number]["id"];
type JobKind = "overdue" | "upcoming" | "digest";
type Frequency = "daily" | "weekdays" | "weekly" | "monthly";
type Channel = "email" | "inApp";
export type ScheduledJob = {
  id: string; name: string; kind: JobKind; enabled: boolean; targets: RecordKind[]; scope: string;
  frequency: Frequency; time: string; timeZone: string; weekday: number; monthDay: number;
  overdueDays: number; advanceDays: number; owners: boolean; roleIds: string[]; channels: Channel[];
  groupDigest: boolean; escalation: boolean; escalateAfter: number; escalationRoleId: string;
};
type RunItem = { id: string; title: string; owner: string; site: string; daysUntilDue: number };
export type JobRun = {
  id: string; jobId: string; jobName: string; startedAt: string; timeZone: string;
  trigger: "Scheduled" | "Test"; outcome: "Completed" | "Failed"; matched: number;
  delivered: number; escalated: number; detail: string; items?: RunItem[];
};

const jobKinds: { id: JobKind; title: string; description: string }[] = [
  { id: "overdue", title: "Overdue reminders", description: "Find unfinished work past its due date and remind the right people." },
  { id: "upcoming", title: "Upcoming due dates", description: "Notify owners before a review, audit or action becomes overdue." },
  { id: "digest", title: "EHS summary digest", description: "Bring open work and upcoming dates together in a regular summary." },
];
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const timeZones = ["Europe/Dublin", "Europe/London", "Europe/Berlin", "America/New_York", "UTC"];
const baseJob: Omit<ScheduledJob, "id" | "name"> = {
  kind: "overdue", enabled: true, targets: recordTypes.map(type => type.id), scope: "company",
  frequency: "daily", time: "08:00", timeZone: "Europe/Dublin", weekday: 1, monthDay: 1,
  overdueDays: 1, advanceDays: 7, owners: true, roleIds: [], channels: ["email", "inApp"],
  groupDigest: true, escalation: true, escalateAfter: 7, escalationRoleId: "role-2",
};
export const initialScheduledJobs: ScheduledJob[] = [
  { ...baseJob, id: "job-overdue", name: "Daily overdue check" },
  { ...baseJob, id: "job-fieldwork", name: "Daily equipment & risk reminders", kind: "upcoming", targets: ["risk.review", "inspection"], advanceDays: 7, escalation: false },
  { ...baseJob, id: "job-documents", name: "Document review reminders", kind: "upcoming", targets: ["document.review"], time: "08:30", advanceDays: 14, escalation: false },
  { ...baseJob, id: "job-audits", name: "Upcoming audits", kind: "upcoming", targets: ["audit"], frequency: "weekdays", time: "09:00", enabled: false, escalation: false },
  { ...baseJob, id: "job-escalation", name: "Overdue action escalation", targets: ["risk.task", "incident.action"], overdueDays: 7, time: "09:30", owners: false, roleIds: ["role-2"], escalation: false },
  { ...baseJob, id: "job-digest", name: "Weekly EHS overview", kind: "digest", frequency: "weekly", time: "09:00", owners: false, roleIds: ["role-1"], escalation: false },
];
export const initialJobRuns: JobRun[] = [
  { id: "run-1", jobId: "job-escalation", jobName: "Overdue action escalation", startedAt: "2026-10-01T08:30:00Z", timeZone: "Europe/Dublin", trigger: "Scheduled", outcome: "Completed", matched: 0, delivered: 0, escalated: 0, detail: "Sample run: no open actions met the seven-day overdue threshold. No reminders were needed." },
  { id: "run-2", jobId: "job-documents", jobName: "Document review reminders", startedAt: "2026-10-01T07:30:00Z", timeZone: "Europe/Dublin", trigger: "Scheduled", outcome: "Failed", matched: 1, delivered: 0, escalated: 0, detail: "Sample failure: the email provider was unavailable. No messages were delivered. A production job should retry delivery and report the result." },
  { id: "run-3", jobId: "job-overdue", jobName: "Daily overdue check", startedAt: "2026-10-01T07:00:00Z", timeZone: "Europe/Dublin", trigger: "Scheduled", outcome: "Completed", matched: 6, delivered: 3, escalated: 2, detail: "Sample run: six overdue items were grouped into owner digests. Two items also met the escalation threshold." },
  { id: "run-4", jobId: "job-digest", jobName: "Weekly EHS overview", startedAt: "2026-09-28T08:00:00Z", timeZone: "Europe/Dublin", trigger: "Scheduled", outcome: "Completed", matched: 8, delivered: 1, escalated: 0, detail: "Sample run: the weekly summary was prepared for the EHS Administrator role." },
];

const sampleItems: { id: string; title: string; kind: RecordKind; departmentId: string; ownerId: string; daysUntilDue: number; closed?: boolean }[] = [
  { id: "RA-1042", title: "Forklift movement review", kind: "risk.review", departmentId: "dep-3", ownerId: "user-2", daysUntilDue: -9 },
  { id: "RT-195", title: "Update machine guarding procedure", kind: "risk.task", departmentId: "dep-2", ownerId: "user-3", daysUntilDue: -4 },
  { id: "ACT-093", title: "Refresh loading bay markings", kind: "incident.action", departmentId: "dep-3", ownerId: "user-2", daysUntilDue: -2 },
  { id: "INC-261", title: "Loading bay near-miss investigation", kind: "incident.investigation", departmentId: "dep-3", ownerId: "user-2", daysUntilDue: -6 },
  { id: "DOC-118", title: "Emergency response procedure review", kind: "document.review", departmentId: "dep-4", ownerId: "user-1", daysUntilDue: -15 },
  { id: "LAW-031", title: "Compliance evaluation", kind: "law.evaluation", departmentId: "dep-1", ownerId: "user-1", daysUntilDue: -1 },
  { id: "AUD-087", title: "Internal safety audit", kind: "audit", departmentId: "dep-1", ownerId: "user-1", daysUntilDue: 5 },
  { id: "DOC-112", title: "Contractor induction review", kind: "document.review", departmentId: "dep-1", ownerId: "user-3", daysUntilDue: 12 },
  { id: "ACT-088", title: "Completed refresher training", kind: "incident.action", departmentId: "dep-2", ownerId: "user-3", daysUntilDue: -20, closed: true },
];

export function jobPreview(job: ScheduledJob, records: ImportRecords, fieldItems?: FieldDueItem[]): RunItem[] {
  const source = fieldItems ? [...sampleItems.filter(i => i.kind !== "risk.review" && i.kind !== "inspection"), ...fieldItems] : sampleItems;
  return source.filter(item => {
    if (("closed" in item && item.closed) || !job.targets.includes(item.kind)) return false;
    const department = records.departments.find(row => row.id === item.departmentId);
    const location = records.locations.find(row => row.id === department?.parentId);
    const site = records.sites.find(row => row.id === location?.parentId);
    const hierarchy = [`departments:${department?.id}`, `locations:${location?.id}`, `sites:${site?.id}`, `businessUnits:${site?.parentId}`];
    if (job.scope !== "company" && !hierarchy.includes(job.scope)) return false;
    if (job.kind === "overdue") return item.daysUntilDue <= -job.overdueDays;
    if (job.kind === "upcoming") return item.daysUntilDue >= 0 && item.daysUntilDue <= job.advanceDays;
    return true;
  }).map(item => {
    const department = records.departments.find(row => row.id === item.departmentId);
    const location = records.locations.find(row => row.id === department?.parentId);
    return { id: item.id, title: item.title, daysUntilDue: item.daysUntilDue, owner: records.users.find(user => user.id === item.ownerId)?.name || "Unassigned", site: records.sites.find(site => site.id === location?.parentId)?.name || "Unknown site" };
  });
}
function scheduleLabel(job: ScheduledJob) {
  const frequency = job.frequency === "daily" ? "Every day" : job.frequency === "weekdays" ? "Monday to Friday" : job.frequency === "weekly" ? `Every ${weekdays[job.weekday]}` : `Day ${job.monthDay} of each month`;
  return `${frequency} at ${job.time || "a time you choose"}`;
}
function cronExpression(job: ScheduledJob) {
  if (!/^\d{2}:\d{2}$/.test(job.time)) return "Choose a run time";
  const [hour, minute] = job.time.split(":").map(Number);
  return `${minute} ${hour} ${job.frequency === "monthly" ? job.monthDay : "*"} * ${job.frequency === "weekdays" ? "1-5" : job.frequency === "weekly" ? job.weekday : "*"}`;
}
function dueLabel(days: number) { return days < 0 ? `${-days} day${days === -1 ? "" : "s"} overdue` : days === 0 ? "Due today" : `Due in ${days} day${days === 1 ? "" : "s"}`; }
function formatRunTime(run: JobRun) { return new Intl.DateTimeFormat("en-IE", { dateStyle: "medium", timeStyle: "short", timeZone: run.timeZone }).format(new Date(run.startedAt)); }

export function ScheduledJobsPage({ records, jobs, setJobs, runs, setRuns, fieldItems }: {
  fieldItems?: FieldDueItem[]; records: ImportRecords; jobs: ScheduledJob[]; setJobs: Dispatch<SetStateAction<ScheduledJob[]>>;
  runs: JobRun[]; setRuns: Dispatch<SetStateAction<JobRun[]>>;
}) {
  const [view, setView] = useState<"jobs" | "history">("jobs");
  const [selectedId, setSelectedId] = useState<string | null>(jobs[0]?.id || null);
  const [draft, setDraft] = useState<ScheduledJob>(jobs[0] || { ...baseJob, id: "new-job", name: "" });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [runJobFilter, setRunJobFilter] = useState("");
  const [runOutcomeFilter, setRunOutcomeFilter] = useState("");
  const [openRunId, setOpenRunId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [showHelp, setShowHelp] = useState(false);
  const [testResult, setTestResult] = useState<JobRun | null>(null);
  const savedJob = jobs.find(job => job.id === selectedId);
  const isNew = !savedJob;
  const dirty = isNew || JSON.stringify(savedJob) !== JSON.stringify(draft);
  const scopes = useMemo(() => scopeOptions(records), [records]);
  const filteredJobs = useMemo(() => jobs.filter(job => job.name.toLowerCase().includes(query.trim().toLowerCase()) && (statusFilter === "all" || job.enabled === (statusFilter === "active"))), [jobs, query, statusFilter]);
  const filteredRuns = useMemo(() => runs.filter(run => (!runJobFilter || run.jobId === runJobFilter) && (!runOutcomeFilter || run.outcome === runOutcomeFilter)), [runs, runJobFilter, runOutcomeFilter]);
  const scopeName = scopes.find(scope => scope.value === draft.scope)?.label || "Choose a scope";
  const roleNames = draft.roleIds.map(id => records.roles.find(role => role.id === id)?.name).filter(Boolean);
  const patch = (update: Partial<ScheduledJob>) => { setDraft(current => ({ ...current, ...update })); setMessage(""); setError(""); setTestResult(null); };
  const switchJob = (job: ScheduledJob) => {
    if (dirty) { setError("Save or discard your changes before choosing another job."); return; }
    setSelectedId(job.id); setDraft(job); setError(""); setMessage(""); setTestResult(null);
  };
  const createJob = () => {
    if (dirty) { setError("Save or discard your changes before creating another job."); setView("jobs"); return; }
    setSelectedId(null); setDraft({ ...baseJob, id: `job-${crypto.randomUUID()}`, name: "", enabled: false }); setView("jobs"); setError(""); setMessage(""); setTestResult(null);
  };
  const saveJob = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft.name.trim()) { setError("Give this job a name."); return; }
    if (!draft.targets.length) { setError("Select at least one record type to check."); return; }
    if (!draft.channels.length) { setError("Select at least one notification channel."); return; }
    if (!draft.owners && !draft.roleIds.length) { setError("Choose assigned owners or at least one recipient role."); return; }
    if (draft.kind === "overdue" && draft.escalation && draft.escalateAfter < draft.overdueDays) { setError("Escalation must start on or after the first overdue reminder."); return; }
    const job = { ...draft, name: draft.name.trim() };
    setJobs(current => isNew ? [...current, job] : current.map(item => item.id === job.id ? job : item));
    setSelectedId(job.id); setDraft(job); setError(""); setMessage(`${job.name} saved in this demo workspace.`);
  };
  const discard = () => { const job = savedJob || jobs[0]; if (job) { setSelectedId(job.id); setDraft(job); } setError(""); setMessage(""); setTestResult(null); };
  const testJob = () => {
    if (!savedJob || dirty) return;
    const items = jobPreview(savedJob, records, fieldItems);
    const run: JobRun = { id: `run-${crypto.randomUUID()}`, jobId: savedJob.id, jobName: savedJob.name, startedAt: new Date().toISOString(), timeZone: savedJob.timeZone, trigger: "Test", outcome: "Completed", matched: items.length, delivered: 0, escalated: savedJob.kind === "overdue" && savedJob.escalation ? items.filter(item => -item.daysUntilDue >= savedJob.escalateAfter).length : 0, detail: "Test completed using live Risk / Inspection dates and sample records for other modules. Notification recipients were previewed; no email or in-app messages were sent.", items };
    setRuns(current => [run, ...current]); setTestResult(run); setMessage("");
  };

  return <>
    <div className="page-header"><div><div className="page-eyebrow">CONFIGURATION / AUTOMATION</div><h1>Scheduled jobs</h1><p>Keep reviews, actions and due dates moving with automatic checks and reminders.</p></div><button className="page-primary" onClick={createJob}><Plus size={16} /> Create job</button></div>
    <p className="field-note"><Info size={15}/>Risk reviews and inspections use the current workspace records, assigned responsible people and due dates. Other modules use illustrative data. These test runs preview recipients; production delivery needs a backend scheduler.</p>
    <div className="sj-intro"><span className="sj-intro-icon"><CalendarClock size={23} /></span><div><strong>A little automation. Fewer things missed.</strong><p>Set when a check runs, what it looks for and who hears about it. Each schedule belongs to your company workspace.</p></div><button aria-expanded={showHelp} onClick={() => setShowHelp(value => !value)}><Info size={16} /> How it works</button></div>
    {showHelp && <div className="sj-help"><strong>From schedule to reminder</strong><p>A cron job runs at the time you choose, checks open records in its organisation scope and prepares notifications for the selected people. An overdue check can also escalate older items to a manager role. The cron expression below is generated from your schedule; its time zone is configured separately.</p></div>}
    <div className="sj-stats"><div><span className="sj-stat-icon"><Clock3 size={19} /></span><strong>{jobs.filter(job => job.enabled).length}<small>Active schedules</small></strong><span>{jobs.filter(job => !job.enabled).length} paused</span></div><div><span className="sj-stat-icon"><History size={19} /></span><strong>{runs.length}<small>Recent runs</small></strong><span>Includes test previews</span></div><div><span className="sj-stat-icon attention"><AlertCircle size={19} /></span><strong>{runs.filter(run => run.outcome === "Failed").length}<small>Failed runs</small></strong><button onClick={() => { setRunOutcomeFilter("Failed"); setRunJobFilter(""); setView("history"); }}>View history <ArrowRight size={13} /></button></div></div>
    <div className="access-switch" role="tablist" aria-label="Scheduled jobs views"><button role="tab" aria-selected={view === "jobs"} className={view === "jobs" ? "active" : ""} onClick={() => setView("jobs")}><Clock3 size={16} /> Jobs <span>{jobs.length}</span>{dirty && <i aria-label="Unsaved job changes" />}</button><button role="tab" aria-selected={view === "history"} className={view === "history" ? "active" : ""} onClick={() => setView("history")}><History size={16} /> Run history <span>{runs.length}</span></button></div>
    <div className="sj-demo-note"><Info size={14} /> Demo preview: test runs use sample records and do not send notifications.</div>
    {view === "jobs" ? <div className="sj-layout">
      <aside className="sj-directory"><div className="sj-directory-head"><span className="page-eyebrow">YOUR SCHEDULES</span><span>{jobs.length} jobs</span></div><div className="sj-search"><Search size={15} /><input aria-label="Search scheduled jobs" placeholder="Search jobs" value={query} onChange={event => setQuery(event.target.value)} /></div><Select aria-label="Filter jobs by status" className="sj-status-filter" value={statusFilter} onChange={event => setStatusFilter(event.target.value)}><option value="all">All statuses</option><option value="active">Active only</option><option value="paused">Paused only</option></Select><div className="sj-job-list">{filteredJobs.map(job => <button key={job.id} className={selectedId === job.id ? "selected" : ""} onClick={() => switchJob(job)}><span className={`sj-job-icon ${job.enabled ? "" : "paused"}`}>{job.enabled ? <Clock3 size={17} /> : <Pause size={17} />}</span><span><strong>{job.name}</strong><small>{scheduleLabel(job)}</small><em className={`sj-badge ${job.enabled ? "active" : "paused"}`}>{job.enabled ? "Active" : "Paused"}</em></span><ChevronRight size={14} /></button>)}{!filteredJobs.length && <p className="sj-empty">No jobs match your filters.</p>}</div><div className="sj-directory-foot"><ShieldCheck size={15} /> Company workspace only</div></aside>
      <section className="sj-editor"><div className="sj-editor-head"><div><span className="page-eyebrow">{isNew ? "NEW SCHEDULE" : "JOB CONFIGURATION"}</span><h2>{isNew ? "Create a scheduled job" : savedJob?.name}</h2><p>{isNew ? "New jobs start paused. Activate the schedule when it is ready." : jobKinds.find(kind => kind.id === draft.kind)?.description}</p></div><button type="button" className={`sj-toggle ${draft.enabled ? "on" : ""}`} role="switch" aria-label="Job active" aria-checked={draft.enabled} onClick={() => patch({ enabled: !draft.enabled })}><span />{draft.enabled ? "Active" : "Paused"}</button></div>
        {error && <div className="sj-alert error" role="alert"><AlertCircle size={15} />{error}</div>}{message && <div className="sj-alert saved" role="status"><Check size={15} />{message}</div>}
        <form onSubmit={saveJob} className="sj-form">
          <section className="sj-section"><div className="sj-section-title"><span>01</span><div><h3>What should this job do?</h3><p>Choose the type of check and give it a clear name.</p></div></div><div className="sj-field-grid"><label>Job name<input value={draft.name} maxLength={80} required placeholder="e.g. Daily overdue check" onChange={event => patch({ name: event.target.value })} /></label><label>Job type<Select value={draft.kind} onChange={event => patch({ kind: event.target.value as JobKind, ...(event.target.value === "digest" ? { groupDigest: true } : {}) })}>{jobKinds.map(kind => <option key={kind.id} value={kind.id}>{kind.title}</option>)}</Select></label></div></section>
          <section className="sj-section"><div className="sj-section-title"><span>02</span><div><h3>When should it run?</h3><p>Use the time zone where this schedule should apply.</p></div></div><div className="sj-field-grid three"><label>Frequency<Select value={draft.frequency} onChange={event => patch({ frequency: event.target.value as Frequency })}><option value="daily">Every day</option><option value="weekdays">Weekdays</option><option value="weekly">Weekly</option><option value="monthly">Monthly</option></Select></label><label>Run at<input type="time" required value={draft.time} onInput={event => patch({ time: event.currentTarget.value })} onChange={event => patch({ time: event.target.value })} /></label><label>Time zone<Select value={draft.timeZone} onChange={event => patch({ timeZone: event.target.value })}>{timeZones.map(zone => <option key={zone}>{zone}</option>)}</Select></label></div>{draft.frequency === "weekly" && <label className="sj-extra-field">Day of week<Select value={draft.weekday} onChange={event => patch({ weekday: Number(event.target.value) })}>{weekdays.map((day, index) => <option key={day} value={index}>{day}</option>)}</Select></label>}{draft.frequency === "monthly" && <label className="sj-extra-field">Day of month<Select value={draft.monthDay} onChange={event => patch({ monthDay: Number(event.target.value) })}>{Array.from({ length: 28 }, (_, index) => <option key={index + 1}>{index + 1}</option>)}</Select><small>Days 1–28 are available so the job can run every month.</small></label>}<div className="sj-schedule-preview"><CalendarClock size={19} /><div><strong>{scheduleLabel(draft)}</strong><span>{draft.timeZone} · {draft.timeZone === "UTC" ? "fixed UTC time" : "local time, including daylight saving changes"}</span></div><span className={`sj-badge ${draft.enabled ? "active" : "paused"}`}>{draft.enabled ? "Active" : "Paused"}</span></div><details className="sj-cron"><summary>Advanced · cron expression</summary><div><code>{cronExpression(draft)}</code><span>Minute · Hour · Day · Month · Weekday</span><p>The expression runs in {draft.timeZone}. This is generated from the controls above.</p></div></details></section>
          <section className="sj-section"><div className="sj-section-title"><span>03</span><div><h3>Which records should it check?</h3><p>Only open records within the selected scope are included.</p></div></div><div className="sj-field-grid"><label>Organisation scope<Select value={draft.scope} onChange={event => patch({ scope: event.target.value })}>{scopes.map(scope => <option key={scope.value} value={scope.value}>{scope.label}</option>)}</Select></label>{draft.kind === "overdue" ? <label>Remind after this many days overdue<input type="number" required min={1} max={365} value={draft.overdueDays} onChange={event => patch({ overdueDays: Number(event.target.value) })} /></label> : draft.kind === "upcoming" ? <label>Due within the next (days)<input type="number" required min={1} max={365} value={draft.advanceDays} onChange={event => patch({ advanceDays: Number(event.target.value) })} /></label> : <div className="sj-inline-help"><Info size={15} /> Includes all open work and highlights its due dates.</div>}</div><div className="sj-targets">{recordTypes.map(type => <label key={type.id} className={draft.targets.includes(type.id) ? "checked" : ""}><input type="checkbox" checked={draft.targets.includes(type.id)} onChange={() => patch({ targets: draft.targets.includes(type.id) ? draft.targets.filter(id => id !== type.id) : [...draft.targets, type.id] })} /><span><strong>{type.label}</strong><small>{type.module}</small></span></label>)}</div></section>
          <section className="sj-section"><div className="sj-section-title"><span>04</span><div><h3>Who should be notified?</h3><p>Recipients receive only records they are authorised to access.</p></div></div><label className="sj-owner-option"><input type="checkbox" checked={draft.owners} onChange={event => patch({ owners: event.target.checked })} /><span><strong>Assigned record owners</strong><small>Send each owner the items that need their attention.</small></span></label><fieldset className="sj-role-recipients"><legend>Also notify people with these roles in the selected scope</legend>{records.roles.map(role => <label key={role.id}><input type="checkbox" checked={draft.roleIds.includes(role.id)} onChange={() => patch({ roleIds: draft.roleIds.includes(role.id) ? draft.roleIds.filter(id => id !== role.id) : [...draft.roleIds, role.id] })} />{role.name}</label>)}</fieldset><div className="sj-delivery"><fieldset><legend>Channels</legend><label><input type="checkbox" checked={draft.channels.includes("email")} onChange={() => patch({ channels: draft.channels.includes("email") ? draft.channels.filter(channel => channel !== "email") : [...draft.channels, "email"] })} /><Mail size={15} />Email</label><label><input type="checkbox" checked={draft.channels.includes("inApp")} onChange={() => patch({ channels: draft.channels.includes("inApp") ? draft.channels.filter(channel => channel !== "inApp") : [...draft.channels, "inApp"] })} /><Bell size={15} />In-app</label></fieldset><label>Delivery style<Select disabled={draft.kind === "digest"} value={draft.groupDigest ? "digest" : "individual"} onChange={event => patch({ groupDigest: event.target.value === "digest" })}><option value="digest">One digest per recipient</option><option value="individual">One message per record</option></Select></label></div>{draft.kind === "overdue" && <div className="sj-escalation"><label className="sj-owner-option"><input type="checkbox" checked={draft.escalation} onChange={event => patch({ escalation: event.target.checked })} /><span><strong>Escalate persistent overdue work</strong><small>Include a responsible manager role when items stay overdue.</small></span></label>{draft.escalation && <div className="sj-field-grid"><label>Escalate after (days overdue)<input type="number" required min={draft.overdueDays} max={365} value={draft.escalateAfter} onChange={event => patch({ escalateAfter: Number(event.target.value) })} /></label><label>Escalation role<Select required value={draft.escalationRoleId} onChange={event => patch({ escalationRoleId: event.target.value })}><option value="">Choose a role</option>{records.roles.map(role => <option key={role.id} value={role.id}>{role.name}</option>)}</Select></label></div>}</div>}</section>
          <section className="sj-summary"><Settings2 size={19} /><div><strong>Your automation at a glance</strong><p>{scheduleLabel(draft)} in {draft.timeZone}, check <b>{draft.targets.length} record type{draft.targets.length === 1 ? "" : "s"}</b> in <b>{scopeName}</b>. {draft.kind === "overdue" ? `Include items at least ${draft.overdueDays} day${draft.overdueDays === 1 ? "" : "s"} overdue.` : draft.kind === "upcoming" ? `Include items due within ${draft.advanceDays} days.` : "Summarise all open work."}</p><p>Notify {[draft.owners ? "assigned owners" : "", ...roleNames].filter(Boolean).join(" and ") || "no recipients yet"} via {draft.channels.map(channel => channel === "email" ? "email" : "in-app").join(" and ") || "no channels yet"}.</p>{draft.kind === "overdue" && draft.escalation && <p>Escalate after {draft.escalateAfter} days to {records.roles.find(role => role.id === draft.escalationRoleId)?.name || "a role you choose"}.</p>}</div></section>
          <div className="sj-editor-actions"><button type="button" className="sj-test-button" disabled={isNew || dirty} title={isNew || dirty ? "Save this job before testing its rules" : "Preview matching records without sending notifications"} onClick={testJob}><Play size={15} /> Test job</button><div>{dirty && <button type="button" className="sj-discard" onClick={discard}>Discard</button>}<button type="submit" className="sj-save" disabled={!dirty}><Save size={15} /> {isNew ? "Save job" : "Save changes"}</button></div></div>
        </form>
        {testResult && <section className="sj-test-result" aria-live="polite"><div className="sj-test-result-head"><span><Check size={17} /><strong>Test complete</strong></span><button aria-label="Close test result" onClick={() => setTestResult(null)}><X size={15} /></button></div><p><b>{testResult.matched} sample item{testResult.matched === 1 ? "" : "s"}</b> {testResult.matched === 1 ? "matches" : "match"} this job.{testResult.escalated > 0 && ` ${testResult.escalated} would also be escalated.`} No notifications were sent.</p><div className="sj-preview-items">{testResult.items?.map(item => <div key={item.id}><span><strong>{item.title}</strong><small>{item.id} · {item.site} · {item.owner}</small></span><em className={item.daysUntilDue < 0 ? "overdue" : ""}>{dueLabel(item.daysUntilDue)}</em></div>)}{!testResult.matched && <p>No sample records meet this job's scope and rules.</p>}</div><button className="sj-history-link" onClick={() => { setRunJobFilter(testResult.jobId); setRunOutcomeFilter(""); setView("history"); }}>View this job's run history <ArrowRight size={14} /></button></section>}
      </section>
    </div> : <section className="sj-history-card"><div className="sj-history-head"><div><span className="page-eyebrow">EXECUTION LOG</span><h2>Run history</h2><p>Sample scheduled runs and the test previews you perform in this workspace.</p></div><span>{filteredRuns.length} run{filteredRuns.length === 1 ? "" : "s"}</span></div><div className="sj-history-filters"><label>Job<Select value={runJobFilter} onChange={event => setRunJobFilter(event.target.value)}><option value="">All jobs</option>{jobs.map(job => <option key={job.id} value={job.id}>{job.name}</option>)}</Select></label><label>Outcome<Select value={runOutcomeFilter} onChange={event => setRunOutcomeFilter(event.target.value)}><option value="">All outcomes</option><option>Completed</option><option>Failed</option></Select></label></div><div className="sj-run-table-wrap"><table className="sj-run-table"><thead><tr><th>Job</th><th>Started</th><th>Outcome</th><th>Items</th><th>Delivery</th><th><span className="sj-visually-hidden">Details</span></th></tr></thead><tbody>{filteredRuns.map(run => <Fragment key={run.id}><tr><td><strong>{run.jobName}</strong><small>{run.trigger === "Test" ? "Test preview" : "Sample scheduled run"}</small></td><td>{formatRunTime(run)}<small>{run.timeZone}</small></td><td><span className={`sj-badge ${run.outcome === "Failed" ? "failed" : "active"}`}>{run.outcome}</span></td><td><span className="sj-mobile-label">Items: </span>{run.matched}</td><td>{run.trigger === "Test" ? "Preview only" : `${run.delivered} messages`}</td><td><button aria-expanded={openRunId === run.id} aria-label={`View result of ${run.jobName} ${formatRunTime(run)}`} onClick={() => setOpenRunId(openRunId === run.id ? null : run.id)}>Details <ChevronRight size={13} /></button></td></tr>{openRunId === run.id && <tr className="sj-run-detail"><td colSpan={6}><div><Info size={16} /><p>{run.detail}</p></div>{run.items?.length ? <ul>{run.items.map(item => <li key={item.id}>{item.id} · {item.title} · {dueLabel(item.daysUntilDue)}</li>)}</ul> : null}</td></tr>}</Fragment>)}{!filteredRuns.length && <tr><td colSpan={6} className="sj-empty">No runs match these filters.</td></tr>}</tbody></table></div></section>}
    <p className="context-note"><ShieldCheck size={16} /> Schedules and history are stored in this demo session. Background scheduling, notification delivery and server permissions are not connected yet.</p>
  </>;
}
