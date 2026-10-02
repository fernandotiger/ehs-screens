# OleoQ navigation concept

This prototype shows the first three screens of a new customer journey:

1. **Invitation code:** the first administrator enters the code from an email.
2. **Admin sign in:** the administrator enters their login and password.
3. **Workspace home:** the user sees Risk, Incident, Audit, Document, Law and Configuration in the main menu.

Each module expands to its main search views. Configuration expands to organisation structure, users, roles and permissions, templates, categories, branding, subscription, identity, help videos and AI settings. The search and configuration views contain presentation data so the navigation can be demonstrated.

**Workspace insights** shows four charts: active users, users by role, company structure, and an illustrative module overview. The first three use the current in-memory configuration records. Module counts are sample figures until the five modules have real data sources. Insights cover the whole workspace across all sites.

**Roles & permissions** separates actions from scope. Each role has specific actions for Risk, Incident, Audit & Inspection, Document, Law, Form Builder and Configuration. A user can have multiple role assignments, each limited to the company, a business unit, a site, a location or a department. A selected level conceptually includes its children. Sam's sample assignments show Site Manager at Dublin Plant and Auditor at Cork Distribution. The current prototype stores these choices in browser memory; it does not enforce them on module operations.

For larger customers, Roles and Assignments use separate views. Roles can be searched without scanning a long list. Assignments use a name or email search to select one user, a searchable scope picker, role and scope filters, and 20-row pagination. Only visible results are rendered. A production version should do the filtering and pagination in tenant-scoped server queries.

**Form Builder** sits under Configuration beside Templates. Its Forms tab lists saved designs and previews the selected form. The Create form tab collects a name and target module, then starts a draft with required fields suited to Risk, Incident, Audit, Inspection, Document or Law. Admins can drag fields from a component palette to the canvas, use Add on touch devices, reorder any fields and configure labels, help text, placeholders and dropdown or multiple choice options. The Components panel also searches custom fields across existing forms by partial field name. Selecting a result copies its configuration to the end of the current form with a new field ID, so later edits do not change the source. Required module fields cannot be removed or copied as custom fields. Form Designer can view and edit drafts, while publishing a version requires a separate permission. Risk assessments consume published Risk form schemas and retain a snapshot of their version, custom questions and scoring rules. Other modules do not yet consume these schemas. Form Builder itself still requires durable immutable version history and server validation in production.

**Bulk import** is a Configuration page for a single CSV file containing multiple record types. It offers a template, checks required columns and parent references, previews the rows and issues, and imports all valid rows together in browser memory. Imported users are left without an active role assignment until an admin chooses an explicit scope. A production version should support multiple role assignment rows and scope columns, then validate and apply the file on the server with tenant scope and an audit record.

**Scheduled jobs** is a Configuration page with Jobs and Run history tabs. It demonstrates overdue checks, advance reminders and EHS digests using configurable frequency, local run time, time zone, hierarchy scope, record types, owners, recipient roles, email and in-app channels. Overdue jobs can escalate older work to a manager role. The advanced section displays a generated five-field cron expression. New jobs start paused, edits require saving, and test runs preview matching sample records without sending messages. Tests exclude completed records and respect the selected organisation scope. Job configuration and run history remain in browser memory during navigation. View, Manage and Test are separate proposed permissions under Configuration; Manage and Test include View.

## Organisation relationships

```text
Customer tenant / company
└── Business unit
    └── Site
        └── Location
            └── Department
```

The create forms require the immediate parent: a site requires a business unit, a location requires a site, and a department requires a location. In the eventual data model, these should be foreign-key relationships scoped to the same tenant. A customer with a simpler structure may need a default business unit or location rather than forcing unnecessary admin work.

## What “domain” means in the SCANNELL reference

SCANNELL uses **User Domain** for sign-in. Its help page describes a default SCANNELL domain, and optional Microsoft Active Directory domains whose users and groups can be mapped into the application. That domain is an identity provider boundary, **not a level of the business unit → site → location → department hierarchy**. For OleoQ, it belongs under optional **Identity & SSO** settings, if enterprise directory integration is introduced.

## Production implementation notes

- Invitation codes should be generated and checked on the server, expire, be rate limited and be bound to a tenant invitation.
- Authentication and every business record must be scoped to a tenant. The client-only demo credentials are not authentication.
- Roles should grant explicit module actions, with optional site scope. Module entitlements should come from the subscription.
- Authorisation must be checked for every server operation and record read. The decision should combine tenant, subscription, action permission, assignment scope, record sensitivity, ownership and workflow state; approvals may require separation of duties.
- Form definitions need tenant-scoped version history, immutable published versions and controlled migration for existing submissions.
- Stripe upgrades should take effect from verified webhooks. The current subscription page is a visual concept.
- Brand assets and colour choices should be persisted per tenant and checked for accessible contrast.
- YouTube links and AI help should be configured centrally and respect user permissions.
- Scheduled jobs need tenant-scoped workers, explicit IANA time zones, overlap protection, retry handling and durable execution history. Resolve recipient roles through current scoped assignments, check record access at delivery time, and deduplicate reminders per recipient, record and reminder window. Store notification delivery separately from the job's evaluation outcome.

No email, authentication service, database, file storage, Stripe or AI service is connected in this prototype.


## Incident module presentation

The Incident workspace follows report → investigate → actions → tasks → effectiveness review → explicit closure. Its eight menu pages cover the overview, registers, investigations, actions, tasks, trends, reports and settings. A compact source specification is saved in `docs/incident-module-reference.md`, with extracted source prose separately for focused checks.

Both report and investigation templates are published Incident forms from Form Builder. Each record saves a template snapshot. Type settings bind those forms, configure assignment/investigation rules and preview applicable site questions. Custom questions can be required, searchable and exportable. The demo supports multiple people, confidentiality flags, causes, intended reportees, losses, attachment filenames and external evidence references.

Actions can address multiple incidents and have child tasks. Task completion gates action completion; planned effectiveness reviews distinguish completed work from verified improvement. Ineffective responses need a verified follow-up. Incidents cannot close until required investigation/action checks pass. Closure and reopening preserve a visible decision history. Trends create preventive actions with saved criteria/results; five reports provide charts, tables, CSV and browser print.

These functions are available to the demo administrator. Session data resets on reload. No access enforcement, automatic notifications, regulatory submissions, persistent storage or file upload backend is connected. The source workflow is adapted to explicit closure, calendar-day reporting and CSV export; detailed legal matching and integrations remain future work.

## Risk module presentation

The implementation draws on the 30 saved HTML help documents in `risk/`. The menu contains Overview, Risk assessments, Objectives, Targets, Management programmes, Risk matrix, Tasks and Reports. All screens are available to the admin demo account without permission gates.

- Assessments use published Risk forms from Form Builder, with three published starter forms: Health & Safety multi-hazard (5×5), Environment multi-aspect (3×3), and Health & Safety FMEA. New Risk forms can also use checklist scoring. Draft forms are excluded from template selection.
- The three assessment steps cover scope and hierarchy, multiple jobs/hazards/aspects, current controls, consequences, scoring justification, recommendations, responsible person, approver and review date. Custom template fields support text, number, dates, person, choices and filename selection. Required custom questions are validated for submission/approval; incomplete work can be saved as a named draft.
- Matrix scores use likelihood × severity. Detailed FMEA factors follow the supplied safety/environment examples; average severity × average likelihood × average detection difficulty gives the rounded RPN. Checklist findings flag action required without implying equivalence to numeric matrices. The overall assessment score is the highest individual hazard/aspect score. Search groups by methodology before descending score to avoid comparing unlike scales.
- The register supports ID/title/hazard search, site, owner, status, template, risk band and individual hazard or overall scoring filters, pagination and CSV export. Archived records are available through the status filter.
- Detail views include scorecards, linked tasks, documents/references, attachment filenames, sample legal checklist topics, related assessments, revision scorecard snapshots and periodic reviews. Approved edits create a draft; the revision increases on approval. Review records do not change the revision or score. Cloning and reversible archiving are demonstrated. Confidentiality is a visual flag only.
- RA tasks link to a hazard/scoring factor and management programme. MP tasks originate from programmes. Sub-tasks are supported; all immediate children must be completed before their parent can close. Completion requires a date and comments. Scoring RA tasks also record actual outcome and update the approved assessment, calculate the score and append a revision. MP tasks and sub-tasks do not rescore assessments.
- Objectives have measurable targets; programmes link to an objective and one or more of its targets. Progress displays both increasing/decreasing measurements and parent-task completion. Task completion does not invent a new measured target value: admins explicitly record measurements.
- Risk matrix rules configure thresholds, review interval, advance-reminder days, site availability and a footnote per template. Saving published rules creates a new version for new assessments. Reminder delivery remains a future integration with Scheduled jobs.
- Seven live reports cover departmental counts, hazards/aspects, score reductions, periodic review coverage, outstanding strategy records and task summaries. Results can be downloaded as CSV or printed through the browser (including its save-to-PDF option). Assessment printing shows the current visible detail tab.

The prototype keeps all records in memory, resetting on reload. Legal checklist content is illustrative; document links and attachment controls retain names/references, not file bytes. Reference matrix images are preview-only. Emails, durable audit logs, independent approval identity checks, multi-assessment task associations, per-risk-band review policies, printable-field selection and full historical assessment context snapshots remain production work. Scheduled jobs continue to evaluate their original illustrative sample records rather than live Risk data.


## Audit module

The 29 supplied Audit HTML files were condensed to 25 unique article bodies and a compact implementation reference in `docs/audit-module-reference.md`. Screens preserve the existing workspace design and demo admin access.

- Nine pages: Overview, Plans, Programmes, Audits, Findings & audit trail, Recurring schedules, Templates, Reports and Settings. Planning follows plan → programme → audit, with subject domains separate from organisational business units. Plan dates protect existing children; employee and external auditees are supported.
- Audit templates are published Form Builder forms only. Standard, Scorable and Express share dynamic components and immutable audit snapshots. Builder settings cover sites, mobile web, default findings, major-NC assignment and scoring bounds/increments. New forms can be published and scheduled in the same session. Local audit questions can be sent to a separate builder draft.
- Recorded/confirmed findings, N/A scoring exclusion, question locks, closing notes, Express review, notes/evidence and history are functional. Insufficient evidence creates a carry-forward audit trail; a conclusive later finding resolves it.
- Specific source mapping is used: Major NC → Incident, Minor NC → corrective action, Opportunity for Improvement → preventive action. Generation is deduplicated and linked both ways. Generated reports use the configured published Incident template; extra required fields yield a Draft. CAPA completion/effectiveness remains in Incident, separately from audit completion.
- Recurrence previews run manually, preserve calendar anchors, skip existing occurrences and create/reuse annual plans and scheduler programmes. No background worker or real notifications. Timezone/DST execution remains production work.
- Source trash restrictions are represented with reversible archive/restore and guards for completed/Incident-linked records and active children. Reports cover department counts, programme scores, Express answers and printable action reports / blank fieldwork copies. CSV is used instead of native Excel.

Prototype records remain session state and reset on reload/sign-out. User rights, durable history, binary attachment storage, native app assignment and production scheduler integrations remain future work. Scheduled jobs still evaluate their illustrative fixtures rather than live Audit data.
