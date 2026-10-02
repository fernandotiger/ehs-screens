"use client";
import { ArrowRight, ClipboardList } from "lucide-react";
import type { InspectionData, InspectionSource } from "./inspection-model";

export function InspectionConnections({ data, riskId, source, onOpen }: { data?: InspectionData; riskId?: string; source?: InspectionSource; onOpen?: (id: string, fieldId?: string) => void }) {
  if (!data || !onOpen) return null;
  const links = source ? [{ id: source.inspectionId, field: source.fieldId, question: source.question }] : data.inspections.flatMap(i => Object.entries(i.checks).filter(([, c]) => c.riskId === riskId).map(([id]) => ({ id: i.id, field: id, question: i.template.fields.find(f => f.id === id)?.label || "Inspection finding" })));
  if (!links.length) return null;
  return <section className="rk-panel in-connections"><div className="rk-panel-head"><h2><ClipboardList size={17} /> Inspection connections</h2></div>{links.map(l => <button type="button" key={`${l.id}-${l.field}`} onClick={() => onOpen(l.id, l.field)}><span><strong>{data.inspections.find(i => i.id === l.id)?.title || l.id}</strong><small>{l.id} · {l.question}</small></span><ArrowRight size={16} /></button>)}{source?.comment && <p className="rk-hint">Original observation: {source.comment}</p>}<p className="rk-hint">Inspection observations and follow-up remain linked to their original checklist.</p></section>;
}
