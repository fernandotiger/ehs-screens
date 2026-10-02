const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),ts=require("typescript");
for(const ext of [".ts",".tsx"])require.extensions[ext]=(module,file)=>module._compile(ts.transpileModule(fs.readFileSync(file,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022}}).outputText,file);
const f=require(path.resolve("app/field-access-model.ts")),im=require(path.resolve("app/inspection-model.ts")),rm=require(path.resolve("app/risk-model.ts")),incm=require(path.resolve("app/incident-model.ts")),{initialForms}=require(path.resolve("app/form-builder.tsx")),sj=require(path.resolve("app/scheduled-jobs.tsx"));
const records={businessUnits:[{id:"bu-1",name:"Operations"}],users:[{id:"user-1",name:"Alex"},{id:"user-2",name:"Sam"},{id:"user-3",name:"Priya"}],sites:[{id:"site-1",name:"Dublin",parentId:"bu-1"},{id:"site-2",name:"Cork",parentId:"bu-1"}],locations:[{id:"loc-1",parentId:"site-1"},{id:"loc-2",parentId:"site-2"}],departments:[{id:"dep-1",parentId:"loc-1"},{id:"dep-2",parentId:"loc-1"},{id:"dep-3",parentId:"loc-2"}]};
const base="https://northstar.example/",target={kind:"inspection",id:"INS-LAD001"},url=f.qrUrl(base,target);
assert.deepEqual(f.parseQr(url,base),target);assert.deepEqual(f.parseQr("ra-lad001",base),{kind:"risk",id:"RA-LAD001"});
for(const bad of ["https://evil.example/?workspace=northstar&qr=risk:RA-1042",url.replace("northstar","other"),url+"&qr=risk:RA-1042",url.replace("inspection%3AINS","risk%3AINS"),"javascript:alert(1)","https://user:pass@northstar.example/?workspace=northstar&qr=risk:RA-1042"])assert.throws(()=>f.parseQr(bad,base));
assert.throws(()=>f.qrUrl("javascript:alert(1)",target));assert.throws(()=>f.qrUrl("https://user:pass@host.example/",target));
const risks=rm.initialRiskData(initialForms),inspections=im.initialInspectionData(initialForms),incidents=incm.initialIncidentData(initialForms);
const items=f.fieldDueItems(risks,inspections),reminders=f.fieldReminders(items,sj.initialScheduledJobs,records);
assert(reminders.some(i=>i.id==="RA-LAD001"&&i.ownerId==="user-3"&&i.daysUntilDue===0));assert(reminders.some(i=>i.id==="INS-LAD001"&&i.ownerId==="user-3"));
assert(!f.fieldReminders(items,sj.initialScheduledJobs.map(j=>({...j,enabled:false})),records).length);
assert(!f.fieldReminders(items,sj.initialScheduledJobs.map(j=>({...j,channels:["email"]})),records).length);
assert(!f.fieldReminders(items,sj.initialScheduledJobs.map(j=>({...j,owners:false})),records).length);
const cork={...sj.initialScheduledJobs.find(j=>j.id==="job-fieldwork"),scope:"sites:site-2"};assert(!f.matchesFieldJob(items.find(i=>i.id==="INS-LAD001"),cork,records));
assert(f.matchesFieldJob(items.find(i=>i.id==="INS-LAD001"),{...cork,scope:"businessUnits:bu-1"},records));
const movedRisk={...risks,assessments:risks.assessments.map(a=>a.id==="RA-LAD001"?{...a,reviewDate:incm.addDays(rm.today(),90)}:a)};
assert(!f.fieldReminders(f.fieldDueItems(movedRisk,inspections),sj.initialScheduledJobs,records).some(i=>i.id==="RA-LAD001"));
let ladder=structuredClone(inspections.inspections.find(i=>i.id==="INS-LAD001"));ladder.performed=rm.today();ladder.summary="All checks completed; equipment ready for the approved task.";for(const q of im.inspectionQuestions(ladder))ladder.checks[q.id]={...im.emptyCheck(ladder),answer:"Yes",result:"Pass"};
ladder=im.completeInspection(ladder,records,incidents,risks);
assert(!f.fieldDueItems(risks,{inspections:[ladder]}).some(i=>i.id===ladder.id));
const next=im.nextQrInspection(ladder,incm.addDays(rm.today(),30),initialForms,inspections,records);assert.equal(f.inspectionLabelId(next),ladder.id);assert.equal(im.inspectionProgress(next),0);assert.equal(next.inspector,ladder.inspector);assert.equal(next.completedAt,"");
const family={inspections:[ladder,next]};assert.equal(f.resolveQrInspection(family,ladder.id).id,next.id);assert.deepEqual(next.evidence,[]);assert.deepEqual(next.checks,{});
assert.throws(()=>im.nextQrInspection(ladder,rm.today(),initialForms,inspections,records),/future/);assert.throws(()=>im.nextQrInspection(ladder,incm.addDays(rm.today(),30),initialForms,family,records),/outstanding/);
assert.throws(()=>im.nextQrInspection(ladder,incm.addDays(rm.today(),30),initialForms.map(x=>x.id===ladder.template.id?{...x,status:"Draft"}:x),inspections,records),/Publish/);
const fallback={inspections:[ladder,{...next,active:false}]};assert.equal(f.resolveQrInspection(fallback,ladder.id).id,ladder.id);assert.equal(f.resolveQrInspection(fallback,"INS-MISSING"),undefined);
const preview=sj.jobPreview(sj.initialScheduledJobs.find(j=>j.id==="job-fieldwork"),records,items);assert(preview.some(i=>i.id==="INS-LAD001"&&i.owner==="Priya"));assert(preview.some(i=>i.id==="RA-LAD001"));
async function actualDecode(){
 const qr=require("qrcode");const png=require(require.resolve("pngjs",{paths:[path.dirname(require.resolve("qrcode"))]}));const zx=require(require.resolve("@zxing/library",{paths:[path.dirname(require.resolve("@zxing/browser"))]}));
 for(const kind of ["risk","inspection"]){const link=f.qrUrl(base,{kind,id:kind==="risk"?"RA-LAD001":"INS-LAD001"});const bytes=await qr.toBuffer(link,{width:360,margin:4,errorCorrectionLevel:"M"});const image=png.PNG.sync.read(bytes);const gray=new Uint8ClampedArray(image.width*image.height);for(let n=0;n<gray.length;n++){const j=n*4;gray[n]=(image.data[j]+2*image.data[j+1]+image.data[j+2])/4;}const bitmap=new zx.BinaryBitmap(new zx.HybridBinarizer(new zx.RGBLuminanceSource(gray,image.width,image.height)));assert.equal(new zx.QRCodeReader().decode(bitmap).getText(),link);
 // A local fixture for the browser's actual image-scanning path.
 if(kind==="inspection")fs.writeFileSync(path.resolve("docs/ladder-qr-test.png"),await qr.toBuffer(f.qrUrl("http://127.0.0.1:3001/",{kind,id:"INS-LAD001"}),{width:360,margin:4,errorCorrectionLevel:"M"}));}
 console.log("QR and reminder checks passed: real PNG encode/decode, validated links, owner/scope rules, live scheduler previews, next-date scheduling and stable labels.");
}
actualDecode().catch(e=>{console.error(e);process.exitCode=1});
