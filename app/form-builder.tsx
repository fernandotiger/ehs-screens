"use client";
import { initialInspectionForms } from "./inspection-model";

import { Select } from "./select";

import { useMemo, useState, type Dispatch, type DragEvent, type FormEvent, type SetStateAction } from "react";
import { AlignLeft, ArrowDown, ArrowRight, ArrowUp, CalendarDays, Check, ChevronRight, CircleHelp, ClipboardList, FilePlus2, FileText, GripVertical, Hash, Heading, Info, ListChecks, ListFilter, LockKeyhole, Paperclip, Plus, Search, ShieldCheck, ToggleLeft, Trash2, Type, UserRound, X } from "lucide-react";
import { defaultAuditSettings, initialAuditForms, findingTypes } from "./audit-model";
import { defaultRiskSettings, type RiskMethod, type RiskSettings } from "./risk-model";

export type FieldType = "Short text" | "Long text" | "Number" | "Date" | "Date & time" | "Dropdown" | "Multiple choice" | "Yes / No" | "File upload" | "Person" | "Calculated score" | "Section heading";
export type AuditMethod = "Standard" | "Scorable" | "Express";
export type AuditSettings = { method: AuditMethod; defaultFinding: string; siteIds: string[]; mobile: boolean; assignMajorToAuditee: boolean };
export type FormField = { id: string; label: string; type: FieldType; required: boolean; system?: boolean; helpText?: string; placeholder?: string; options?: string[]; searchable?: boolean; exportable?: boolean; siteIds?: string[]; auditScore?: { min: number; max: number; step: number } };
export type FormBlueprint = { id: string; name: string; target: string; status: "Draft" | "Published"; version: number; fields: FormField[]; riskSettings?: RiskSettings; incidentPurpose?: "Report" | "Investigation"; auditSettings?: AuditSettings };

const modules = ["Risk", "Incident", "Audit", "Inspection", "Document", "Law"] as const;
const fieldKinds = [
  { type: "Short text", icon: Type, hint: "Single line" },
  { type: "Long text", icon: AlignLeft, hint: "Paragraph" },
  { type: "Number", icon: Hash, hint: "Numeric value" },
  { type: "Date", icon: CalendarDays, hint: "Calendar date" },
  { type: "Date & time", icon: CalendarDays, hint: "Event time" },
  { type: "Dropdown", icon: ListFilter, hint: "One option" },
  { type: "Multiple choice", icon: ListChecks, hint: "Several options" },
  { type: "Yes / No", icon: ToggleLeft, hint: "Binary answer" },
  { type: "Person", icon: UserRound, hint: "Assigned user" },
  { type: "File upload", icon: Paperclip, hint: "Attachment" },
  { type: "Section heading", icon: Heading, hint: "Group fields" },
] as const;

const defaults: Record<string, Array<Pick<FormField, "label" | "type" | "options" | "helpText">>> = {
  Risk: [
    { label: "Risk title", type: "Short text" }, { label: "Hazard and potential harm", type: "Long text" },
    { label: "Site or location", type: "Short text" }, { label: "Likelihood", type: "Dropdown", options: ["1 · Rare", "2 · Unlikely", "3 · Possible", "4 · Likely", "5 · Almost certain"] },
    { label: "Severity", type: "Dropdown", options: ["1 · Minor", "2 · Moderate", "3 · Serious", "4 · Major", "5 · Catastrophic"] },
    { label: "Risk score", type: "Calculated score", helpText: "Calculated from likelihood × severity in the future workflow." },
    { label: "Assigned owner", type: "Person" }, { label: "Review date", type: "Date" },
  ],
  Incident: [
    { label: "Incident title", type: "Short text" }, { label: "Date and time of event", type: "Date & time" },
    { label: "Site or location", type: "Short text" }, { label: "What happened?", type: "Long text" },
  ],
  Audit: [
    { label: "Audit title", type: "Short text" }, { label: "Site or location", type: "Short text" },
    { label: "Scheduled date", type: "Date" }, { label: "Lead auditor", type: "Person" }, { label: "Scope and objectives", type: "Long text" },
  ],
  Inspection: [
    { label: "Inspection title", type: "Short text" }, { label: "Site or location", type: "Short text" },
    { label: "Inspection date", type: "Date" }, { label: "Inspector", type: "Person" }, { label: "Area or equipment", type: "Short text" },
  ],
  Document: [
    { label: "Document title", type: "Short text" }, { label: "Category", type: "Dropdown", options: ["Policy", "Procedure", "Work instruction", "Record"] },
    { label: "Document owner", type: "Person" }, { label: "File", type: "File upload" }, { label: "Review date", type: "Date" },
  ],
  Law: [
    { label: "Requirement title", type: "Short text" }, { label: "Jurisdiction", type: "Short text" },
    { label: "Requirement summary", type: "Long text" }, { label: "Responsible owner", type: "Person" },
    { label: "Compliance status", type: "Dropdown", options: ["To assess", "Compliant", "Action required", "Not applicable"] }, { label: "Review date", type: "Date" },
  ],
};

function requiredFields(module: string): FormField[] {
  return (defaults[module] || []).map(field => ({ ...field, id: `field-${crypto.randomUUID()}`, required: true, system: true }));
}

const investigationFields: FormField[] = [{ id: "investigation-summary", label: "Investigation findings", type: "Long text", required: true, system: true }, { id: "investigation-root", label: "Root cause analysis", type: "Long text", required: true, system: true }];

const riskStarterFields = defaults.Risk.map((field, index) => ({ ...field, id: `risk-starter-${index}`, required: true, system: true }));
export const initialForms: FormBlueprint[] = [
  { id: "form-risk-express", name: "Health & Safety · Multi-hazard", target: "Risk", status: "Published", version: 1, riskSettings: defaultRiskSettings(), fields: riskStarterFields },
  { id: "form-risk-environment", name: "Environment · Multi-aspect", target: "Risk", status: "Published", version: 1, riskSettings: { ...defaultRiskSettings("3x3"), domain: "Environment" }, fields: riskStarterFields.map(f => f.id === "risk-starter-1" ? { ...f, label: "Environmental aspect and impact" } : f) },
  { id: "form-risk-fmea", name: "Health & Safety · FMEA", target: "Risk", status: "Published", version: 1, riskSettings: defaultRiskSettings("FMEA"), fields: riskStarterFields },
  { id: "form-incident", name: "Incident report", target: "Incident", incidentPurpose: "Report", status: "Published", version: 1, fields: [
    { id: "incident-title", label: "Incident title", type: "Short text", required: true, system: true },
    { id: "incident-when", label: "Date and time of event", type: "Date & time", required: true, system: true },
    { id: "incident-where", label: "Site or location", type: "Short text", required: true, system: true },
    { id: "incident-what", label: "What happened?", type: "Long text", required: true, system: true },
    { id: "incident-injured", label: "Was anyone injured?", type: "Yes / No", required: true, searchable: true, exportable: true },
  ] },
  { id: "form-investigation", name: "Incident investigation", target: "Incident", incidentPurpose: "Investigation", status: "Published", version: 1, fields: investigationFields },
  { id: "form-risk", name: "Risk assessment", target: "Risk", status: "Draft", version: 0, fields: [
    { id: "risk-title", label: "Risk title", type: "Short text", required: true, system: true },
    { id: "risk-hazard", label: "Hazard and potential harm", type: "Long text", required: true, system: true },
    { id: "risk-likelihood", label: "Likelihood", type: "Dropdown", required: true, system: true, options: ["1 · Rare", "2 · Unlikely", "3 · Possible", "4 · Likely", "5 · Almost certain"] },
    { id: "risk-severity", label: "Severity", type: "Dropdown", required: true, system: true, options: ["1 · Minor", "2 · Moderate", "3 · Serious", "4 · Major", "5 · Catastrophic"] },
    { id: "risk-score", label: "Risk score", type: "Calculated score", required: true, system: true },
    { id: "risk-owner", label: "Assigned owner", type: "Person", required: true, system: true },
  ] },
  ...initialInspectionForms,
  ...initialAuditForms,
];

function FieldPreview({ field }: { field: FormField }) {
  if (field.type === "Section heading") return <h4 className="fb-preview-section">{field.label}</h4>;
  return <label className="fb-preview-field"><span>{field.label}{field.required && <b> *</b>}</span>
    {field.type === "Long text" ? <textarea disabled placeholder={field.placeholder || "Enter an answer"} />
      : field.type === "Dropdown" || field.type === "Yes / No" ? <Select disabled defaultValue=""><option value="">Select an option</option>{(field.type === "Yes / No" ? ["Yes", "No"] : field.options || []).map(option => <option key={option}>{option}</option>)}</Select>
      : field.type === "Multiple choice" ? <div className="fb-preview-options">{field.options?.map((option, index) => <span key={`${option}-${index}`}><input type="checkbox" disabled /> {option}</span>)}</div>
      : field.type === "File upload" ? <div className="fb-preview-file"><Paperclip size={14} /> Choose file</div>
      : field.type === "Person" ? <div className="fb-preview-file"><UserRound size={14} /> Select a user</div>
      : field.type === "Calculated score" ? <div className="fb-preview-file"><Hash size={14} /> Auto-calculated</div>
      : <input disabled type={field.type === "Number" ? "number" : field.type === "Date" ? "date" : field.type === "Date & time" ? "datetime-local" : "text"} placeholder={field.placeholder || (field.type === "Short text" ? "Enter an answer" : undefined)} />}
    {field.helpText && <small>{field.helpText}</small>}
  </label>;
}

function FormPreview({ form }: { form: FormBlueprint }) {
  return <div className="fb-preview"><div className="fb-preview-top"><span>{form.target.toUpperCase()} / FORM</span><h3>{form.name}</h3><p>Preview of the questions shown in this workflow.</p></div><div className="fb-preview-body">{form.fields.map(field => <FieldPreview key={field.id} field={field} />)}</div><div className="fb-preview-foot">Fields marked * are required</div></div>;
}

type DropPayload = { kind: "new"; type: FieldType } | { kind: "move"; id: string };

export function FormBuilderPage({ forms, setForms, onManageAccess, sites = [] }: { forms: FormBlueprint[]; setForms: Dispatch<SetStateAction<FormBlueprint[]>>; onManageAccess: () => void; sites?: { id: string; name: string }[] }) {
  const [tab, setTab] = useState<"forms" | "create">("forms");
  const [selectedId, setSelectedId] = useState(initialForms[0].id);
  const [buildingId, setBuildingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [target, setTarget] = useState<string>("Risk");
  const [incidentPurpose, setIncidentPurpose] = useState<"Report" | "Investigation">("Report");
  const [auditMethod, setAuditMethod] = useState<AuditMethod>("Standard");
  const [riskMethod, setRiskMethod] = useState<RiskMethod>("5x5");
  const [query, setQuery] = useState("");
  const [fieldQuery, setFieldQuery] = useState("");
  const [lastReused, setLastReused] = useState("");
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [dropIndex, setDropIndex] = useState<number | null>(null);
  const [notice, setNotice] = useState("");
  const selected = forms.find(form => form.id === selectedId) || forms[0];
  const building = forms.find(form => form.id === buildingId);
  const filtered = useMemo(() => forms.filter(form => `${form.name} ${form.target}`.toLowerCase().includes(query.toLowerCase().trim())), [forms, query]);
  const reusableFields = useMemo(() => {
    const unique = new Set<string>();
    return [...forms].reverse().filter(form => form.id !== buildingId).flatMap(form => form.fields.filter(field => !field.system && field.label.trim()).map(field => ({ field, formName: form.name, module: form.target }))).filter(({ field }) => {
      const key = JSON.stringify([field.label.trim().toLowerCase(), field.type, field.required, field.helpText, field.placeholder, field.options]);
      if (unique.has(key)) return false;
      unique.add(key);
      return true;
    });
  }, [forms, buildingId]);
  const matchingFields = useMemo(() => fieldQuery.trim() ? reusableFields.filter(({ field }) => field.label.toLowerCase().includes(fieldQuery.trim().toLowerCase())).slice(0, 10) : [], [fieldQuery, reusableFields]);
  const updateBuilding = (update: (form: FormBlueprint) => FormBlueprint) => {
    if (!buildingId) return;
    setForms(current => current.map(form => form.id === buildingId ? update(form) : form));
    setNotice("");
  };
  const createForm = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    const form: FormBlueprint = { id: `form-${crypto.randomUUID()}`, name: trimmed, target, status: "Draft", version: 0, fields: target === "Incident" && incidentPurpose === "Investigation" ? investigationFields.map(f => ({ ...f, id: `field-${crypto.randomUUID()}` })) : requiredFields(target), ...(target === "Incident" ? { incidentPurpose } : {}), ...(target === "Risk" ? { riskSettings: defaultRiskSettings(riskMethod) } : {}), ...(target === "Audit" ? { auditSettings: defaultAuditSettings(auditMethod) } : {}) };
    setForms(current => [...current, form]);
    setBuildingId(form.id); setSelectedId(form.id); setSelectedFieldId(null); setNotice("");
    setName("");
  };
  const makeField = (type: FieldType): FormField => ({ id: `field-${crypto.randomUUID()}`, label: type === "Section heading" ? "New section" : "Untitled field", type, required: false, ...(building?.target === "Audit" ? { auditScore: { min: 0, max: 5, step: 1 } } : {}), options: type === "Dropdown" || type === "Multiple choice" ? ["Option 1", "Option 2"] : undefined });
  const addField = (type: FieldType, index?: number) => {
    if (!building || building.status !== "Draft") return;
    const field = makeField(type);
    updateBuilding(form => { const fields = [...form.fields]; fields.splice(index ?? fields.length, 0, field); return { ...form, fields }; });
    setSelectedFieldId(field.id);
  };
  const reuseField = (source: FormField) => {
    if (!building || building.status !== "Draft") return;
    const field: FormField = { ...source, id: `field-${crypto.randomUUID()}`, system: false, options: source.options ? [...source.options] : undefined };
    updateBuilding(form => ({ ...form, fields: [...form.fields, field] }));
    setSelectedFieldId(field.id);
    setLastReused(`${field.label} added to the end of this form.`);
  };
  const moveField = (id: string, index: number) => {
    if (!building || building.status !== "Draft") return;
    updateBuilding(form => {
      const from = form.fields.findIndex(field => field.id === id);
      if (from < 0) return form;
      const fields = [...form.fields]; const [field] = fields.splice(from, 1);
      fields.splice(Math.max(0, Math.min(index > from ? index - 1 : index, fields.length)), 0, field);
      return { ...form, fields };
    });
  };
  const updateField = (id: string, patch: Partial<FormField>) => updateBuilding(form => ({ ...form, fields: form.fields.map(field => field.id === id ? { ...field, ...patch } : field) }));
  const handleDrop = (event: DragEvent<HTMLElement>, index: number) => {
    event.preventDefault(); event.stopPropagation(); setDropIndex(null);
    try {
      const payload = JSON.parse(event.dataTransfer.getData("text/plain")) as DropPayload;
      if (payload.kind === "new" && fieldKinds.some(kind => kind.type === payload.type)) addField(payload.type, index);
      if (payload.kind === "move") moveField(payload.id, index);
    } catch { /* Ignore drops from outside the builder. */ }
  };
  const startEditing = (form: FormBlueprint) => {
    if (form.status === "Published") setForms(current => current.map(item => item.id === form.id ? { ...item, status: "Draft" } : item));
    setBuildingId(form.id); setSelectedId(form.id); setSelectedFieldId(null); setTab("create"); setNotice("");
  };
  const publish = () => {
    if (!building || !building.fields.length) return;
    if (building.target === "Audit") {
      const questions = building.fields.filter(f => !f.system && f.type !== "Section heading");
      if (!questions.length || questions.some(f => !f.label.trim() || ((f.type === "Dropdown" || f.type === "Multiple choice") && (!f.options?.length || f.options.some(o => !o.trim()))))) { setNotice("Add at least one named audit question with valid options before publishing."); return; }
      if (building.auditSettings?.method === "Scorable" && questions.some(f => { const b = f.auditScore || { min: 0, max: 5, step: 1 }; return ![b.min,b.max,b.step].every(Number.isFinite) || b.min < 0 || b.max <= b.min || b.step <= 0 || Math.abs((b.max-b.min)/b.step - Math.round((b.max-b.min)/b.step)) > 0.00001; })) { setNotice("Every score range needs a non-negative minimum, a greater maximum and a positive increment that reaches the maximum."); return; }
    }
    setForms(current => current.map(form => form.id === building.id ? { ...form, status: "Published", version: form.version + 1 } : form));
    setSelectedId(building.id); setBuildingId(null); setTab("forms"); setNotice("Form published in this demo workspace.");
  };
  return <>
    <div className="page-header"><div><div className="page-eyebrow">CONFIGURATION / FORMS</div><h1>Form Builder</h1><p>Design reusable forms for each EHS workflow, then preview and publish them.</p></div><button className="page-primary" onClick={onManageAccess}><ShieldCheck size={16} /> Manage access</button></div>
    <div className="forms-intro"><FilePlus2 size={21} /><div><strong>One builder. Many workflows.</strong><p>Start with the required fields for a module, add the questions your company needs, and publish a version when it is ready.</p></div></div>
    <div className="access-switch" role="tablist" aria-label="Form Builder views"><button role="tab" aria-selected={tab === "forms"} className={tab === "forms" ? "active" : ""} onClick={() => setTab("forms")}><ClipboardList size={16} /> Forms <span>{forms.length}</span></button><button role="tab" aria-selected={tab === "create"} className={tab === "create" ? "active" : ""} onClick={() => setTab("create")}><Plus size={16} /> Create form</button></div>
    {notice && <div className="fb-notice" role="status"><Check size={16} /> {notice}<button aria-label="Dismiss message" onClick={() => setNotice("")}><X size={14} /></button></div>}
    {tab === "forms" ? <div className="fb-library">
      <aside className="fb-list-card"><div className="fb-list-header"><div><span className="page-eyebrow">FORM LIBRARY</span><h2>All forms</h2></div><span>{forms.length} total</span></div><div className="fb-search"><Search size={16} /><input aria-label="Search forms" placeholder="Search forms or modules" value={query} onChange={event => setQuery(event.target.value)} /></div><div className="fb-list">{filtered.map(form => <button key={form.id} className={selected?.id === form.id ? "active" : ""} onClick={() => setSelectedId(form.id)}><span className="fb-list-icon"><FileText size={18} /></span><span className="fb-list-details"><strong>{form.name}</strong><small>{form.target}{form.target === "Incident" ? ` / ${form.incidentPurpose || "Report"}` : ""} · {form.fields.length} fields · {form.status === "Published" ? `v${form.version}` : "Unpublished"}</small></span><em className={form.status.toLowerCase()}>{form.status}</em><ChevronRight size={16} /></button>)}{!filtered.length && <p className="fb-no-results">No forms match “{query}”.</p>}</div></aside>
      <section className="fb-preview-card">{selected && <><div className="fb-preview-header"><div><span className="page-eyebrow">{selected.target.toUpperCase()} FORM</span><h2>{selected.name}</h2><p>{selected.status === "Published" ? `Published version ${selected.version}` : "Unpublished draft"} · {selected.fields.length} fields</p></div><span className={`form-status ${selected.status.toLowerCase()}`}>{selected.status}</span></div><div className="fb-preview-wrap"><FormPreview form={selected} /></div><div className="fb-preview-actions"><span><Info size={15} /> Preview only · answers are disabled</span><button onClick={() => startEditing(selected)}><FileText size={15} /> {selected.status === "Published" ? "Create new draft" : "Continue editing"} <ArrowRight size={15} /></button></div></>}</section>
    </div> : <div className="fb-create-view">{!building ? <div className="fb-start"><div className="fb-start-copy"><span className="page-eyebrow">NEW FORM</span><h2>Start with the right foundation</h2><p>Choose a name and module. The builder will add the key fields for that workflow, then you can arrange and extend the form.</p><div><Check size={16} /> Required module fields are added automatically</div><div><Check size={16} /> Extra fields can be added and configured</div><div><Check size={16} /> Publish only when the form is ready</div></div><form onSubmit={createForm} className="fb-start-form"><h3>Form details</h3><label>Form name<input autoFocus required maxLength={80} placeholder="e.g. Machinery risk assessment" value={name} onChange={event => setName(event.target.value)} /></label><label>Module<Select value={target} onChange={event => setTarget(event.target.value)}>{modules.map(module => <option key={module}>{module}</option>)}</Select></label>{target === "Incident" && <label>Incident purpose<Select value={incidentPurpose} onChange={event => setIncidentPurpose(event.target.value as "Report" | "Investigation")}><option>Report</option><option>Investigation</option></Select></label>}{target === "Audit" && <label>Audit method<Select value={auditMethod} onChange={event => setAuditMethod(event.target.value as AuditMethod)}><option>Standard</option><option>Scorable</option><option>Express</option></Select></label>}{target === "Risk" && <label>Scoring method<Select value={riskMethod} onChange={event => setRiskMethod(event.target.value as RiskMethod)}>{["5x5", "3x3", "FMEA", "Checklist"].map(method => <option key={method}>{method}</option>)}</Select></label>}<p><LockKeyhole size={14} /> {target === "Incident" && incidentPurpose === "Investigation" ? investigationFields.length : defaults[target].length} required fields will be included for {target}.</p><button type="submit"><Plus size={16} /> Start building <ArrowRight size={15} /></button></form></div> : <>
      <div className="fb-build-header"><div><span className="page-eyebrow">{building.target.toUpperCase()} / {building.status.toUpperCase()}</span><h2>{building.name}</h2><p>Drag a component into the form, or use Add. Select a field to edit its settings.</p></div><div className="fb-build-actions"><button onClick={() => { setBuildingId(null); setSelectedFieldId(null); }}><Plus size={15} /> New form</button><button onClick={() => { setSelectedId(building.id); setTab("forms"); }}><Search size={15} /> Preview</button><button className="fb-publish" disabled={building.status !== "Draft"} onClick={publish}><Check size={16} /> Publish version</button></div></div>
      {building.target === "Audit" && <AuditFormSettings form={building} sites={sites} update={patch => updateBuilding(f => ({ ...f, auditSettings: { ...(f.auditSettings || defaultAuditSettings()), ...patch } }))} />}{building.target === "Incident" && <div className="fb-risk-settings"><strong>{building.incidentPurpose || "Report"} template</strong><p><Info size={15} /> Published versions are available in Incident. Assign templates to incident types in Incident → Settings. Site-specific fields, search and export options are configured below.</p></div>}{building.target === "Risk" && <div className="fb-risk-settings"><label>Risk domain<Select value={building.riskSettings?.domain || "Health & Safety"} onChange={event => updateBuilding(form => ({ ...form, riskSettings: { ...(form.riskSettings || defaultRiskSettings()), domain: event.target.value as RiskSettings["domain"] } }))}><option>Health &amp; Safety</option><option>Environment</option></Select></label><label>Scoring method<Select value={building.riskSettings?.method || "5x5"} onChange={event => updateBuilding(form => ({ ...form, riskSettings: { ...defaultRiskSettings(event.target.value as RiskMethod), domain: form.riskSettings?.domain || "Health & Safety" } }))}>{["5x5", "3x3", "FMEA", "Checklist"].map(method => <option key={method}>{method}</option>)}</Select></label><p><Info size={15} /> Thresholds, site availability and review frequency are configured in Risk → Risk matrix. Published versions supply assessment templates.</p></div>}<div className="fb-build-layout"><section className="fb-canvas" onDragOver={event => event.preventDefault()} onDrop={event => handleDrop(event, building.fields.length)}><div className="fb-canvas-head"><div><h3>Form canvas</h3><p>Drag to reorder fields. Required module fields can be moved.</p></div><span>{building.fields.length} fields</span></div>
        {building.fields.map((field, index) => {
          const Icon = fieldKinds.find(kind => kind.type === field.type)?.icon || Hash;
          const editing = selectedFieldId === field.id;
          return <div key={field.id}>
            <div className={`fb-drop-zone ${dropIndex === index ? "active" : ""}`} onDragOver={event => { event.preventDefault(); setDropIndex(index); }} onDragLeave={() => setDropIndex(null)} onDrop={event => handleDrop(event, index)} aria-hidden="true" />
            <div className={`fb-field-card ${editing ? "editing" : ""}`} onDragOver={event => { event.preventDefault(); event.stopPropagation(); setDropIndex(index + (event.clientY > event.currentTarget.getBoundingClientRect().top + event.currentTarget.getBoundingClientRect().height / 2 ? 1 : 0)); }} onDrop={event => handleDrop(event, index + (event.clientY > event.currentTarget.getBoundingClientRect().top + event.currentTarget.getBoundingClientRect().height / 2 ? 1 : 0))}>
              <div className="fb-field-main" draggable={building.status === "Draft"} onDragStart={event => { event.stopPropagation(); event.dataTransfer.setData("text/plain", JSON.stringify({ kind: "move", id: field.id } satisfies DropPayload)); }} onDragEnd={() => setDropIndex(null)}><GripVertical className="fb-grip" size={17} /><span className="fb-field-icon"><Icon size={17} /></span><button className="fb-field-select" onClick={() => setSelectedFieldId(editing ? null : field.id)} aria-expanded={editing}><strong>{field.label}</strong><small>{field.type} · {field.required ? "Required" : "Optional"}{field.system ? " · Module field" : ""}</small></button><div className="fb-field-controls"><button disabled={index === 0 || building.status !== "Draft"} aria-label={`Move ${field.label} up`} onClick={() => moveField(field.id, index - 1)}><ArrowUp size={15} /></button><button disabled={index === building.fields.length - 1 || building.status !== "Draft"} aria-label={`Move ${field.label} down`} onClick={() => moveField(field.id, index + 2)}><ArrowDown size={15} /></button>{!field.system && <button disabled={building.status !== "Draft"} aria-label={`Remove ${field.label}`} onClick={() => { updateBuilding(form => ({ ...form, fields: form.fields.filter(item => item.id !== field.id) })); setSelectedFieldId(null); }}><Trash2 size={15} /></button>}</div></div>
              {editing && <div className="fb-field-settings"><div className="fb-settings-head"><h4>Field settings</h4>{field.system && <span><LockKeyhole size={13} /> Required by {building.target}</span>}</div><div className="fb-settings-grid"><label>Field label<input value={field.label} disabled={field.system || building.status !== "Draft"} onChange={event => updateField(field.id, { label: event.target.value })} /></label><label>Field type<input value={field.type} disabled /></label></div>{field.type !== "Section heading" && <><label>Help text<input value={field.helpText || ""} disabled={building.status !== "Draft"} placeholder="Optional guidance shown below the field" onChange={event => updateField(field.id, { helpText: event.target.value })} /></label>{!["Dropdown", "Multiple choice", "Yes / No", "File upload", "Person", "Calculated score"].includes(field.type) && <label>Placeholder<input value={field.placeholder || ""} disabled={building.status !== "Draft"} placeholder="Hint inside the input" onChange={event => updateField(field.id, { placeholder: event.target.value })} /></label>}<label className="fb-required"><input type="checkbox" checked={field.required} disabled={field.system || building.status !== "Draft"} onChange={event => updateField(field.id, { required: event.target.checked })} /> Required answer</label>{building.target === "Audit" && !field.system && <AuditQuestionSettings field={field} scorable={building.auditSettings?.method === "Scorable"} sites={sites} update={patch => updateField(field.id, patch)} />}{building.target === "Incident" && <><label className="fb-required"><input type="checkbox" checked={field.searchable || false} disabled={building.status !== "Draft"} onChange={event => updateField(field.id, { searchable: event.target.checked })} /> Include answers in incident search</label><label className="fb-required"><input type="checkbox" checked={field.exportable !== false} disabled={building.status !== "Draft"} onChange={event => updateField(field.id, { exportable: event.target.checked })} /> Include in CSV export</label>{!field.system && <div><strong>Question visibility</strong><p>All sites when none are selected. Required questions apply only at selected sites.</p>{sites.map(site => <label className="fb-required" key={site.id}><input type="checkbox" checked={field.siteIds?.includes(site.id) || false} disabled={building.status !== "Draft"} onChange={event => updateField(field.id, { siteIds: event.target.checked ? [...(field.siteIds || []), site.id] : (field.siteIds || []).filter(id => id !== site.id) })} /> {site.name}</label>)}</div>}</>}</>}
                {(field.type === "Dropdown" || field.type === "Multiple choice") && <div className="fb-options"><div><strong>{field.type === "Dropdown" ? "Dropdown options" : "Multiple choice options"}</strong><small>Shown in this order</small></div>{(field.options || []).map((option, optionIndex) => <div className="fb-option-row" key={optionIndex}><span>{optionIndex + 1}</span><input aria-label={`Option ${optionIndex + 1}`} value={option} disabled={building.status !== "Draft"} onChange={event => updateField(field.id, { options: (field.options || []).map((item, itemIndex) => itemIndex === optionIndex ? event.target.value : item) })} /><button aria-label={`Remove option ${optionIndex + 1}`} disabled={building.status !== "Draft" || (field.options || []).length <= 1} onClick={() => updateField(field.id, { options: (field.options || []).filter((_, itemIndex) => itemIndex !== optionIndex) })}><X size={14} /></button></div>)}<button className="fb-add-option" disabled={building.status !== "Draft"} onClick={() => updateField(field.id, { options: [...(field.options || []), `Option ${(field.options || []).length + 1}`] })}><Plus size={14} /> Add option</button></div>}
              </div>}
            </div>
          </div>;
        })}
        <div className={`fb-drop-zone fb-drop-last ${dropIndex === building.fields.length ? "active" : ""}`} onDragOver={event => { event.preventDefault(); setDropIndex(building.fields.length); }} onDragLeave={() => setDropIndex(null)} onDrop={event => handleDrop(event, building.fields.length)} aria-hidden="true"><Plus size={15} /> Drop a field here</div>
      </section><aside className="fb-palette"><div><span className="page-eyebrow">COMPONENTS</span><h3>Add a field</h3><p>Find a field you have made before, or add a new component.</p></div><div className="fb-reuse"><label htmlFor="fb-field-search">Reuse a created field</label><div className="fb-reuse-search"><Search size={15} /><input id="fb-field-search" type="search" value={fieldQuery} onChange={event => { setFieldQuery(event.target.value); setLastReused(""); }} placeholder="Search field names" autoComplete="off" /></div>{fieldQuery.trim() && <div className="fb-reuse-results" aria-label="Matching created fields">{matchingFields.map(({ field, formName, module }) => { const Icon = fieldKinds.find(kind => kind.type === field.type)?.icon || Hash; return <button type="button" key={field.id} disabled={building.status !== "Draft"} aria-label={`Reuse ${field.label} from ${formName}`} onClick={() => reuseField(field)}><span className="fb-reuse-icon"><Icon size={16} /></span><span className="fb-reuse-details"><strong>{field.label}</strong><small>{field.type} · {module} / {formName}</small></span><Plus size={15} /></button>; })}{!matchingFields.length && <p>No created fields match “{fieldQuery}”.</p>}</div>}{lastReused && <p className="fb-reuse-status" role="status"><Check size={14} /> {lastReused}</p>}</div><div className="fb-palette-divider"><span>NEW COMPONENTS</span></div><div className="fb-palette-list">{fieldKinds.map(({ type, icon: Icon, hint }) => <div className="fb-palette-item" key={type} draggable={building.status === "Draft"} onDragStart={event => event.dataTransfer.setData("text/plain", JSON.stringify({ kind: "new", type } satisfies DropPayload))}><span><Icon size={18} /></span><div><strong>{type}</strong><small>{hint}</small></div><button disabled={building.status !== "Draft"} onClick={() => addField(type)} aria-label={`Add ${type} field`}><Plus size={15} /><span>Add</span></button></div>)}</div></aside></div><p className="fb-builder-hint"><CircleHelp size={15} /> Module fields are required and cannot be removed. Their order and guidance can be changed. Publishing and scoring are demonstration interactions.</p>
    </>}</div>}
    <p className="context-note"><LockKeyhole size={16} /> This is a concept prototype. Production form permissions, immutable published versions, user and location selectors, and calculated scoring must be enforced by the application.</p>
  </>;
}

function AuditFormSettings({ form, sites, update }: { form: FormBlueprint; sites: {id:string;name:string}[]; update: (v: Partial<AuditSettings>) => void }) {
  const v = form.auditSettings || defaultAuditSettings();
  return <div className="fb-risk-settings am-builder-settings"><label>Audit method<Select value={v.method} onChange={e => update({method:e.target.value as AuditMethod})}><option>Standard</option><option>Scorable</option><option>Express</option></Select></label><label>Default finding suggestion<Select value={v.defaultFinding} onChange={e => update({defaultFinding:e.target.value})}>{findingTypes.map(t => <option key={t}>{t}</option>)}</Select></label><div><label className="fb-required"><input type="checkbox" checked={v.assignMajorToAuditee} onChange={e => update({assignMajorToAuditee:e.target.checked})} /> Assign major NC incidents to employee auditee</label><label className="fb-required"><input type="checkbox" checked={v.mobile} onChange={e => update({mobile:e.target.checked})} /> Available for assigned auditors on mobile web</label></div><div><strong>Template sites</strong><p>Available everywhere when no sites are selected.</p>{sites.map(s => <label key={s.id} className="fb-required"><input type="checkbox" checked={v.siteIds.includes(s.id)} onChange={e => update({siteIds:e.target.checked?[...v.siteIds,s.id]:v.siteIds.filter(id=>id!==s.id)})} /> {s.name}</label>)}</div><p><Info size={15} /> Add questions using components. Module fields supply scheduling details; sections group questions. Published versions are used by Audit. Defaults never count as recorded findings.</p></div>;
}
function AuditQuestionSettings({ field, scorable, sites, update }: { field:FormField; scorable:boolean; sites:{id:string;name:string}[]; update:(v:Partial<FormField>)=>void }) {
  const b = field.auditScore || {min:0,max:5,step:1};
  return <>{scorable && <div className="fb-settings-grid">{(["min","max","step"] as const).map(k=><label key={k}>{({min:"Minimum score",max:"Maximum score",step:"Score increment"})[k]}<input type="number" step="any" value={b[k]} onChange={e=>update({auditScore:{...b,[k]:Number(e.target.value)}})} /></label>)}</div>}<div><strong>Question sites</strong><p>All sites when none are selected. Other sites will not include this question.</p>{sites.map(s=><label key={s.id} className="fb-required"><input type="checkbox" checked={field.siteIds?.includes(s.id)||false} onChange={e=>update({siteIds:e.target.checked?[...(field.siteIds||[]),s.id]:(field.siteIds||[]).filter(id=>id!==s.id)})} /> {s.name}</label>)}</div></>;
}
