# OleoQ first-access and workspace prototype

A presentation prototype built with Next.js. It uses the supplied OleoQ palette and a transparent version of the supplied logo, and draws on the SCANNELL admin reference files for modular access, multisite structure and identity concepts.

## Run

```bash
pnpm install
pnpm dev
```

Open http://127.0.0.1:3000.

## Demo journey

1. Enter the invitation code **482916**.
2. Sign in with **admin@northstar.example** and **Demo123!**.
3. Explore the workspace menus and Configuration submenus. You can create sample business units, sites, locations, departments, users and roles in browser memory.
4. Open **Configuration → Bulk import** to download a CSV template, upload it, review validation, and add the rows to the demo workspace.
5. Open **Workspace → Insights** for four charts showing active users, users by role, company structure and sample module activity. The people and structure charts reflect changes made through Configuration or Bulk import.
6. Open **Configuration → Roles & permissions**. The Roles view has search and a compact editor; the Assignments view has user and scope search, filters, and paginated results. Give users multiple roles at different organisation scopes. Sam O'Brien has two example site assignments.
7. Open **Configuration → Form Builder**. The **Forms** tab lists existing designs and previews the selected form. In **Create form**, enter a name and choose Risk, Incident, Audit, Inspection, Document or Law. The builder supplies required module fields; drag components from the right palette onto the canvas, or use **Add** on touch devices. Search **Reuse a created field** to copy a custom field from another form, including its settings, to the end of the current form. Select a field to edit its label, help text, required state and choice options. Reorder fields by dragging or with the arrow buttons, preview the result and publish a demo version. The example Form Designer role can draft; publishing is a separate permission.

8. Open **Configuration → Scheduled jobs** to configure daily overdue reminders, upcoming reviews, escalations or a summary digest. Choose daily, weekday, weekly or monthly schedules, a time zone, organisation scope, record types, recipient roles and notification channels. Save or pause a job, inspect its generated cron expression, and use **Test job** to preview matching sample records. The **Run history** tab shows illustrative scheduled results plus your test previews. Jobs and history survive navigation within the session; tests do not send notifications.

9. Open **Risk → Overview** to explore the complete Risk presentation. **Risk assessments** offers search, template selection and a three-step scope → analysis → approval flow using published Form Builder Risk forms. Demonstrate multi-hazard/aspect scoring, FMEA, custom questions, periodic reviews, cloning, archiving and history. Under **Tasks**, complete the sample quotation sub-task, then complete its parent pedestrian-barrier task with an actual likelihood of 2: RA-1042 drops from 20 to 10 and records revision 2. Create **Objectives**, measurable **Targets**, and **Management programmes** with linked RA/MP tasks. **Risk matrix** configures template thresholds, review rules and site availability; **Reports** produces live tables, CSV downloads and browser printouts. No user authorisation is applied to these Risk demo screens.

The credentials and code are for demonstration only. All data resets when the page reloads. No real tenant, background scheduler, email, authentication, billing or AI backend is connected.

## Incident module presentation

Open **Incident → Overview** for the new module, with Incidents, Investigations, Actions, Tasks, Trends & prevention, Reports and Settings. The implementation uses the 19 supplied HTML documents and their workflow diagrams. The compact working specification is [docs/incident-module-reference.md](docs/incident-module-reference.md); extracted source prose is in [docs/incident-source-text.md](docs/incident-source-text.md) for targeted follow-up checks.

- Reports and investigations use published **Form Builder** forms with separate Report and Investigation purposes. Custom questions support site visibility, required answers, search and CSV inclusion. Existing records preserve their template version.
- Record event details, department and derived hierarchy, investigators, people, immediate response, confidentiality and evidence. Save drafts, submit, edit, archive and restore. Search with advanced filters, sorting, pagination and CSV export.
- Investigations capture safety/environmental impacts, grouped causes, intended reportees, absence periods, operating hours lost, evidence and the action-required decision. Save progress, complete or reopen. Reportable findings require a reportee; no reports are actually sent.
- Share corrective/preventive actions across incidents and add child tasks. Every task must complete before its action. Action completion requires a comment, reviewer and review date. Effectiveness is a separate step; ineffective actions require a verified follow-up. Incident closure requires a note and successful workflow checks. Reopening an investigation reopens its incident.
- Preview incident trends and create preventive actions with saved criteria and matching-record snapshots. Refresh snapshots explicitly. Closed matches remain trend evidence; open matches are initially associated with the action.
- Five reports cover type/subtype, causes, calendar days lost by department, action/task tracking and incident progress. Incident reports use event dates; action/task reports use due dates. Days lost use inclusive calendar days and exclude restricted duties. Export CSV or print/save PDF in the browser.
- Settings manage standard types, active/inactive subtypes, assignments, investigation requirements, confidentiality, evidence availability, target days, published template bindings and site previews. Configure causes, reportees and ordered export columns. Inactive selections remain readable in old records; CSV exports neutralize spreadsheet formulas.

The administrator can use every screen without authorization gates. Changes reset on reload/sign-out. Evidence stores names/references, not files. Legal matching, granular confidentiality, recurring actions, working-day calendars, native Excel/ODF exports, durable history and real notifications remain production work. Scheduled jobs still evaluate their illustrative sample records.

## Audit module presentation

Open **Audit → Overview**. Nine pages cover Overview, Audit plans, Programmes, Audits, Findings & audit trail, Recurring schedules, Templates, Reports and Settings. Research is condensed in [docs/audit-module-reference.md](docs/audit-module-reference.md), with a deduplicated 29-file / 25-article archive in [docs/audit-source-text.md](docs/audit-source-text.md).

- **Plans → programmes → audits:** create annual/multiyear plans, select business areas, configure programme types and owners, and schedule employee or third-party audits. Departments derive the site/location/business-unit hierarchy. Search, advanced filters, sorting, pagination and CSV are available in the audit register.
- **Form Builder supplies the templates:** publish Audit forms as Standard, Scorable or Express. Use sections, guidance, reusable components, question/site visibility, scoring bounds and increments, mobile-web availability and finding defaults. Three published starter forms are supplied. Existing audits keep their template snapshot. Extra audit questions can be copied into a new builder draft.
- **Carry out the audit:** answer one question or all, classify findings, add comments/scores and confirm. Confirmation locks a finding. Major NC creates an Incident; Minor NC creates a corrective action; Opportunity for Improvement creates a preventive action. Links open the relevant Incident record and return to its source audit. Additional required Incident questions leave the generated report as a Draft; unavailable templates block major finding closure. Follow-up actions use the existing task and effectiveness workflow.
- **Scorable / Express:** N/A is excluded from the denominator; saved totals show section and overall scores. Express supports save progress, send for review, reviewer decisions and follow-up generation. Editing its schedule preserves progress. Audit completion requires all questions and a closing note; it does not imply that related CAPA work is complete.
- **Audit trail:** insufficient evidence can be revisited in a later audit in the same programme lineage. Explicit carry-forward adds a question; a conclusive confirmed finding resolves the source trail.
- **Recurring schedules:** preview/generate up to 12 occurrences manually, choose daily/weekly/monthly/quarterly/annual frequency, lead days and an optional end date, and pause/resume. Anchored month-end dates, duplicate prevention and annual plan/programme rollover are implemented. Date/time is a tenant-local preview, not a running cron service.
- **Reports / settings:** department audit counts, programme score summaries, Express answers by question, completed action reports and blank fieldwork copies. Print/save PDF in the browser or export CSV. Configure programme types and third-party auditees. Reversible archive/restore retains completed records and Incident-linked records.

Suggested demonstration: open **Dublin · 5S & safety review**, record a Major NC, Minor NC and improvement with scores, mark the remaining question N/A, then complete with a closing note. Open the generated records in Incident. Try **Cork · weekly walkabout** for Express review and **Management controls · Dublin** for the audit trail. Use Form Builder to publish your own Audit checklist.

Verification: `pnpm typecheck`, `pnpm build`, and `node scripts/check-audit.cjs`. Browser exercises covered finding routing and direct links, Scorable N/A totals, Express review, schedule progress retention, Form Builder publication/consumption, recurrence rollover and repeated generation. This remains an admin-only, in-memory presentation; evidence keeps names/references, and emails/background execution are not connected.

## Risk user guide

Open `/risk-user-guide.html` on the prototype server, or double-click `public/risk-user-guide.html` to read the standalone HTML guide without a server. It includes a 10-minute exercise using the sample forklift assessment, instructions for every Risk page, fictitious team roles and suggested responsibilities, scope examples, search, role-specific reading routes, a practice checklist and print styles. The guide distinguishes its proposed team responsibilities from the current admin-only demo.

## Incident and Audit user guides

Open `/incident-user-guide.html` or `/audit-user-guide.html` on the prototype server. Both are standalone HTML files in `public`, so they can also be opened directly without a server. They follow the Risk guide's visual style, with chapter navigation, search, fictitious users and scoped responsibility examples, role-specific reading routes, saved practice checklists, mobile layouts and print / PDF styles.

The Incident guide starts with an effectiveness review and closure exercise using INC-252 / ACT-090, then explains reporting, investigations, shared actions, tasks, prevention and reports. The Audit guide uses AUD-104 for a scored audit exercise, then explains Form Builder templates, plans and programmes, scheduling, finding-to-Incident links, Express reviews, audit trails, recurring schedules and reports. Both distinguish suggested permissions from the admin-only demo and explain its in-memory data and integration limitations.

To regenerate these two guides after editing their source, run `python scripts/build-user-guides.py`. The script reuses the existing Risk guide's inline theme and interactions; the generated files have no external dependencies.

### Bulk import format

The single CSV file uses `type,key,name,parent_key,email,permissions,notes`. Supported types are `business_unit`, `site`, `location`, `department`, `role`, `user`, `template` and `category`. `parent_key` references another row's `key` or the exact name of an existing parent. For roles, separate action IDs such as `risk.view;risk.create` with semicolons; legacy module names grant view only. The page validates the whole file before adding any rows and keeps existing data. Imported users need an explicit scope and role assignment on the Roles & permissions page. The upload is processed only in browser memory in this prototype.

## Law module presentation

Open **Law → Overview**. Eight pages cover Overview, Legal profiles, Legislation, Compliance checklists, Tasks, Changes & updates, Other requirements and Reports. The 36 supplied files (34 unique topics) are condensed in [docs/law-module-reference.md](docs/law-module-reference.md); extracted source text is archived in [docs/law-source-text.md](docs/law-source-text.md).

- **Profiles:** choose a site and operational activities to build a scoped register. Create/edit, share, archive/restore and hide/show self-assessed ratings. The fictional Irish catalogue illustrates primary, secondary and tertiary legislation, synopsis, source portals, related checklists and version history.
- **Compliance:** record relevance and controls separately from evaluation evidence. Assign an owner, department and next review; optionally record a 0–100 self-assessment. Excluding a checklist requires a reason and preserves its existing records. Completed evaluation narratives and compliance ratings are separate measures. Add evidence references, tasks and other company requirements using the same evaluation workflow.
- **Risk and Incident integration:** link existing site records by their actual IDs, open them directly, and return through the Legal compliance panel. Create a Non Compliance incident from a published Form Builder Incident report, retaining the form version and originating checklist. Generated reports start as Drafts for completion of required answers. Create corrective actions from the checklist without needing an incident; follow-up actions retain their legal origin.
- **Updates:** preview a sample 2026.Q4 JSON package in Content library, then install it. Installing content does not update individual profiles. Accept the update separately for each profile; evidence, tasks and links survive. Amended requirements or associated legislation flag evaluations for explicit review. Uploaded JSON packages are validated before preview/install.
- **Tasks/reports:** assign owners, departments, priority and due dates; completion requires a comment. Archive/restore retains history. Reports cover the compliance register, task tracking and cross-module links, with search, filters, CSV downloads and browser print/PDF.

Suggested demonstration: select **Cork · distribution compliance**, open **Workplace transport controls**, then use **Risk & Incident** to open RA-1042 / INC-261 or create a draft incident and corrective action. Install the sample update under Changes & updates, accept it for Cork, and revisit the flagged evaluation. Dublin retains its accepted version until separately updated.

Verification: `pnpm typecheck`, `pnpm build`, `node scripts/check-law.cjs` and `node scripts/check-audit.cjs`. Legal text is deliberately fictional demonstration content, not an up-to-date legal subscription. This remains an admin-only presentation with in-memory data, file names/references for evidence, and no legal feed, emails or background execution.

## Shared dropdown controls

All prototype selects use `app/select.tsx`: an in-page listbox replaces the transient native menu in the embedded browser. It supports click/touch selection, arrow keys, Home/End, typing an option name, Enter, Escape, Tab, disabled options and required-field validation. A hidden native select retains existing change handlers and form values. Menus render above dialogs and reposition within the viewport.

## Law user guide

Open `/law-user-guide.html` on the prototype server, or double-click `public/law-user-guide.html` to read the standalone HTML without a server. Fourteen chapters use the Risk guide theme and cover profiles, relevance/evaluation, evidence, Law tasks, Risk/Incident links, company commitments, updates, dashboard numbers and reports. The Cork practice exercise follows CL-001, LT-001, RA-1042 and INC-261.

Fictitious team roles illustrate scoped responsibilities and multiple role assignments; Alex remains the sole working demo login. Role-specific reading buttons, chapter search, a saved practice checklist, mobile layouts and print/PDF styles make the guide easy to navigate. It distinguishes evaluation completion from compliance ratings, library installation from profile acceptance, and Law tasks from Incident actions.

Regenerate only this guide with `python scripts/build-law-user-guide.py`, or all Incident/Audit/Law guides with `python scripts/build-user-guides.py`. No external scripts or styles are required.


## Inspection module presentation

Open **Inspection → Overview**. Five pages cover **Overview, Inspections, Findings, Templates and Reports**. This is a deliberately simple routine-check workflow: schedule → observe → respond → complete fieldwork → track corrective work. The general approach follows [OSHA hazard identification guidance](https://www.osha.gov/safety-management/hazard-identification); the starter questions are demonstration content, not equipment-specific procedures.

- **Templates:** the shared Form Builder supplies published Inspection forms. Workplace inspection and Equipment pre-use check are included. Custom field types, ordering, reuse and site visibility work through the existing builder. Positive Yes / No wording makes Yes a pass and No an issue. Other field types have explicit Pass / Needs attention / N/A outcomes. Each scheduled inspection captures its form version; publishing changes affects new inspections only.
- **Schedule:** choose title, department, inspector, date, area/equipment and instructions. Department inherits location → site → business unit. Registers support search, site/status/person filters and pagination. Schedules can be edited without discarding recorded work; department and captured template remain fixed. Repeat creates a fresh inspection with the current published form, not an automatic recurring job.
- **Conduct:** record actual inspection date, answers, results, observations and evidence references. N/A needs a reason. An issue needs an observation and response; Critical needs an immediate response. Save incomplete progress, or complete after all checks and a closing summary. Completed observations are read-only.
- **Follow-up:** record a correction on site, create an Incident corrective action, or create an Inspection Finding Incident draft using the active type's configured published report template. Required Incident answers and submission remain in Incident. Created records retain the originating inspection, question and observation. Creation is deduplicated, and original observations lock when routed. Action tasks and effectiveness checks use the existing Incident workflow; follow-up actions retain their inspection source.
- **Risk:** link an existing assessment from the same site. Inspection findings open that exact assessment, and Risk/Incident records open the source inspection and highlight the relevant check. Linking does not alter the assessment score.
- **Findings:** a completed inspection can still have open actions. Finding status, owner and due date follow the live linked record. Actions resolve after effectiveness verification (including verified follow-up to ineffective actions); incidents resolve after closure. Archiving retains inspection findings and source links. Restore is available.
- **Reports:** filtered inspection register and finding register export to CSV with formula-safe cells. Four overview metrics show work to complete, overdue inspections, open findings and completed fieldwork. Home, subscription display and the role permission catalogue include Inspection; authorization is not enforced in the demo.

Suggested demonstration: open **INS-101 / Cork loading bay**, finish the PPE and storage checks, create the corrective action for worn pedestrian markings, enter a closing summary, and complete. The finding stays open. Open its Incident action or linked **RA-1042** and return to the highlighted source check. Sam O'Brien, Priya Shah and Alex Morgan illustrate inspectors/action owners; the working login remains `admin@northstar.example`.

Checks: `pnpm typecheck`, `pnpm build`, `node scripts/check-inspection.cjs`, plus the Audit and Law workflow checks. Browser verification covers completion safeguards, corrective action and Incident draft creation, source navigation, publication/version retention, repeat scheduling and a 390px mobile layout. CSV generation is checked separately; the embedded browser did not expose a completed-download event.

All data remains in memory and resets on reload/sign-out. Evidence stores filenames and references; notifications, real uploads and automatic inspection recurrence are not connected. Scheduled Jobs uses live Risk review and Inspection due dates, with illustrative records for other modules.


## QR labels and mobile fieldwork

Risk assessment and Inspection details have a **QR label** button: preview, print, download an SVG equipment label, copy its link or test it. The label contains a workspace record reference, requires sign-in and does not grant permission. Use a deployed HTTPS address for phone access; localhost only works on the computer running the app.

**Workspace > Scan QR label** (also available in the top bar) supports a rear phone camera, a QR image or a typed reference. Image/camera decoding happens on the device. Direct QR links go through demo sign-in, then open the specific questionnaire or the periodic review form for an approved assessment. Foreign workspace/origin links and missing references are rejected.

Try **INS-LAD001**, assigned to Priya Shah, and **RA-LAD001**. The published **Ladder condition check** comes from Form Builder. Complete its three checks and closing summary, optionally entering a future **Next inspection date**. This creates a fresh scheduled questionnaire for the same equipment and inspector. Repeat inspection also retains the original label; scanning it opens the earliest outstanding check, or the most recent completed check when none is outstanding. Schedule different equipment with **New inspection** so it receives its own label.

The bell displays live overdue/upcoming Risk reviews and Inspections, filtered by responsible person. Enabled Scheduled Jobs rules determine scope, target types, lead days and owner/in-app delivery; the default equipment rule covers the next seven days. Review-date changes and inspection completion update the preview. Production background execution, durable tenant records, permission enforcement and email delivery still require the backend. Demo changes reset on reload and are not shared across phones.

Verification: `node scripts/check-field-access.cjs` checks actual QR encoding/decoding, safe links, owners/scopes/reminder rules and fresh repeat questionnaires retaining their label. QR generation uses [node-qrcode](https://github.com/soldair/node-qrcode); mobile/image scanning uses [ZXing Browser](https://github.com/zxing-js/browser).


## Inspection guide and Risk QR update

Open `/inspection-user-guide.html` or double-click `public/inspection-user-guide.html`. The standalone guide follows the Risk guide theme, with 14 chapters, chapter search, fictitious roles and scoped responsibilities, role reading routes, saved practice ticks and print styles. Its first exercise uses INS-LAD001 to demonstrate questionnaire completion, next-date scheduling and QR label reuse. A second INS-101 exercise introduces corrective work in Incident; chapters cover Form Builder, findings, Risk links, reports and reminder previews.

The Risk guide now includes a QR/fieldwork chapter, RA-LAD001 review exercise, responsible-person reminder filtering, stable assessment labels and phone/backend limitations. Both guides explain the distinction between live reminder previews and real background/email delivery.

Regenerate these two with `python scripts/build-fieldwork-user-guides.py`. The all-guide command `python scripts/build-user-guides.py` also includes them.
