import assert from "node:assert/strict";
import { applyImport, inspectImportCsv, TEMPLATE_CSV } from "../app/bulk-import.ts";

const empty = {
  businessUnits: [], sites: [], locations: [], departments: [],
  roles: [], users: [], templates: [], categories: [],
};

const review = inspectImportCsv(TEMPLATE_CSV, empty);
assert.equal(review.issues.length, 0);
assert.equal(review.items.length, 8);

const imported = applyImport(review.items, empty);
assert.equal(imported.sites[0].parentId, imported.businessUnits[0].id);
assert.equal(imported.locations[0].parentId, imported.sites[0].id);
assert.equal(imported.departments[0].parentId, imported.locations[0].id);
assert.equal(imported.users[0].parentId, imported.roles[0].id);

const missingParent = TEMPLATE_CSV.replace("galway-hub,Galway Service Hub,west-operations", "galway-hub,Galway Service Hub,unknown-unit");
assert.ok(inspectImportCsv(missingParent, empty).issues.some(issue => issue.message.includes("unknown-unit")));

const quoted = TEMPLATE_CSV.replace("West Operations", '"West, Operations"');
assert.equal(inspectImportCsv(quoted, empty).items[0].name, "West, Operations");

console.log("Bulk import validation checks passed.");
