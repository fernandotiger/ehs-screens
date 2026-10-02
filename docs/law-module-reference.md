# Law module implementation reference

## Source and approach

Reviewed all 36 HTML files in `law`; two repeated topics have identical text. `law-source-text.md` archives extracted topic bodies rather than saved-page navigation or embedded assets. This reference is the implementation brief, so the original files do not need to be repeatedly loaded. No live legal content or legal interpretation is supplied by this prototype.

## Core concepts from the source

- **Legal profile:** jurisdiction, organisation/site activities, materials and equipment determine potentially applicable checklists. One owner, editable questionnaire, sharing with the workspace. Unfinished/unshared profiles are private in the original product. Admin demonstrates all users here; real permission enforcement is deferred.
- **Register:** legislation organised by Health & Safety / Environment, category, keyword, jurisdiction and primary/secondary/tertiary relationships. Each synopsis has requirements, official source links, associated checklists, changes, related legislation and associated Risk assessments.
- **Compliance checklist:** practical topic collecting requirements from one or more pieces of legislation. Customer records why it applies, controls/responsibility and evaluation evidence. Relevance/control narrative and evaluation narrative are separate completion measures.
- **Relevance:** generated checklists are potentially relevant by default. Mark Not Relevant requires a reason; restore without destroying previous evaluation/evidence/history.
- **Evaluation:** periodically record evidence and next review; link documents/attachments and tasks. Optional 0–100 subjective compliance rating, distinct from checklist completion. Original colours: below 50 red, 50–79 amber, 80–100 green. Hide/show per-profile compliance dashboard preserves ratings.
- **Tasks:** description, additional information, target closure date, responsible existing user, department and priority. Edit, complete with mandatory comment, archive/restore and history. Completing a task does not establish legal compliance automatically.
- **Other requirements:** corporate/customer/industry commitments and document references, evaluated alongside compliance obligations. Documents module is currently a placeholder; file names and safe HTTP(S) references are usable demo evidence.
- **Quarterly content:** library import and profile acceptance are separate. New/amended content has change history and badges. A profile can lag behind imported content; its owner accepts updates and re-evaluates affected checklist controls/evidence. Existing evaluation records must survive updates.

## Prototype pages

1. Overview: profile/register selectors, owner/site/jurisdiction/version, update warning, scoped metrics, category completion, optional compliance score, overdue tasks and upcoming reviews.
2. Legal profiles: searchable cards; create/edit profile questionnaire; shared/private labels; owner, site, jurisdiction, activities; generate scope on save. Show/hide rating dashboard independently.
3. Legislation: search/phrase mode, category/domain/level filters, synopsis details, hierarchy, checklists, Risk links and version history.
4. Compliance checklists: searchable/filterable list; Required / Not relevant / Outside current profile scopes; detail tabs Requirements, Evaluation, Evidence, Tasks, Risk & Incident, History. Evaluation, exclusion/restore, evidence, task and integration actions.
5. Tasks: owner/status/priority filters, source checklist link, create/edit/complete/archive/restore, comment and history.
6. Changes & updates: profile acceptance preview; installed package details and change list; import JSON with validation and preview before installing; downloadable sample; import does not accept automatically.
7. Other requirements: create/edit company-specific obligation, document references, category and owner; opens its compliance checklist to evaluate/manage evidence/tasks.
8. Reports: filtered compliance register, task tracking and linked Risk/Incident records; CSV export and browser print/PDF.

## State and update rules

- Shared content catalogues are immutable version snapshots; profile points to its accepted content version. Checklist evaluations, evidence, tasks and associations belong to `(profileId, checklistId)`.
- Activity matches generate the profile's checklist set. Removed activity makes an evaluation outside current scope without deleting it. Not Relevant also preserves records and is reversible.
- Import package supports version/release/summary plus legislation and checklist patches. Validate IDs, required text, dates, domains/categories/activities, references, hierarchy/cycles, URL protocols and newer version before preview/install. No provider password/encryption or actual legal feed integration.
- Accepting a package preserves customer data, adds newly matched items, flags changed checklists or changed associated legislation for review, keeps removed/out-of-scope data in a historical view, and records profile history. Repeated acceptance is a no-op. Unchanged items do not acquire a false review flag.
- Rated percentage uses relevant, currently scoped, assessed checklists only; always show rating coverage. No scores means “Not assessed”, rather than a fabricated 100%. Completion requires both narratives and no pending content review. Non-relevant items are excluded from the denominator.
- Compliance level is a self-assessment, not proof or a legal determination. Completing linked incidents/actions/tasks never silently changes rating or clears an evaluation review flag.

## Risk and Incident integration

- Link existing risk assessments, incidents and corrective/preventive actions to a profile checklist. Explicit links retain real IDs, remain unique and appear on both sides. Risk connections may name the hazard/aspect; origin is preserved when navigating.
- Seed workplace transport checklist ↔ RA-1042 and INC-261; machinery checklist ↔ RA-1038; chemical checklist ↔ INC-260.
- From a checklist create a **Non Compliance incident draft**, using its configured published Incident Report form snapshot. Admin then completes mandatory answers and submits via Incident. If no compatible form/type exists, block with an actionable message.
- From a checklist create a corrective action with legal source provenance, owner/department/due/priority. It can exist without an incident because Law is its source. It follows the existing Incident action/task/effectiveness workflow. Follow-up actions retain legal provenance.
- Existing Incident closure gates and Risk scoring stay in their respective modules. Legal evidence links do not imply incident closure, assessment approval or compliance confirmation.
- Record back links open the exact source profile checklist; links from Law open the exact Risk/Incident record, including records created during this session. No loose title matching.

## Presentation data and boundaries

Use clearly marked fictional Irish demo legislation and requirement summaries, not copied legislative provisions or claims of current standards compliance. Include legislation hierarchy, two site profiles, partial/unassessed checklists, one excluded checklist, overdue task, pending quarterly package and cross-module samples. Only `admin@northstar.example` needs to operate the presentation. Data lives in browser memory and resets on reload/sign-out; uploads keep names/references, no real documents, legal feed, email or background service is connected.

## Key source mapping

- Profiles/scope/sharing: Managing Legal Profiles; Refining the Profile Checklists.
- Register/hierarchy/search: How is the legislation structured in LAW; Searching for Legislation; Search; Keywords; Legislation Synopsis.
- Evaluation/rating/evidence: Compliance Checklists; Relevancy & Evaluation of Compliance; Edit a Checklist; Detailed Checklist View; Level of Compliance; Adding Document Links or Attachments.
- Task workflow: Adding Tasks; Searching for Tasks.
- Updates: Content Import; Delivery of Updates; Updating the Profile(s); Viewing Changes; Updating Relevancies and Evaluation of Compliance.
- Dashboard settings: Law Dashboard; Activating / Deactivating the law compliance dashboard.
- Additional commitments and caveats: Other Requirements; What legislation is included; Disclaimer. Old technical restrictions, permission levels and certification assertions are not carried forward as product guarantees.
