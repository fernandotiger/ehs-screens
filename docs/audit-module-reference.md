# Audit module implementation reference

## Evidence and source handling

Reviewed 29 saved HTML files in `audit/`, reduced to 25 unique article bodies in `audit-source-text.md`. The source archive retains all filenames. Selected screenshots are in `audit-reference-images/`; especially Scorable-Audit-3 (question score bounds), Scorable-Audit-7 (group totals / finding closure), Setting-up-Audits-1 (schedule fields), Setting-up-Audits-3 (recurrence / notification lead) and the three trash restriction screenshots.

Core sources: Getting Started; Planning & Carrying Out Audits; Audit Plans; Audit Programme Types; Audit Programmes; Setting up Audits; Standard Type; Scorable Audit; Express Type; Audit Templates; Configure Template Sites; Apply to App; Incidents from Major NC assigned to auditee; Recurring Audits; Third Party Auditees; Audit Reports; Export to Excel; Trashing Plans, Programmes & Audits. Other articles provide navigation or duplicate these workflows.

## Structure

Audit Plan → Audit Programme → individual Audits. Plans cover one or several calendar years and business areas (Health & Safety, Environment, Quality / Business). These areas describe a subject/domain; they are separate from the customer's organisational business units. Audit departments resolve through location → site → business unit.

Programmes have a plan, type, owner, description, review date and optional default template. Programme types specify Standard or Express. Scorable is a Standard template option. Supplier / contractor people are managed as third-party auditees. Employees are existing users. Plans cannot change their start year once programmes exist, and end-year changes cannot invalidate programme reviews or audits. Programmes close after their audits are completed and recurring rules are paused.

## Forms are the template authority

Only published Audit forms from Configuration → Form Builder can schedule new audits. Snapshot the published version and applicable fields on creation; subsequent drafts or republishing do not change existing audits. Builder settings: Standard / Scorable / Express, default finding type, site availability, mobile availability, assign major NC incidents to employee auditee. System fields describe title, site, date, lead auditor and scope; custom fields are audit questions, section headings group them. Guidance supports legal/reference text. Every Scorable question has minimum, maximum and increment; validate finite bounds and reachable maximum. N/A excludes that question from the denominator. Score = sum of entered scores / sum of applicable maxima × 100, shown per section and overall. A default finding is a suggestion; it never counts as an answered question.

Auditors may add local questions. A separate explicit action copies the audit's snapshot into a new Form Builder draft for future reuse; it does not alter a published form. Template site restrictions are enforced at selection and question site restrictions at snapshot creation. Mobile availability represents web access in this prototype, not a native app integration.

## Scheduling and execution

Schedule requires active programme, compatible published template with questions, lead auditor, department/site, employee or active third-party auditee, start date/time inside the plan period, positive duration / minutes-hours-days, and scope. Additional fields: secondary auditors, people observed, participants and notes. Express can be scheduled or ad hoc. Standard / Scorable must be scheduled. Changes to metadata retain question progress and the original template snapshot. Audit searches support name/ref, plan/programme, site/department, auditor/auditee, method, status and date range, with pagination and CSV.

Audits have questionnaire, details/evidence and history views. Answer All renders the actual builder component types. Each question records answer, finding classification, comment and optional score. Classifications: Conforming, Observation, Insufficient Finding, Opportunity for Improvement, Minor Non Conformance, Major Non Conformance, Not Applicable, Good Practice. Standard findings count towards completion only when recorded and closed; closed findings become immutable. Express counts saved answers, supports send for review and reviewer comments. N/A waives answer and score but requires an explanatory comment. Non-conforming / insufficient findings require comments. Closing an audit requires all questions completed and a closing note. Audit completion records completion of the inspection; linked corrective/preventive work remains tracked separately in Incident.

Insufficient Finding creates an unresolved Audit Trail. A subsequent audit in the same programme lineage can explicitly carry a trail item into its questionnaire. Carrying it is deduplicated; a closed, conclusive later finding resolves the trail. Audits with outstanding trails may complete.

## Incident integration

The specific Standard Type and Planning sources take precedence over the less precise Actions arising from Audits article:

| Closed finding | Generated record |
| --- | --- |
| Major Non Conformance | Incident, type Audit Non Conformance, requiring investigation |
| Minor Non Conformance | Corrective action |
| Opportunity for Improvement | Preventive action |
| Insufficient Finding | Audit Trail |

Generate on confirmed finding closure (Express: review) to avoid draft churn. Deduplicate using audit ID + question ID, maintain provenance and direct links. Use a published Incident Report template configured for Audit Non Conformance; block routed closure if it is unavailable or the incident type is inactive. Fill known template fields from the finding; if additional mandatory fields remain unanswered, the generated incident is honestly a Draft. Assign Major NC to employee auditee only when enabled; third parties fall back to lead auditor. Corrective/preventive actions use auditee or lead auditor and the audit department. Their task / effectiveness workflow stays in Incident.

## Recurrence

Rules copy audit scheduling metadata, plus initial date/time, frequency, lead days, active flag and optional end date. Supported demo frequencies: daily, weekly, monthly, quarterly, annually. Calculate each occurrence from the original anchor; clamp month-end dates without drifting (31 January → 28 February → 31 March). Notification date = occurrence minus lead days. Date/time is a tenant-local wall-clock preview; production timezone / DST processing remains future work.

Preview and explicitly generate up to 12 upcoming occurrences; no background scheduling or actual emails. Generation is idempotent by rule ID + occurrence time. Changes affect future unscheduled occurrences only. Beyond the original plan period, reuse/create an annual plan and matching programme marked Scheduler. This represents source rollover behaviour without claiming a running service.

## Archiving and reports

Reversible archive/restore preserves history. Block archive of completed audits/programmes or any records with related incidents/actions; parents require children and rules to be archived/paused first. No hidden cascading deletion.

Reports: Audit Count by Department, Audit Scores Summary by Programme, Express Answers by Question. A completed audit provides a printable Action Report (questions, findings, scores, follow-ups). Hard Copy prints blank question answers for fieldwork. CSV exports are the prototype equivalent of source Excel exports; browser printing can save PDF.

## Pages and prototype constraints

Overview (admin's responsibilities / all workspace; at most four charts), Plans, Programmes, Audits, Findings & audit trail, Recurring schedules, Templates, Reports, Settings (programme types / third parties).

Demo identity: admin@northstar.example (Alex Morgan). No authorisation gates. Data is workspace state, survives navigation, resets on reload/sign-out. Evidence stores filenames / HTTP(S) reference links only. No uploaded binary persistence, real emails, cron service or regulatory reporting.

## Verification journey

1. Open sample Scorable audit, record findings, confirm N/A exclusion, close Major/Minor/improvement findings and open their Incident records; repeat saving without duplicates.
2. Complete Standard questions, verify locked findings and closing-note gate; audit closes while linked follow-up remains open.
3. Complete Express answers, send for review, reviewer records findings and review; metadata edits retain progress.
4. Create/publish a new Audit form; schedule from it; existing audits retain snapshots.
5. Preview/generate monthly recurrence spanning year end, verify anchored month-end dates, rollover and duplicate prevention.
6. Carry forward insufficient evidence, resolve with a later conclusive finding, verify archive restrictions and filtered exports.
