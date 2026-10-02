# Incident module implementation reference

This is the compact working specification distilled from all 19 HTML documents in `incident/`. Read this file for implementation; `incident-source-text.md` preserves the extracted prose for targeted checks. The two workflow diagrams were inspected and saved in `incident-reference-images/`.

## Product and prototype boundaries

- One tenant, Northstar, presented as `admin@northstar.example`. All functions available to this administrator; permission enforcement is future production work.
- Use the existing modern, responsive workspace design and organisation hierarchy: business unit → site → location → department.
- State is held in the workspace session. Reload/sign-out restores sample records. File inputs store filenames only. No mail, regulatory submission, automatic scheduling or real restricted access.
- Incident report and Investigation questions come from **published Incident forms in Form Builder**. Add a purpose discriminator. Snapshot the published form when starting a record so later edits do not alter existing answers. Common workflow metadata (type, department, assignments, status) is separate from configurable questions.
- Existing Form Builder supports headings, ordering, reusable fields, required questions, options and help. Extend Incident field settings with site visibility, searchable/exportable flags. System fields remain required. New report/investigation templates must have the right mandatory fields.

## Source map

| Sources (prefix `INCIDENT_`) | Relevant behaviour |
| --- | --- |
| Main things you need to know; Incident Process Flow; Tracking Incidents to Closure | Lifecycle and action effectiveness loop |
| Recording an Incident; Restricting Access to an Incident | Recording, people, confidential flags, investigation, reporting, losses, evidence and reopening |
| Corrective Actions & Tasks | Corrective/preventive actions, shared actions, child tasks, completion gates, trend-based prevention |
| Searching for Incidents; Export to Excel; Incident Module Reports | Search, advanced filters, results, five standard reports and export |
| Configuration of the Incident Module; Incident Sub-types; Creating a new group (Incident Types); Cause Types | Type settings, subtypes, cause groups, active/inactive configuration |
| Configuring the Incident & Investigation Forms; Configure Question Sites; View Site Template | Two form purposes, site-specific questions and previews |
| Making a question mandatory, searchable or exportable to excel; Specify Excel Layout; Removing_ deactivating questions from Incident and Investigation templates | Question flags, ordered export columns, reportees and preserving history |

## Lifecycle

Recorded/open (no investigation) → Investigation in progress → Investigation completed (action required) → Action in progress → Action completed (awaiting effectiveness review) → Complete and effective. A finding of ineffectiveness loops back to further actions. The diagram also allows completion without investigation or without actions where policy permits. Preserve an explicit closure gate and close note, instead of silently closing a record.

Prototype statuses are derived from linked actions rather than independently editable: Draft, Open, Investigating, Action required, Action in progress, Awaiting effectiveness, Follow-up required, Ready to close, Closed. Archived is a separate active flag. Reopening preserves history. Action completion requires every child task complete, completion note, reviewer and review date. Effectiveness review is a separate step; an ineffective action blocks incident closure until a linked follow-up is effective. Investigation reopening blocks closure again.

## Record and investigation

Report metadata: reference; incident type/subtype; severity Minor/Major/Critical; occurred date/time; department (derive location/site/unit); shift; precise location; immediate action; first aid/treatment/outcome; nurse notified; reporter; assigned users; additional internal people to notify; investigation due date; active/confidential flags; evidence names/links; history. People involved repeaters: name (Unknown permitted), kind (Employee, Temporary worker, Contractor, Visitor, Public, Young person, Supplier), involvement (Injured, Witness, Other), injury details and department. Require at least one person when reporting.

Investigation: snapshot of published Investigation form; investigator; H&S impact and hazard group; environmental impact with aspect/impact; environmental duration and minutes/hours/days; multiple causes grouped by Equipment, Materials, Methods, People, Workplace; cause details/root cause narrative; reportable flag and selected reportees; days-lost periods (from/to, absence type, note) and operating hours lost; action required; close note; evidence; start/complete/reopen states. Completing a required investigation requires its mandatory answers, causes and a closing decision. A reportable finding requires a reportee. Regulatory notification is recorded intent only.

## Corrective and preventive actions and tasks

Action: one or multiple linked incidents; Corrective/Preventive; description; CAPA category; priority; owner; department; due date; attachments; child tasks; completion note; effectiveness reviewer/date/result/note. Allow linking an existing action from incident detail. Tasks belong to actions, have description, priority, owner, department, due date, completion note and evidence. Incident detail shows actions; action detail shows tasks. Keep completed and reviewed distinct. Ineffective → create a linked follow-up. Do not let an ineffective action disappear from closure checks.

Trend prevention: select date range plus type/subtype/cause (department also supported); preview matching records; group chart by type/subtype/severity/department/cause; create a Preventive action with immutable initial criteria and matched references. Refresh its snapshot explicitly; do not implicitly broaden linked incidents.

## Settings and reporting

Standard source types: Accident, Complaint, Non Compliance, Dangerous Occurrence, Inspection Finding, Environmental Incident, Near Miss, Audit Non Conformance, Safety Comment. Keep names fixed; edit active state/subtypes/settings. Audit/data-created findings are future cross-module integrations, not implemented imports.

Per-type settings: active; single/multiple assigned users; assignment required; investigation enabled/required; default confidential; attachments allowed; investigation target days; report/investigation template binding. Choose only published forms of matching purpose. Optional site-specific form questions are configured in Form Builder; preview the applicable questions in Incident settings. Old records retain original snapshot.

Cause groups use active/inactive entries; old selections survive deactivation. Reportees include internal/external names and destinations, active/inactive. Confidential flags are recorded/displayed for the admin, with a clear prototype note.

Registers: free text/reference search and advanced type, subtype, severity, status, date, owner and site filters; paginated lists; linked detail pages. Searchable custom form answers participate only when marked searchable. Ordered CSV columns include exportable custom questions; neutralize spreadsheet formulas in exports. Source Excel/PDF/ODF formatting is adapted to CSV and browser print in this prototype.

Five source reports: Incidents by type/subtype; Incidents by cause; Man days lost by department; Action & task tracking; Incident tracking. The prototype provides date and site filters, charts and supporting tables, CSV and print. Its days-lost calculation uses inclusive calendar days and excludes restricted duties; production working-day calendars remain future work. The overview has four charts, counts from the current session and priority queues.

The source type named Incident is presented as Environmental Incident to make its purpose clear. Per-person departments and structured injury taxonomies, legal requirement matching, granular confidential-field access, recurring actions, source Excel/ODF layouts and real notification delivery remain future work. People currently inherit the event's organisational context; injury details are free text. These adaptations do not represent production authorization or compliance rules.

## Acceptance walkthrough

1. Publish an Incident report and an Investigation form with a custom required question, then choose them in type settings or when recording/investigating.
2. Record a near miss, choose a real department and assigned investigator, answer the selected report, add a witness; confirm derived hierarchy and template version.
3. Start/complete investigation with impact, causes, reportee where applicable and action-required decision.
4. Raise/link a corrective action; add a task. Action completion is blocked until task completion. Complete action with reviewer/date; confirm awaiting effectiveness state.
5. Review as ineffective; closure is blocked. Create follow-up, complete it and verify effective; then explicitly close incident with note. Reopen investigation and confirm it needs closure again.
6. Preview a trend, create preventive action with matched-reference snapshot, refresh it; export filtered records and inspect five reports.
7. Confirm draft forms are unavailable, site-hidden custom fields are not required, inactive configuration is excluded from new choices but old values remain readable, and mobile pages have no horizontal page overflow.
