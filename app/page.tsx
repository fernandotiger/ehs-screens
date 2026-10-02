"use client";

import { DueReminderPanel, QrScanner } from "./field-access";
import { fieldDueItems, fieldReminders, parseQr, qrUrl, resolveQrInspection, type QrTarget } from "./field-access-model";
import { Select } from "./select";

import Image from "next/image";
import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { applyImport, inspectImportCsv, TEMPLATE_CSV, type ImportEntityKey, type ImportItem, type ImportRecord, type ImportRecords, type ImportReview } from "./bulk-import";
import { RolesPermissionsPage } from "./access-pages";
import { FormBuilderPage, initialForms, type FormBlueprint } from "./form-builder";
import { LawModule } from "./law-pages";
import { initialLawData, complianceSummary, type LawData } from "./law-model";
import { InspectionModule } from "./inspection-pages";
import { initialInspectionData, type InspectionData } from "./inspection-model";
import { AuditModule } from "./audit-pages";
import { initialAuditData, type AuditData } from "./audit-model";
import { IncidentModule } from "./incident-pages";
import { initialIncidentData, type IncidentData } from "./incident-model";
import { RiskModule } from "./risk-pages";
import { initialRiskData, type RiskData } from "./risk-model";
import { ScheduledJobsPage, initialScheduledJobs, initialJobRuns, type ScheduledJob, type JobRun } from "./scheduled-jobs";
import { importedRolePermissions, initialRoleAssignments, initialRolePermissions, scopeOptions, scopeLabel, type RoleAssignment, type RolePermissions } from "./access-model";
import {
  ArrowLeft, ArrowRight, Bell, Building2, Check, ChevronDown,
  ChevronRight, CircleHelp, ClipboardList, ClipboardCheck, FileText, Fingerprint, FolderOpen,
  Home, Info, LockKeyhole, Mail, Menu, MoreHorizontal,
  ScanLine, Plus, Search, Settings2, ShieldCheck, Sparkles, Upload, Users, X, Scale,
  PlayCircle, Bot, ListChecks, Filter, Download, AlertCircle, ChartNoAxesCombined,
} from "lucide-react";

type Screen = "invite" | "login" | "app";
type EntityKey = ImportEntityKey;
type Row = ImportRecord;
type Records = ImportRecords;
type NavItem = { id: string; label: string; icon?: typeof Home };
type NavGroup = { id: string; label: string; icon: typeof Home; items: NavItem[] };

const DEMO_CODE = "482916";
const DEMO_EMAIL = "admin@northstar.example";
const DEMO_PASSWORD = "Demo123!";

const navigation: NavGroup[] = [
  { id: "risk", label: "Risk", icon: ShieldCheck, items: [
    { id: "risk.overview", label: "Overview" },
    { id: "risk.assessments", label: "Risk assessments" },
    { id: "risk.objectives", label: "Objectives" },
    { id: "risk.targets", label: "Targets" },
    { id: "risk.programmes", label: "Management programmes" },
    { id: "risk.matrix", label: "Risk matrix" },
    { id: "risk.tasks", label: "Tasks" },
    { id: "risk.reports", label: "Reports" },
  ] },
  { id: "incident", label: "Incident", icon: Fingerprint, items: [
    { id: "incident.overview", label: "Overview" },
    { id: "incident.incidents", label: "Incidents" },
    { id: "incident.investigations", label: "Investigations" },
    { id: "incident.actions", label: "Actions" },
    { id: "incident.tasks", label: "Tasks" },
    { id: "incident.trends", label: "Trends & prevention" },
    { id: "incident.reports", label: "Reports" },
    { id: "incident.settings", label: "Settings" },
  ] },
  { id: "audit", label: "Audit", icon: ClipboardCheck, items: [
    { id: "audit.overview", label: "Overview" },
    { id: "audit.plans", label: "Audit plans" },
    { id: "audit.programmes", label: "Programmes" },
    { id: "audit.audits", label: "Audits" },
    { id: "audit.findings", label: "Findings & audit trail" },
    { id: "audit.recurring", label: "Recurring schedules" },
    { id: "audit.templates", label: "Templates" },
    { id: "audit.reports", label: "Reports" },
    { id: "audit.settings", label: "Settings" },
  ] },
  { id: "inspection", label: "Inspection", icon: ClipboardList, items: [
    { id: "inspection.overview", label: "Overview" },
    { id: "inspection.inspections", label: "Inspections" },
    { id: "inspection.findings", label: "Findings" },
    { id: "inspection.templates", label: "Templates" },
    { id: "inspection.reports", label: "Reports" },
  ] },
  { id: "document", label: "Document", icon: FolderOpen, items: [
    { id: "document.documents", label: "Search documents" },
    { id: "document.reviews", label: "Search reviews" },
  ] },
  { id: "law", label: "Law", icon: Scale, items: [
    { id: "law.overview", label: "Overview" },
    { id: "law.profiles", label: "Legal profiles" },
    { id: "law.legislation", label: "Legislation" },
    { id: "law.checklists", label: "Compliance checklists" },
    { id: "law.tasks", label: "Tasks" },
    { id: "law.updates", label: "Changes & updates" },
    { id: "law.other", label: "Other requirements" },
    { id: "law.reports", label: "Reports" },
  ] },
  { id: "configuration", label: "Configuration", icon: Settings2, items: [
    { id: "config.businessUnits", label: "Business units" },
    { id: "config.sites", label: "Sites" },
    { id: "config.locations", label: "Locations" },
    { id: "config.departments", label: "Departments" },
    { id: "config.bulkImport", label: "Bulk import" },
    { id: "config.users", label: "Users" },
    { id: "config.roles", label: "Roles & permissions" },
    { id: "config.forms", label: "Form Builder" },
    { id: "config.templates", label: "Templates" },
    { id: "config.categories", label: "Categories" },
    { id: "config.jobs", label: "Scheduled jobs" },
    { id: "config.branding", label: "Branding" },
    { id: "config.subscription", label: "Subscription" },
    /*{ id: "config.identity", label: "Identity & SSO" },*/
    { id: "config.help", label: "Help videos & AI" },
  ] },
];

const initialRecords: Records = {
  businessUnits: [
    { id: "bu-1", name: "Operations", detail: "2 sites" },
    { id: "bu-2", name: "Corporate", detail: "1 site" },
  ],
  sites: [
    { id: "site-1", name: "Dublin Plant", parentId: "bu-1", detail: "Dublin, Ireland" },
    { id: "site-2", name: "Cork Distribution", parentId: "bu-1", detail: "Cork, Ireland" },
    { id: "site-3", name: "Head Office", parentId: "bu-2", detail: "Dublin, Ireland" },
  ],
  locations: [
    { id: "loc-1", name: "Production Floor", parentId: "site-1", detail: "Operational area" },
    { id: "loc-2", name: "Warehouse", parentId: "site-2", detail: "Storage area" },
    { id: "loc-3", name: "Main Office", parentId: "site-3", detail: "Office area" },
  ],
  departments: [
    { id: "dep-1", name: "EHS Team", parentId: "loc-1", detail: "12 members" },
    { id: "dep-2", name: "Maintenance", parentId: "loc-1", detail: "24 members" },
    { id: "dep-3", name: "Logistics", parentId: "loc-2", detail: "18 members" },
    { id: "dep-4", name: "People & Culture", parentId: "loc-3", detail: "8 members" },
  ],
  roles: [
    { id: "role-1", name: "EHS Administrator", detail: "All modules · Manage configuration" },
    { id: "role-2", name: "Site Manager", detail: "Risk, Incident, Audit · Site scope" },
    { id: "role-3", name: "Employee", detail: "Report incidents · Read documents" },
    { id: "role-4", name: "Auditor", detail: "Conduct audits · Record findings" },
    { id: "role-5", name: "Form Designer", detail: "Design draft forms · No publish access" },
  ],
  users: [
    { id: "user-1", name: "Alex Morgan", parentId: "role-1", detail: "admin@northstar.example" },
    { id: "user-2", name: "Sam O'Brien", parentId: "role-2", detail: "sam@northstar.example" },
    { id: "user-3", name: "Priya Shah", parentId: "role-3", detail: "priya@northstar.example" },
  ],
  templates: [
    { id: "template-1", name: "General risk assessment", detail: "Risk · Active" },
    { id: "template-2", name: "Incident investigation", detail: "Incident · Active" },
  ],
  categories: [
    { id: "category-1", name: "Policies", detail: "Document" },
    { id: "category-2", name: "Procedures", detail: "Document" },
  ],
};

const entityInfo: Record<EntityKey, { title: string; singular: string; description: string; parent?: EntityKey; parentLabel?: string }> = {
  businessUnits: { title: "Business units", singular: "business unit", description: "The top level of your company structure." },
  sites: { title: "Sites", singular: "site", description: "Each site belongs to one business unit.", parent: "businessUnits", parentLabel: "Business unit" },
  locations: { title: "Locations", singular: "location", description: "Each location belongs to one site.", parent: "sites", parentLabel: "Site" },
  departments: { title: "Departments", singular: "department", description: "Each department belongs to one location.", parent: "locations", parentLabel: "Location" },
  roles: { title: "Roles & permissions", singular: "role", description: "Define what people can see and do across modules and sites." },
  users: { title: "Users", singular: "user", description: "Invite people and give them one or more scoped role assignments.", parent: "roles", parentLabel: "Role" },
  templates: { title: "Templates", singular: "template", description: "Reusable starting points for assessments, audits and reports." },
  categories: { title: "Categories", singular: "category", description: "Keep documents and records organised." },
};

const searchExamples: Record<string, { description: string; rows: { id: string; title: string; site: string; status: string; updated: string }[] }> = {
  "risk.assessments": { description: "Find and review risk assessments across your sites.", rows: [
    { id: "RA-1042", title: "Forklift movement in warehouse", site: "Cork Distribution", status: "In review", updated: "28 Sep 2026" },
    { id: "RA-1038", title: "Machine guarding inspection", site: "Dublin Plant", status: "Approved", updated: "25 Sep 2026" },
    { id: "RA-1027", title: "Working at height", site: "Dublin Plant", status: "Draft", updated: "21 Sep 2026" },
  ] },
  "risk.tasks": { description: "Track actions assigned from risk assessments.", rows: [
    { id: "RT-208", title: "Install pedestrian barrier", site: "Cork Distribution", status: "Open", updated: "29 Sep 2026" },
    { id: "RT-195", title: "Update machine guarding procedure", site: "Dublin Plant", status: "In progress", updated: "26 Sep 2026" },
  ] },
  "incident.incidents": { description: "Search reported incidents and investigations.", rows: [
    { id: "INC-261", title: "Near miss at loading bay", site: "Cork Distribution", status: "Investigating", updated: "29 Sep 2026" },
    { id: "INC-255", title: "First aid event", site: "Dublin Plant", status: "Closed", updated: "23 Sep 2026" },
  ] },
  "incident.actions": { description: "Follow corrective and preventive actions through to completion.", rows: [
    { id: "ACT-093", title: "Refresh loading bay markings", site: "Cork Distribution", status: "Open", updated: "30 Sep 2026" },
    { id: "ACT-088", title: "Run refresher training", site: "Dublin Plant", status: "In progress", updated: "27 Sep 2026" },
  ] },
  "audit.audits": { description: "Find audit plans, completed audits and upcoming work.", rows: [
    { id: "AUD-087", title: "ISO 45001 internal audit", site: "Dublin Plant", status: "Scheduled", updated: "18 Sep 2026" },
    { id: "AUD-082", title: "Warehouse safety walk", site: "Cork Distribution", status: "Completed", updated: "13 Sep 2026" },
  ] },
  "audit.findings": { description: "Monitor audit findings and their follow-up actions.", rows: [
    { id: "FND-042", title: "Inspection frequency gap", site: "Dublin Plant", status: "Open", updated: "24 Sep 2026" },
  ] },
  "document.documents": { description: "Find policies, procedures and controlled documents.", rows: [
    { id: "DOC-118", title: "Emergency response procedure", site: "All sites", status: "Published", updated: "22 Sep 2026" },
    { id: "DOC-112", title: "Contractor induction", site: "Dublin Plant", status: "In review", updated: "19 Sep 2026" },
  ] },
  "document.reviews": { description: "Find documents due for review and approval.", rows: [
    { id: "REV-031", title: "PPE policy annual review", site: "All sites", status: "Due soon", updated: "20 Sep 2026" },
  ] },
  "law.requirements": { description: "Search legal obligations relevant to your organisation.", rows: [
    { id: "LAW-072", title: "Workplace safety requirements", site: "All sites", status: "Relevant", updated: "17 Sep 2026" },
    { id: "LAW-064", title: "Waste handling obligations", site: "Dublin Plant", status: "Relevant", updated: "12 Sep 2026" },
  ] },
  "law.evaluations": { description: "Review compliance evaluations and evidence.", rows: [
    { id: "EVC-028", title: "Fire safety compliance check", site: "Head Office", status: "Complete", updated: "18 Sep 2026" },
  ] },
};

function BrandLogo({ compact = false }: { compact?: boolean }) {
  return <span className={`brand-logo ${compact ? "compact" : ""}`}><Image src="/oleoq-logo.png" width={2172} height={724} alt="OleoQ" priority /></span>;
}

function AuthShell({ children, phase }: { children: ReactNode; phase: "invite" | "login" }) {
  return <main className="auth-shell">
    <aside className="auth-story">
      <header className="story-header"><BrandLogo /><span><span className="live-dot" /> CLIENT ACCESS</span></header>
      <div className="story-body">
        <div className="story-eyebrow"><span /> THE NEXT CHAPTER OF EHS</div>
        <h1>Your people.<br />Your places.<br /><em>One clearer picture.</em></h1>
        <p>Bring every part of your environment, health and safety programme together in a workspace built around the way your organisation works.</p>
      </div>
      <div className="story-art" aria-hidden="true">
        <div className="art-orbit outer" /><div className="art-orbit inner" />
        <div className="art-card">
          <div className="art-card-head"><span className="art-monogram">N<span>.</span></span><span className="art-live"><span /> LIVE WORKSPACE</span></div>
          <strong>Northstar Manufacturing</strong><small>Your EHS overview</small>
          <div className="art-metrics"><div><Building2 size={16} /><b>03</b><small>Sites</small></div><div><ShieldCheck size={16} /><b>98%</b><small>Compliance</small></div><div><ListChecks size={16} /><b>12</b><small>Open actions</small></div></div>
          <div className="art-bars">{[28,41,36,52,47,68,61,76,70,86,80,96].map((height,index) => <span key={index} style={{height:`${height}%`}} />)}</div>
        </div>
        <div className="art-float"><span><Check size={15} /></span><div><strong>Everything connected</strong><small>Across teams and sites</small></div></div>
      </div>
      <footer className="story-footer"><span>Built for the work that matters.</span><span>© 2026 OleoQ</span></footer>
    </aside>
    <section className="auth-panel">
      <header className="auth-panel-header"><div className="auth-mobile-logo"><BrandLogo compact /></div><span>{phase === "invite" ? "A new beginning for better EHS" : "Your OleoQ workspace"}</span></header>
      <div className="auth-content">{children}</div>
      <footer className="auth-panel-footer"><span><LockKeyhole size={14} /> Your workspace, your data.</span><span><CircleHelp size={15} /> Need help?</span></footer>
    </section>
  </main>;
}

export default function Page() {
  const [screen, setScreen] = useState<Screen>("invite");
  useEffect(() => { if(new URLSearchParams(window.location.search).has("qr")) setScreen("login"); }, []);
  const [code, setCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [resend, setResend] = useState(false);
  const [email, setEmail] = useState(DEMO_EMAIL);
  const [editingEmail, setEditingEmail] = useState(false);
  const [loginEmail, setLoginEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const digits = useRef<Array<HTMLInputElement | null>>([]);

  const setDigit = (index: number, raw: string) => {
    const value = raw.replace(/\D/g, "");
    if (value.length > 1) {
      setCode(value.slice(0, 6));
      digits.current[Math.min(value.length, 5)]?.focus();
      return;
    }
    const next = code.padEnd(6, " ").split("");
    next[index] = value || " ";
    setCode(next.join("").trimEnd());
    setCodeError("");
    if (value && index < 5) digits.current[index + 1]?.focus();
  };

  const keyDigit = (index: number, event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Backspace" && !code[index] && index > 0) digits.current[index - 1]?.focus();
    if (event.key === "ArrowLeft" && index > 0) digits.current[index - 1]?.focus();
    if (event.key === "ArrowRight" && index < 5) digits.current[index + 1]?.focus();
  };

  const verifyCode = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (code !== DEMO_CODE) {
      setCodeError(code.length < 6 ? "Enter all six digits." : "That code doesn't match the demo invitation. Try 482916.");
      return;
    }
    setScreen("login");
  };

  const signIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (loginEmail.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      setLoginError("Use the presentation credentials shown below to enter the demo workspace.");
      return;
    }
    setLoginError("");
    setScreen("app");
  };

  if (screen === "app") return <WorkspaceApp onSignOut={() => { setPassword(""); setScreen("login"); }} />;

  if (screen === "login") return <AuthShell phase="login">
    {typeof window !== "undefined" && new URLSearchParams(window.location.search).has("qr") && <p className="demo-callout">Sign in to open the scanned equipment record.</p>}
    <div className="auth-step"><button className="auth-back" type="button" onClick={() => setScreen("invite")}><ArrowLeft size={15} /> Back to invitation</button><span>02 / 02</span></div>
    <div className="auth-progress"><span /></div>
    <div className="auth-form-body">
      <span className="auth-icon"><LockKeyhole size={25} /></span>
      <div className="section-kicker">{typeof window !== "undefined" && new URLSearchParams(window.location.search).has("qr") ? "FIELD ACCESS" : "INVITATION VERIFIED"}</div>
      <h2>Welcome to <i>OleoQ.</i></h2>
      <p className="auth-intro">Sign in as your company administrator to open the workspace.</p>
      <form className="auth-form" onSubmit={signIn}>
        <label>Work email<input type="email" autoComplete="username" value={loginEmail} onChange={event => { setLoginEmail(event.target.value); setLoginError(""); }} required /></label>
        <label>Password<input type="password" autoComplete="current-password" value={password} onChange={event => { setPassword(event.target.value); setLoginError(""); }} placeholder="Enter your password" required /></label>
        {loginError && <p className="form-error" role="alert">{loginError}</p>}
        <button className="auth-primary" type="submit">Sign in to workspace <ArrowRight size={18} /></button>
      </form>
      <div className="demo-callout"><Sparkles size={17} /><span>Presentation login: <strong>{DEMO_EMAIL}</strong> / <strong>{DEMO_PASSWORD}</strong></span></div>
    </div>
  </AuthShell>;

  return <AuthShell phase="invite">
    <div className="auth-step"><span>GETTING STARTED</span><span>01 / 02</span></div>
    <div className="auth-progress"><span style={{width:"50%"}} /></div>
    <div className="auth-form-body">
      <span className="auth-icon"><Mail size={25} /></span>
      <div className="section-kicker">YOU'RE INVITED</div>
      <h2>Let's make it <i>official.</i></h2>
      <p className="auth-intro">Enter the 6-digit code from your invitation email to access your company workspace.</p>
      <div className="email-note"><span className="email-note-icon"><Mail size={17} /></span><div><small>CODE SENT TO</small>{editingEmail ? <input autoFocus type="email" aria-label="Invitation email" value={email} onChange={event => setEmail(event.target.value)} onBlur={() => setEditingEmail(false)} onKeyDown={event => { if(event.key === "Enter") setEditingEmail(false); }} /> : <strong>{email}</strong>}</div><button type="button" onClick={() => setEditingEmail(!editingEmail)}>{editingEmail ? "Done" : "Change"}</button></div>
      <form onSubmit={verifyCode}>
        <label className="code-label" htmlFor="code-0">Invitation code <button type="button" title="The code confirms your invitation. In the live app it will expire after a short time." aria-label="About invitation codes"><Info size={15} /></button></label>
        <div className="code-grid" onPaste={event => { event.preventDefault(); const value = event.clipboardData.getData("text").replace(/\D/g, "").slice(0,6); setCode(value); digits.current[Math.min(value.length,5)]?.focus(); }}>
          {Array.from({length:6},(_,index) => <input key={index} id={`code-${index}`} ref={element => { digits.current[index] = element; }} inputMode="numeric" autoComplete={index === 0 ? "one-time-code" : "off"} aria-label={`Code digit ${index+1}`} maxLength={6} value={code[index] || ""} onChange={event => setDigit(index,event.target.value)} onKeyDown={event => keyDigit(index,event)} className={codeError ? "error" : ""} />)}
        </div>
        {codeError && <p className="form-error" role="alert">{codeError}</p>}
        <button className="auth-primary" type="submit">Verify & continue <ArrowRight size={18} /></button>
      </form>
      <div className="resend-line">Didn't get the email? <button type="button" onClick={() => setResend(true)}>Resend code</button></div>
      {resend && <p className="resend-message" role="status">Demo only: a new code would be sent to your inbox.</p>}
      <div className="demo-callout"><Sparkles size={17} /><span>Presentation mode: use <button type="button" onClick={() => { setCode(DEMO_CODE); setCodeError(""); }}>482916</button> to explore this concept.</span></div>
    </div>
  </AuthShell>;
}

function WorkspaceApp({ onSignOut }: { onSignOut: () => void }) {
  const [active, setActive] = useState("home");
  const [scannerOpen, setScannerOpen] = useState(false);
  const [remindersOpen, setRemindersOpen] = useState(false);
  const [, tickReminders] = useState(0);
  useEffect(() => { const timer = setInterval(() => tickReminders(t => t + 1), 60000); return () => clearInterval(timer); }, []);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [records, setRecords] = useState<Records>(initialRecords);
  const [rolePermissions, setRolePermissions] = useState<RolePermissions>(initialRolePermissions);
  const [roleAssignments, setRoleAssignments] = useState<RoleAssignment[]>(initialRoleAssignments);
  const [forms, setForms] = useState<FormBlueprint[]>(initialForms);
  const [navigationVersion, setNavigationVersion] = useState(0);
  const [lawData, setLawData] = useState<LawData>(initialLawData);
  const [lawProfileId, setLawProfileId] = useState("LP-001");
  const [requestedLaw, setRequestedLaw] = useState<{profileId:string;checklistId:string;key:number}>();
  const [requestedRisk, setRequestedRisk] = useState<{id:string;key:number;fromQr?:boolean}>();
  const [inspectionData, setInspectionData] = useState<InspectionData>(() => initialInspectionData(initialForms));
  const [requestedInspection, setRequestedInspection] = useState<{id:string;fieldId?:string;key:number}>();
  const [auditData, setAuditData] = useState<AuditData>(() => initialAuditData(initialForms));
  const [requestedIncident, setRequestedIncident] = useState<{kind:"incident"|"action";id:string;key:number}>();
  const [requestedAudit, setRequestedAudit] = useState<{id:string;key:number}>();
  const [incidentData, setIncidentData] = useState<IncidentData>(() => initialIncidentData(initialForms));
  const [riskData, setRiskData] = useState<RiskData>(() => initialRiskData(initialForms));
  const [scheduledJobs, setScheduledJobs] = useState<ScheduledJob[]>(initialScheduledJobs);
  const [jobRuns, setJobRuns] = useState<JobRun[]>(initialJobRuns);
  const [createKey, setCreateKey] = useState<EntityKey | null>(null);
  const [newName, setNewName] = useState("");
  const [newParent, setNewParent] = useState("");
  const [newScope, setNewScope] = useState("");
  const [newDetail, setNewDetail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [siteFilter, setSiteFilter] = useState("All sites");
  const [colors, setColors] = useState({ primary: "#00263e", secondary: "#597abd", tertiary: "#9edbde" });
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [notice, setNotice] = useState("");

  const select = (id: string) => { setNavigationVersion(v => v + 1); setRequestedIncident(undefined); setRequestedAudit(undefined); setRequestedLaw(undefined); setRequestedRisk(undefined); setRequestedInspection(undefined); setActive(id); setSearchTerm(""); setDrawerOpen(false); setNotice(""); };
  const openInspection = (id:string,fieldId?:string) => { select("inspection.inspections"); setRequestedInspection({id,fieldId,key:Date.now()}); setExpanded("inspection"); };
  const openLaw = (profileId:string,checklistId:string) => { select("law.checklists"); setLawProfileId(profileId); setRequestedLaw({profileId,checklistId,key:Date.now()}); setExpanded("law"); };
  const dueItems = fieldDueItems(riskData, inspectionData);
  const reminders = fieldReminders(dueItems, scheduledJobs, records);
  const openQr = (target:QrTarget):boolean => {
    if(target.kind === "risk") {
      const assessment = riskData.assessments.find(a => a.id === target.id);
      if(!assessment) { setNotice("This assessment is unavailable in the current demo session."); return false; }
      select("risk.assessments"); setRequestedRisk({id:assessment.id,key:Date.now(),fromQr:true}); setExpanded("risk");
    } else {
      const inspection = resolveQrInspection(inspectionData,target.id);
      if(!inspection) { setNotice("This inspection is unavailable in the current demo session."); return false; }
      openInspection(inspection.id);
    }
    window.history.replaceState(null,"",qrUrl(window.location.origin+window.location.pathname,target));
    return true;
  };
  useEffect(() => { if(!new URLSearchParams(window.location.search).has("qr")) return; try { openQr(parseQr(window.location.href,window.location.href)); } catch(e) { setNotice((e as Error).message); } }, []);
  const chooseGroup = (group: NavGroup) => {
    setExpanded(current => current === group.id ? null : group.id);
  };
  const openCreate = (key: EntityKey) => { setCreateKey(key); setNewName(""); setNewDetail(""); setNewParent(""); setNewScope(""); };
  const createRecord = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!createKey || !newName.trim()) return;
    const meta = entityInfo[createKey];
    if (meta.parent && !newParent) return;
    if (createKey === "users" && !newScope) return;
    const id = `${createKey}-${crypto.randomUUID()}`;
    setRecords(current => ({ ...current, [createKey]: [...current[createKey], {
      id,
      name: newName.trim(),
      parentId: newParent || undefined,
      detail: newDetail.trim() || undefined,
    }] }));
    if (createKey === "users") {
      const scope = scopeOptions(records).find(option => option.value === newScope);
      if (scope) setRoleAssignments(current => [...current, { id: `assignment-${crypto.randomUUID()}`, userId: id, roleId: newParent, scopeKind: scope.kind, scopeId: scope.id }]);
    }
    setCreateKey(null);
  };
  const importRecords = (items: ImportItem[]) => {
    const next = applyImport(items, records);
    const previousRoleIds = new Set(records.roles.map(role => role.id));
    setRecords(next);
    setRolePermissions(current => {
      const updated = { ...current };
      for (const role of next.roles.filter(item => !previousRoleIds.has(item.id))) {
        const imported = items.find(item => item.type === "roles" && item.name === role.name);
        updated[role.id] = importedRolePermissions(imported?.permissions || []);
      }
      return updated;
    });
  };
  const uploadLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCompanyLogo(typeof reader.result === "string" ? reader.result : null);
    reader.readAsDataURL(file);
  };

  const activeGroup = navigation.find(group => group.items.some(item => item.id === active));
  const activeItem = activeGroup?.items.find(item => item.id === active);

  return <main className="app-shell">
    {drawerOpen && <button className="drawer-shade" aria-label="Close menu" onClick={() => setDrawerOpen(false)} />}
    <aside className={`sidebar ${drawerOpen ? "open" : ""}`}>
      <div className="sidebar-brand"><BrandLogo compact /><button className="sidebar-close" aria-label="Close menu" onClick={() => setDrawerOpen(false)}><X size={20} /></button></div>
      <div className="workspace-switch"><span className="workspace-avatar">N</span><span><strong>Northstar Manufacturing</strong><small>Company workspace</small></span><ChevronDown size={15} /></div>
      <nav aria-label="Main navigation">
        <div className="nav-caption">WORKSPACE</div>
        <button className={`nav-main ${active === "home" ? "selected" : ""}`} onClick={() => select("home")}><Home size={18} /><span>Home</span></button>
        <button className={`nav-main ${active === "insights" ? "selected" : ""}`} onClick={() => select("insights")}><ChartNoAxesCombined size={18} /><span>Insights</span></button>
        <button className="nav-main" onClick={() => setScannerOpen(true)}><ScanLine size={18}/><span>Scan QR label</span></button>
        <div className="nav-caption modules-caption">MODULES</div>
        {navigation.map(group => { const Icon = group.icon; const open = expanded === group.id; const hasActive = activeGroup?.id === group.id; return <div className="nav-group" key={group.id}>
          <button className={`nav-main ${hasActive ? "group-active" : ""}`} aria-expanded={open} onClick={() => chooseGroup(group)}><Icon size={18} /><span>{group.label}</span><ChevronDown size={15} className={`nav-chevron ${open ? "rotated" : ""}`} /></button>
          {open && <div className="nav-sublist">{group.items.map(item => <button key={item.id} className={active === item.id ? "active" : ""} onClick={() => select(item.id)}>{item.label}</button>)}</div>}
        </div>; })}
      </nav>
      <div className="sidebar-bottom"><button onClick={() => setAssistantOpen(true)}><Bot size={18} /> Ask OleoQ AI <Sparkles size={14} /></button><button onClick={onSignOut}><LockKeyhole size={18} /> Sign out</button></div>
    </aside>

    <section className="app-main">
      <header className="app-topbar"><div className="topbar-left"><button className="menu-trigger" onClick={() => setDrawerOpen(true)} aria-label="Open menu"><Menu size={22} /></button><button className="breadcrumb-home" onClick={() => select("home")}>Workspace</button><ChevronRight size={14} /><strong>{active === "home" ? "Home" : active === "insights" ? "Insights" : activeItem?.label}</strong></div><div className="topbar-right">{!active.startsWith("risk.") && !active.startsWith("incident.") && !active.startsWith("audit.") && !active.startsWith("law.") && !active.startsWith("inspection.") && !["insights", "config.roles", "config.forms", "config.jobs"].includes(active) && <Select aria-label="Current site" value={siteFilter} onChange={event => setSiteFilter(event.target.value)}><option>All sites</option>{records.sites.map(site => <option key={site.id}>{site.name}</option>)}</Select>}<button className="field-scan-top" aria-label="Scan QR label" onClick={() => setScannerOpen(true)}><ScanLine size={18}/><span>Scan QR</span></button><button className="field-notifications" aria-label={`Due-date reminders (${reminders.length})`} onClick={() => setRemindersOpen(true)}><Bell size={19}/>{reminders.length > 0 && <b>{reminders.length}</b>}</button><span className="profile-avatar" title="Alex Morgan">AM</span></div></header>
      {notice && <div className="toast" role="status">{notice}<button aria-label="Dismiss" onClick={() => setNotice("")}><X size={14} /></button></div>}
      <div className="app-content">
        {active === "home" && <Dashboard inspectionData={inspectionData} lawData={lawData} auditData={auditData} incidentData={incidentData} riskData={riskData} onNavigate={id => { select(id); setExpanded(id.startsWith("config.") ? "configuration" : id.split(".")[0]); }} />}
        {active === "insights" && <WorkspaceInsights records={records} assignments={roleAssignments} />}
        {activeGroup && activeGroup.id !== "configuration" && activeGroup.id !== "risk" && activeGroup.id !== "incident" && activeGroup.id !== "audit" && activeGroup.id !== "law" && activeGroup.id !== "inspection" && <SearchPage key={active} title={activeItem?.label || "Search"} group={activeGroup.label} data={searchExamples[active]} searchTerm={searchTerm} onSearch={setSearchTerm} siteFilter={siteFilter} onCreate={() => setNotice(`Creating a ${activeItem?.label.toLowerCase().replace("search ", "").replace(/s$/, "")} is planned for the next prototype screen.`)} />}
        {active.startsWith("config.") && active !== "config.roles" && (active.slice(7) in entityInfo) && <EntityPage entity={active.slice(7) as EntityKey} records={records} assignments={roleAssignments} searchTerm={searchTerm} onSearch={setSearchTerm} onCreate={openCreate} />}
        {active === "config.roles" && <RolesPermissionsPage records={records} rolePermissions={rolePermissions} assignments={roleAssignments} onCreateRole={role => { setRecords(current => ({ ...current, roles: [...current.roles, role] })); setRolePermissions(current => ({ ...current, [role.id]: [] })); }} onSaveRole={(roleId, values) => setRolePermissions(current => ({ ...current, [roleId]: values }))} onAddAssignment={assignment => setRoleAssignments(current => [...current, assignment])} onRemoveAssignment={id => setRoleAssignments(current => current.filter(item => item.id !== id))} />}
        {active.startsWith("incident.") && <IncidentModule inspectionData={inspectionData} onOpenInspection={openInspection} lawData={lawData} onOpenLaw={openLaw} requestedRecord={requestedIncident} onOpenAudit={id => { select("audit.audits"); setRequestedAudit({id,key:Date.now()}); setExpanded("audit"); }} active={active} records={records} forms={forms} data={incidentData} setData={setIncidentData} onNavigate={id => { select(id); setExpanded(id.startsWith("config.") ? "configuration" : "incident"); }} />}
        {active.startsWith("audit.") && <AuditModule key={`${active}-${navigationVersion}`} active={active} records={records} forms={forms} setForms={setForms} data={auditData} setData={setAuditData} incidentData={incidentData} setIncidentData={setIncidentData} requestedAudit={requestedAudit} onOpenIncident={(kind,id) => { select(kind === "incident" ? "incident.incidents" : "incident.actions"); setRequestedIncident({kind,id,key:Date.now()}); setExpanded("incident"); }} onNavigate={id => { select(id); setExpanded(id.startsWith("config.") ? "configuration" : id.split(".")[0]); }} />}
        {active.startsWith("inspection.") && <InspectionModule onOpenQr={openQr} key={`${active}-${navigationVersion}`} active={active} records={records} forms={forms} data={inspectionData} setData={setInspectionData} incidentData={incidentData} setIncidentData={setIncidentData} riskData={riskData} requestedInspection={requestedInspection} onOpenIncident={(kind,id) => { select(kind === "incident" ? "incident.incidents" : "incident.actions"); setRequestedIncident({kind,id,key:Date.now()}); setExpanded("incident"); }} onOpenRisk={id => { select("risk.assessments"); setRequestedRisk({id,key:Date.now()}); setExpanded("risk"); }} onNavigate={id => { select(id); setExpanded(id.startsWith("config.") ? "configuration" : id.split(".")[0]); }} />}
        {active.startsWith("law.") && <LawModule key={`${active}-${navigationVersion}`} active={active} records={records} forms={forms} data={lawData} setData={setLawData} riskData={riskData} incidentData={incidentData} setIncidentData={setIncidentData} profileId={lawProfileId} setProfileId={setLawProfileId} requestedChecklist={requestedLaw} onOpenRisk={id => { select("risk.assessments"); setRequestedRisk({id,key:Date.now()}); setExpanded("risk"); }} onOpenIncident={(kind,id) => { select(kind === "incident" ? "incident.incidents" : "incident.actions"); setRequestedIncident({kind,id,key:Date.now()}); setExpanded("incident"); }} onNavigate={id => { select(id); setExpanded("law"); }} />}
        {active.startsWith("risk.") && <RiskModule onOpenQr={openQr} inspectionData={inspectionData} onOpenInspection={openInspection} lawData={lawData} onOpenLaw={openLaw} requestedAssessment={requestedRisk} active={active} records={records} forms={forms} setForms={setForms} data={riskData} setData={setRiskData} onNavigate={id => { select(id); setExpanded(id.startsWith("config.") ? "configuration" : "risk"); }} />}
        {active === "config.forms" && <FormBuilderPage sites={records.sites} forms={forms} setForms={setForms} onManageAccess={() => { select("config.roles"); setExpanded("configuration"); }} />}
        {active === "config.jobs" && <ScheduledJobsPage fieldItems={dueItems} records={records} jobs={scheduledJobs} setJobs={setScheduledJobs} runs={jobRuns} setRuns={setJobRuns} />}
        {active === "config.branding" && <BrandingPage colors={colors} setColors={setColors} logo={companyLogo} onUpload={uploadLogo} />}
        {active === "config.subscription" && <SubscriptionPage onAction={() => setNotice("Stripe billing is not connected in this presentation prototype.")} />}
        {active === "config.identity" && <IdentityPage />}
        {active === "config.help" && <HelpPage onAction={() => setNotice("Video links and AI knowledge can be configured when the backend is connected.")} />}
        {active === "config.bulkImport" && <BulkImportPage records={records} onImport={importRecords} onNavigate={id => { select(id); setExpanded("configuration"); }} />}
      </div>
    </section>

    {scannerOpen && <QrScanner close={() => setScannerOpen(false)} onOpen={openQr}/>}
    {remindersOpen && <DueReminderPanel items={reminders} records={records} close={() => setRemindersOpen(false)} onOpen={openQr} onJobs={() => { select("config.jobs"); setExpanded("configuration"); }}/>}
    <button className="assistant-fab" onClick={() => setAssistantOpen(true)} aria-label="Open AI assistant"><Sparkles size={20} /></button>
    {assistantOpen && <div className="assistant-panel"><div className="assistant-head"><span><Bot size={19} /> OleoQ assistant</span><button aria-label="Close assistant" onClick={() => setAssistantOpen(false)}><X size={18} /></button></div><div className="assistant-body"><div className="assistant-bubble"><Sparkles size={16} /><p>Hi Alex. I can help you find a page or understand how your workspace is organised.</p></div><button onClick={() => { select("config.roles"); setExpanded("configuration"); setAssistantOpen(false); }}>Where do I manage roles? <ArrowRight size={14} /></button><button onClick={() => { select("config.sites"); setExpanded("configuration"); setAssistantOpen(false); }}>How do sites relate to business units? <ArrowRight size={14} /></button><small>Concept preview · AI responses are not connected yet.</small></div></div>}

    {createKey && <div className="dialog-backdrop" onMouseDown={event => { if(event.target === event.currentTarget) setCreateKey(null); }}>
      <div className="create-dialog" role="dialog" aria-modal="true" aria-labelledby="create-title">
        <button className="dialog-close" aria-label="Close" onClick={() => setCreateKey(null)}><X size={19} /></button>
        <span className="dialog-icon"><Plus size={20} /></span>
        <h2 id="create-title">Create {entityInfo[createKey].singular}</h2>
        <p>{entityInfo[createKey].description}</p>
        <form onSubmit={createRecord}>
          <label>{createKey === "users" ? "Full name" : "Name"}<input autoFocus value={newName} onChange={event => setNewName(event.target.value)} placeholder={`Enter ${entityInfo[createKey].singular} name`} required /></label>
          {entityInfo[createKey].parent && <label>{entityInfo[createKey].parentLabel}<Select value={newParent} onChange={event => setNewParent(event.target.value)} required><option value="">Select {entityInfo[createKey].parentLabel?.toLowerCase()}</option>{records[entityInfo[createKey].parent!].map(item => <option key={item.id} value={item.id}>{item.name}</option>)}</Select></label>}
          {createKey === "users" && <><label>Initial role scope<Select value={newScope} onChange={event => setNewScope(event.target.value)} required><option value="">Select where this role applies</option>{scopeOptions(records).map(scope => <option key={scope.value} value={scope.value}>{scope.label}</option>)}</Select></label><label>Work email<input type="email" value={newDetail} onChange={event => setNewDetail(event.target.value)} placeholder="name@company.com" required /></label></>}
          {createKey !== "users" && <label>Notes <span className="optional">Optional</span><input value={newDetail} onChange={event => setNewDetail(event.target.value)} placeholder="Add a short description" /></label>}
          <div className="dialog-actions"><button type="button" onClick={() => setCreateKey(null)}>Cancel</button><button type="submit">Create {entityInfo[createKey].singular} <ArrowRight size={16} /></button></div>
        </form>
      </div>
    </div>}
  </main>;
}

function PageHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: ReactNode }) {
  return <div className="page-header"><div><div className="page-eyebrow">{eyebrow}</div><h1>{title}</h1><p>{description}</p></div>{action}</div>;
}

function WorkspaceInsights({ records, assignments }: { records: Records; assignments: RoleAssignment[] }) {
  const activeUsers = records.users.length;
  const assignedUsers = records.users.filter(user => assignments.some(assignment => assignment.userId === user.id && records.roles.some(role => role.id === assignment.roleId))).length;
  const assignedPercent = activeUsers ? Math.round((assignedUsers / activeUsers) * 100) : 0;
  const roleCounts = records.roles.map(role => ({ name: role.name, count: new Set(assignments.filter(assignment => assignment.roleId === role.id).map(assignment => assignment.userId)).size }));
  const unassignedUsers = activeUsers - assignedUsers;
  if (unassignedUsers) roleCounts.push({ name: "Unassigned", count: unassignedUsers });
  const structure = [
    { name: "Business units", count: records.businessUnits.length, color: "#0b4a68" },
    { name: "Sites", count: records.sites.length, color: "#397aa1" },
    { name: "Locations", count: records.locations.length, color: "#67adc0" },
    { name: "Departments", count: records.departments.length, color: "#93d8d8" },
  ];
  const modules = [
    { name: "Risk", count: 24, color: "#597abd" },
    { name: "Incident", count: 8, color: "#9b83c8" },
    { name: "Audit", count: 6, color: "#74b8b2" },
    { name: "Document", count: 142, color: "#4b91bb" },
    { name: "Law", count: 31, color: "#b6a16a" },
  ];
  const maxRole = Math.max(1, ...roleCounts.map(role => role.count));
  const maxStructure = Math.max(1, ...structure.map(level => level.count));
  const maxModule = Math.max(...modules.map(module => module.count));

  return <>
    <PageHeader eyebrow="WORKSPACE / INSIGHTS" title="Workspace insights" description="A clear view of your people, organisation and EHS modules across all sites." />
    <div className="insights-note"><span className="insights-live-dot" /> People and organisation charts reflect your current workspace records. Module activity is sample data.</div>
    <div className="insights-grid">
      <section className="insights-card" aria-labelledby="insights-users-title">
        <div className="insights-card-head"><div><span>PEOPLE</span><h2 id="insights-users-title">Active users</h2></div><Users size={19} /></div>
        <div className="users-chart"><div className="users-ring" role="img" aria-label={`${activeUsers} active users; ${assignedPercent}% have a role`} style={{ background: `conic-gradient(#5f8fbd ${assignedPercent}%, #e5edf2 ${assignedPercent}% 100%)` }}><div><strong>{activeUsers}</strong><small>active users</small></div></div><div className="users-chart-meta"><strong>{assignedPercent}%</strong><span>have a role assigned</span><small>{assignedUsers} of {activeUsers} users</small></div></div>
        <p className="insights-card-foot">All user records in this demo are treated as active.</p>
      </section>
      <section className="insights-card" aria-labelledby="insights-roles-title">
        <div className="insights-card-head"><div><span>ACCESS</span><h2 id="insights-roles-title">Users by role</h2></div><ShieldCheck size={19} /></div>
        <div className="insights-bar-list">{roleCounts.length ? roleCounts.map(role => <div className="insights-bar-row" key={role.name}><div className="insights-bar-label"><span>{role.name}</span><strong>{role.count}</strong></div><div className="insights-track"><span style={{ width: `${(role.count / maxRole) * 100}%`, background: "#6486bc" }} /></div></div>) : <p className="insights-empty">Create a role to see the distribution.</p>}</div>
        <p className="insights-card-foot">A user with multiple roles appears in each relevant row.</p>
      </section>
      <section className="insights-card" aria-labelledby="insights-structure-title">
        <div className="insights-card-head"><div><span>ORGANISATION</span><h2 id="insights-structure-title">Company structure</h2></div><Building2 size={19} /></div>
        <div className="insights-bar-list">{structure.map(level => <div className="insights-bar-row" key={level.name}><div className="insights-bar-label"><span>{level.name}</span><strong>{level.count}</strong></div><div className="insights-track"><span style={{ width: `${(level.count / maxStructure) * 100}%`, background: level.color }} /></div></div>)}</div>
        <p className="insights-card-foot">Business unit → site → location → department</p>
      </section>
      <section className="insights-card" aria-labelledby="insights-modules-title">
        <div className="insights-card-head"><div><span>ILLUSTRATIVE ACTIVITY</span><h2 id="insights-modules-title">Module overview</h2></div><ChartNoAxesCombined size={19} /></div>
        <div className="insights-bar-list">{modules.map(module => <div className="insights-bar-row" key={module.name}><div className="insights-bar-label"><span>{module.name}</span><strong>{module.count}</strong></div><div className="insights-track"><span style={{ width: `${(module.count / maxModule) * 100}%`, background: module.color }} /></div></div>)}</div>
        <p className="insights-card-foot">Sample record counts for the presentation.</p>
      </section>
    </div>
  </>;
}

function Dashboard({ onNavigate, riskData, incidentData, auditData, lawData, inspectionData }: {inspectionData: InspectionData; lawData: LawData; onNavigate: (id: string) => void; riskData: RiskData; incidentData: IncidentData; auditData: AuditData }) {
  const cards = [
    { title: "Risk", text: "Assess and control workplace risks", count: String(riskData.assessments.filter(a => a.status !== "Archived").length), note: "active assessments", icon: ShieldCheck, tone: "risk", target: "risk.overview" },
    { title: "Incident", text: "Report and investigate events", count: String(incidentData.incidents.filter(i => i.active && !i.closed && !i.draft).length), note: "open incidents", icon: Fingerprint, tone: "incident", target: "incident.overview" },
    { title: "Audit", text: "Plan and follow your audits", count: String(auditData.audits.filter(a => a.active && !a.completed).length), note: "audits to complete", icon: ClipboardCheck, tone: "audit", target: "audit.overview" },
    { title: "Inspection", text: "Check conditions and follow up issues", count: String(inspectionData.inspections.filter(i => i.active && !i.completedAt).length), note: "inspections to complete", icon: ClipboardList, tone: "inspection", target: "inspection.overview" },
    { title: "Document", text: "Find controlled information", count: "142", note: "published documents", icon: FolderOpen, tone: "document", target: "document.documents" },
    { title: "Law", text: "Stay on top of obligations", count: String(lawData.profiles.filter(p=>p.active).reduce((sum,p)=>sum+complianceSummary(lawData,p).total,0)), note: "relevant profile checklists", icon: Scale, tone: "law", target: "law.overview" },
  ];
  return <>
    <div className="welcome-banner"><div><div className="welcome-eyebrow"><span /> NORTHSTAR WORKSPACE</div><h1>Good morning, Alex <span>✳</span></h1><p>Here is your EHS workspace. Choose a module or pick up where your team left off.</p><button onClick={() => onNavigate("risk.assessments")}>Explore your workspace <ArrowRight size={16} /></button></div><div className="welcome-art" aria-hidden="true"><span className="ring r1" /><span className="ring r2" /><div><ShieldCheck size={33} /><strong>One connected<br />EHS picture</strong></div></div></div>
    <div className="section-row"><div><span className="page-eyebrow">YOUR MODULES</span><h2>Everything in one place</h2></div><button onClick={() => onNavigate("config.businessUnits")}>Manage workspace <ArrowRight size={15} /></button></div>
    <div className="module-cards">{cards.map(card => { const Icon = card.icon; return <button className="module-card" key={card.title} onClick={() => onNavigate(card.target)}><span className={`module-card-icon ${card.tone}`}><Icon size={22} /></span><span className="module-card-top"><strong>{card.title}</strong><ArrowRight size={16} /></span><span className="module-description">{card.text}</span><span className="module-stat"><b>{card.count}</b><small>{card.note}</small></span></button>; })}</div>
    <div className="dashboard-bottom"><div className="dashboard-card"><div className="card-title"><div><span className="page-eyebrow">QUICK ACCESS</span><h3>Jump back in</h3></div><MoreHorizontal size={20} /></div><button onClick={() => onNavigate("incident.actions")}><span className="quick-icon purple"><ListChecks size={18} /></span><span><strong>Search corrective actions</strong><small>Incident · Across all sites</small></span><ChevronRight size={17} /></button><button onClick={() => onNavigate("document.documents")}><span className="quick-icon blue"><FileText size={18} /></span><span><strong>Find a document</strong><small>Document · Policies & procedures</small></span><ChevronRight size={17} /></button><button onClick={() => onNavigate("config.roles")}><span className="quick-icon teal"><Users size={18} /></span><span><strong>Manage roles & permissions</strong><small>Configuration · People & access</small></span><ChevronRight size={17} /></button></div><div className="dashboard-card structure-card"><div className="card-title"><div><span className="page-eyebrow">YOUR ORGANISATION</span><h3>Built around your structure</h3></div><Building2 size={19} /></div><p>Records and permissions can follow each level of your company.</p><div className="hierarchy-mini"><span>Business unit</span><ChevronRight size={15} /><span>Site</span><ChevronRight size={15} /><span>Location</span><ChevronRight size={15} /><span>Department</span></div><button className="text-action" onClick={() => onNavigate("config.businessUnits")}>View organisation structure <ArrowRight size={15} /></button></div></div>
  </>;
}

function SearchPage({ title, group, data, searchTerm, onSearch, siteFilter, onCreate }: { title:string; group:string; data: typeof searchExamples[string]; searchTerm:string; onSearch:(value:string)=>void; siteFilter:string; onCreate:()=>void }) {
  const rows = (data?.rows || []).filter(row => `${row.id} ${row.title} ${row.site} ${row.status}`.toLowerCase().includes(searchTerm.toLowerCase()) && (siteFilter === "All sites" || row.site === siteFilter || row.site === "All sites"));
  return <><PageHeader eyebrow={`${group.toUpperCase()} / SEARCH`} title={title} description={data?.description || "Find records across your workspace."} action={<button className="page-primary" onClick={onCreate}><Plus size={17} /> Create new</button>} /><div className="search-toolbar"><div className="search-box"><Search size={18} /><input value={searchTerm} onChange={event => onSearch(event.target.value)} placeholder={`Search ${title.toLowerCase().replace("search ","")} by ID or name`} aria-label="Search records" /></div><span className="filter-pill"><Filter size={16} /> {siteFilter}</span></div><div className="data-card"><div className="data-card-head"><strong>{rows.length} records</strong><span>Showing results for {siteFilter.toLowerCase()}</span></div><div className="table-scroll"><table><thead><tr><th>ID</th><th>Title</th><th>Site</th><th>Status</th><th>Updated</th><th /></tr></thead><tbody>{rows.map(row => <tr key={row.id}><td className="id-cell">{row.id}</td><td className="title-cell">{row.title}</td><td>{row.site}</td><td><span className={`status ${row.status.toLowerCase().replaceAll(" ","-")}`}>{row.status}</span></td><td>{row.updated}</td><td><ChevronRight size={17} /></td></tr>)}{rows.length === 0 && <tr><td colSpan={6} className="empty-row">No records match these filters.</td></tr>}</tbody></table></div></div></>;
}

function EntityPage({ entity, records, assignments, searchTerm, onSearch, onCreate }: { entity:EntityKey; records:Records; assignments:RoleAssignment[]; searchTerm:string; onSearch:(value:string)=>void; onCreate:(key:EntityKey)=>void }) {
  const info = entityInfo[entity];
  const items = records[entity].filter(row => `${row.name} ${row.detail || ""}`.toLowerCase().includes(searchTerm.toLowerCase()));
  const parentName = (row:Row) => entity === "users"
    ? assignments.filter(item => item.userId === row.id).map(item => `${records.roles.find(role => role.id === item.roleId)?.name || "Unknown"} (${scopeLabel(item, records)})`).join(" · ") || "No role assigned"
    : info.parent ? records[info.parent].find(parent => parent.id === row.parentId)?.name || "—" : "—";
  const isStructure = ["businessUnits","sites","locations","departments"].includes(entity);
  return <><PageHeader eyebrow="CONFIGURATION" title={info.title} description={info.description} action={<button className="page-primary" onClick={() => onCreate(entity)}><Plus size={17} /> Create {info.singular}</button>} />{isStructure && <div className="dependency-banner"><span className="dependency-icon"><Building2 size={18} /></span><div><strong>Company structure</strong><p>Business unit <ChevronRight size={13} /> Site <ChevronRight size={13} /> Location <ChevronRight size={13} /> Department</p></div></div>}<div className="search-toolbar"><div className="search-box"><Search size={18} /><input value={searchTerm} onChange={event => onSearch(event.target.value)} placeholder={`Search ${info.title.toLowerCase()}`} aria-label={`Search ${info.title.toLowerCase()}`} /></div><span className="filter-pill"><Filter size={16} /> All records</span></div><div className="data-card"><div className="data-card-head"><strong>{items.length} {info.title.toLowerCase()}</strong><span>Northstar Manufacturing</span></div><div className="table-scroll"><table><thead><tr><th>Name</th>{info.parent && <th>{entity === "users" ? "Role assignments" : info.parentLabel}</th>}<th>Details</th><th>Status</th><th /></tr></thead><tbody>{items.map(row => <tr key={row.id}><td className="title-cell">{row.name}</td>{info.parent && <td>{parentName(row)}</td>}<td>{row.detail || "—"}</td><td><span className="status active">Active</span></td><td><MoreHorizontal size={18} /></td></tr>)}{items.length === 0 && <tr><td className="empty-row" colSpan={info.parent ? 5 : 4}>No matching records.</td></tr>}</tbody></table></div></div>{isStructure && <p className="context-note"><Info size={16} /> A {entity === "businessUnits" ? "business unit has sites beneath it" : `${info.singular} must be created under a ${info.parentLabel?.toLowerCase()}`}. This relationship scopes reporting and access.</p>}</>;
}

function BrandingPage({ colors, setColors, logo, onUpload }: { colors:{primary:string;secondary:string;tertiary:string}; setColors:React.Dispatch<React.SetStateAction<{primary:string;secondary:string;tertiary:string}>>; logo:string|null; onUpload:(event:ChangeEvent<HTMLInputElement>)=>void }) {
  return <><PageHeader eyebrow="CONFIGURATION / APPEARANCE" title="Branding" description="Make your company workspace feel like yours. Logo and colours appear throughout the environment." /><div className="settings-grid"><div className="settings-card"><h2>Company logo</h2><p>Use a clear logo with a transparent background for the best result.</p><label className="logo-uploader"><Upload size={21} /><strong>{logo ? "Replace logo" : "Upload company logo"}</strong><small>PNG, JPG or SVG</small><input type="file" accept="image/png,image/jpeg,image/svg+xml" onChange={onUpload} /></label><div className="color-settings"><h2>Workspace colours</h2>{(["primary","secondary","tertiary"] as const).map(key => <label key={key}><span>{key[0].toUpperCase()+key.slice(1)} colour</span><span className="color-value"><input type="color" value={colors[key]} onChange={event => setColors(current => ({...current,[key]:event.target.value}))} /><code>{colors[key].toUpperCase()}</code></span></label>)}</div></div><div className="settings-card preview-card"><div className="preview-label">LIVE PREVIEW</div><div className="brand-app-preview"><div className="brand-app-head" style={{background:colors.primary}}><span style={{background:colors.secondary}}>{logo ? <img src={logo} alt="Company logo preview" /> : "N"}</span><strong>Northstar Manufacturing</strong></div><div className="brand-app-body"><small>YOUR WORKSPACE</small><h3>Safety at a glance</h3><div className="brand-preview-tiles"><span style={{background:colors.secondary}} /><span style={{background:colors.tertiary}} /><span style={{background:colors.secondary}} /></div><div className="brand-preview-bars">{[36,62,48,76,58,88].map((height,index) => <span key={index} style={{height:`${height}%`,background:index%2 ? colors.secondary : colors.tertiary}} />)}</div></div></div><p>Preview updates as you choose colours.</p></div></div></>;
}

function SubscriptionPage({onAction}:{onAction:()=>void}) {
  return <><PageHeader eyebrow="CONFIGURATION / BILLING" title="Subscription" description="View your plan and the modules available to your company." /><div className="subscription-layout"><div className="settings-card plan-card"><span className="plan-badge">CURRENT PLAN</span><h2>Professional</h2><p>Everything your team needs to manage EHS in one connected workspace.</p><div className="plan-list"><div><Check size={17} /> 6 connected modules</div><div><Check size={17} /> Multiple sites & departments</div><div><Check size={17} /> Flexible roles & permissions</div></div><button className="page-primary" onClick={onAction}>Manage subscription <ArrowRight size={16} /></button></div><div className="settings-card"><h2>Included modules</h2><p>Module access is controlled by your subscription and then assigned to users through roles.</p><div className="included-modules">{["Risk","Incident","Audit","Inspection","Document","Law"].map(name => <div key={name}><span><Check size={15} /> {name}</span><strong>Active</strong></div>)}</div><button className="text-link" onClick={onAction}>Explore additional modules <ArrowRight size={15} /></button></div></div><p className="context-note"><Info size={16} /> Stripe upgrades and payment management are planned; this prototype does not process payments.</p></>;
}

function IdentityPage() {
  return <><PageHeader eyebrow="CONFIGURATION / ACCESS" title="Identity & SSO" description="Connect your company's sign-in provider when you are ready for centralised access." /><div className="settings-card info-settings"><span className="settings-icon"><LockKeyhole size={23} /></span><h2>What is a domain?</h2><p>In the SCANNELL reference, a “domain” is an identity directory, usually a Microsoft Active Directory domain. It groups user accounts for sign-in and maps directory groups to application access. It is separate from business units, sites, locations and departments.</p><div className="identity-path"><span>Company identity provider</span><ArrowRight size={17} /><span>Users & groups</span><ArrowRight size={17} /><span>OleoQ roles</span></div><small>For OleoQ, this belongs in optional SSO configuration. It is not another level in the company hierarchy.</small></div></>;
}

function HelpPage({onAction}:{onAction:()=>void}) {
  return <><PageHeader eyebrow="CONFIGURATION / SUPPORT" title="Help videos & AI" description="Connect helpful guidance to the pages where your team needs it." /><div className="settings-grid"><div className="settings-card help-setting"><span className="settings-icon"><PlayCircle size={23} /></span><h2>Contextual video help</h2><p>Assign a YouTube walkthrough to an important action. Users can open it from the small information icon beside the action.</p><button className="page-primary" onClick={onAction}>Manage video links <ArrowRight size={16} /></button></div><div className="settings-card help-setting"><span className="settings-icon"><Bot size={23} /></span><h2>AI assistant</h2><p>Guide users through the product using approved help content and the permissions of their workspace.</p><button className="page-primary" onClick={onAction}>Assistant settings <ArrowRight size={16} /></button></div></div></>;
}

function BulkImportPage({ records, onImport, onNavigate }: { records: Records; onImport: (items: ImportItem[]) => void; onNavigate: (id: string) => void }) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [fileName, setFileName] = useState("");
  const [review, setReview] = useState<ImportReview | null>(null);
  const [importedCount, setImportedCount] = useState(0);
  const [reading, setReading] = useState(false);

  const downloadTemplate = () => {
    const url = URL.createObjectURL(new Blob([TEMPLATE_CSV], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "oleoq-bulk-import-template.csv";
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const readFile = async (file: File) => {
    setFileName(file.name);
    setImportedCount(0);
    if (!file.name.toLowerCase().endsWith(".csv")) {
      setReview({ items: [], issues: [{ line: 0, message: "Choose a .csv file. Download the template to see the supported format." }] });
      return;
    }
    if (file.size > 2_000_000) {
      setReview({ items: [], issues: [{ line: 0, message: "The file must be smaller than 2 MB." }] });
      return;
    }
    setReading(true);
    try {
      setReview(inspectImportCsv(await file.text(), records));
    } catch {
      setReview({ items: [], issues: [{ line: 0, message: "The file could not be read. Please try another CSV file." }] });
    } finally {
      setReading(false);
    }
  };

  const clearFile = () => {
    setFileName("");
    setReview(null);
    setImportedCount(0);
    if (inputRef.current) inputRef.current.value = "";
  };

  const counts = review ? (["businessUnits", "sites", "locations", "departments", "roles", "users", "templates", "categories"] as EntityKey[])
    .map(type => ({ type, count: review.items.filter(item => item.type === type).length }))
    .filter(item => item.count > 0) : [];
  const canImport = !!review && review.items.length > 0 && review.issues.length === 0 && importedCount === 0;

  return <>
    <PageHeader eyebrow="CONFIGURATION / DATA SETUP" title="Bulk import" description="Set up your organisation, people and reusable content in one upload." />
    <div className="import-intro"><span className="import-intro-icon"><Upload size={22} /></span><div><strong>One file. A connected workspace.</strong><p>Use a CSV file to add business units, sites, locations, departments, roles, users, templates and categories together.</p></div></div>
    <div className="import-steps"><span><b>1</b> Download template</span><ChevronRight size={15} /><span><b>2</b> Fill in your data</span><ChevronRight size={15} /><span><b>3</b> Upload & review</span><ChevronRight size={15} /><span><b>4</b> Import</span></div>
    <div className="import-top-grid">
      <div className="settings-card import-guide"><div className="import-card-heading"><span className="settings-icon"><FileText size={21} /></span><div><h2>Start with the template</h2><p>Open the CSV in Excel or another spreadsheet app, then fill one row per record.</p></div></div><button type="button" className="template-button" onClick={downloadTemplate}><Download size={17} /> Download CSV template <ArrowRight size={15} /></button><div className="import-guide-note"><Info size={16} /><span>Keep the column headings. Use <code>parent_key</code> to link a site to a business unit, a location to a site, a department to a location, or a user to a role.</span></div></div>
      <div className="settings-card import-upload"><div className="import-card-heading"><span className="settings-icon"><Upload size={21} /></span><div><h2>Upload your file</h2><p>We validate every row before anything is added.</p></div></div><div className="drop-zone" onDragOver={event => event.preventDefault()} onDrop={event => { event.preventDefault(); const file = event.dataTransfer.files[0]; if (file) void readFile(file); }}><span className="drop-icon"><Upload size={23} /></span><strong>Drag and drop a CSV file here</strong><small>or select a file from your computer · 2 MB maximum</small><button type="button" onClick={() => inputRef.current?.click()}>Choose file</button><input ref={inputRef} type="file" accept=".csv,text/csv" aria-label="Choose bulk import CSV file" onChange={event => { const file = event.target.files?.[0]; if (file) void readFile(file); }} /></div></div>
    </div>
    <div className="import-hierarchy"><Building2 size={17} /><span><strong>Required order:</strong> Business unit <ChevronRight size={13} /> Site <ChevronRight size={13} /> Location <ChevronRight size={13} /> Department</span><small>Parent rows can be anywhere in the file.</small></div>
    {reading && <div className="import-review"><p>Reading and validating your file…</p></div>}
    {review && !reading && <div className="import-review"><div className="import-review-top"><div><span className="page-eyebrow">IMPORT REVIEW</span><h2>{fileName}</h2><p>{review.items.length} data rows found · {review.issues.length} validation {review.issues.length === 1 ? "issue" : "issues"}</p></div><button type="button" onClick={clearFile}><X size={16} /> Remove file</button></div>
      {importedCount > 0 && <div className="import-success" role="status"><span><Check size={19} /></span><div><strong>{importedCount} records imported</strong><p>New users need an explicit scoped role assignment in Roles & permissions before they have access.</p></div><button onClick={() => onNavigate("config.roles")}>Assign roles <ArrowRight size={15} /></button></div>}
      {review.issues.length > 0 && <div className="import-errors" role="alert"><div><AlertCircle size={18} /><strong>Fix these issues before importing</strong></div><ul>{review.issues.slice(0, 8).map((issue, index) => <li key={`${issue.line}-${index}`}>{issue.line ? `Row ${issue.line}: ` : ""}{issue.message}</li>)}</ul>{review.issues.length > 8 && <small>And {review.issues.length - 8} more issues.</small>}</div>}
      {counts.length > 0 && <div className="import-counts">{counts.map(({type,count}) => <span key={type}><b>{count}</b> {entityInfo[type].title}</span>)}</div>}
      {review.items.length > 0 && <div className="import-preview-table"><div className="data-card-head"><strong>File preview</strong><span>First {Math.min(review.items.length, 10)} of {review.items.length} rows</span></div><div className="table-scroll"><table><thead><tr><th>Row</th><th>Type</th><th>Name</th><th>Parent key</th><th>Result</th></tr></thead><tbody>{review.items.slice(0, 10).map(item => { const invalid = review.issues.some(issue => issue.line === item.line); return <tr key={`${item.line}-${item.key}`}><td className="id-cell">{item.line}</td><td>{entityInfo[item.type].singular}</td><td className="title-cell">{item.name}</td><td>{item.parentKey || "—"}</td><td><span className={`status ${invalid ? "open" : "active"}`}>{invalid ? "Fix row" : "Ready"}</span></td></tr>; })}</tbody></table></div></div>}
      <div className="import-review-footer"><p><LockKeyhole size={15} /> The entire file is checked before import. Existing records are kept; this adds new records only.</p><button type="button" className="page-primary" disabled={!canImport} onClick={() => { if (review && canImport) { onImport(review.items); setImportedCount(review.items.length); } }}>Import {review.items.length} records <ArrowRight size={16} /></button></div>
    </div>}
  </>;
}
