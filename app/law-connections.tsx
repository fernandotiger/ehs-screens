"use client";
import { ChevronRight, Scale } from "lucide-react";
import { findChecklist, type LawData, type LawLink, type LawSource } from "./law-model";

export function LegalConnections({data,kind,recordId,source,onOpen}:{data:LawData;kind:LawLink["kind"];recordId:string;source?:LawSource;onOpen:(profileId:string,checklistId:string)=>void}) {
  const links=data.links.filter(l=>l.kind===kind&&l.recordId===recordId);
  if(source&&!links.some(l=>l.profileId===source.profileId&&l.checklistId===source.checklistId)) links.push({id:`origin-${recordId}`,profileId:source.profileId,checklistId:source.checklistId,kind,recordId,context:"Raised from this compliance checklist"});
  return <section className="rk-panel"><div className="rk-panel-head"><h2>Linked compliance checklists</h2></div><div className="lw-link-list">{links.map(l=><button key={l.id} onClick={()=>onOpen(l.profileId,l.checklistId)}><Scale size={17}/><span><strong>{findChecklist(data,l.profileId,l.checklistId)?.title||l.checklistId}</strong><small>{data.profiles.find(p=>p.id===l.profileId)?.name} · {l.context}</small></span><ChevronRight size={16}/></button>)}</div>{!links.length&&<p className="rk-hint">No explicit Law links yet. Link this record from a compliance checklist’s Risk &amp; Incident tab.</p>}</section>;
}
