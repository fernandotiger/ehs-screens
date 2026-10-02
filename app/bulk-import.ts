import { allPermissionIds } from "./access-model.ts";

export type ImportEntityKey =
  | "businessUnits"
  | "sites"
  | "locations"
  | "departments"
  | "roles"
  | "users"
  | "templates"
  | "categories";

export type ImportRecord = { id: string; name: string; parentId?: string; detail?: string };
export type ImportRecords = Record<ImportEntityKey, ImportRecord[]>;

export type ImportItem = {
  line: number;
  type: ImportEntityKey;
  key: string;
  name: string;
  parentKey: string;
  email: string;
  permissions: string[];
  notes: string;
};

export type ImportIssue = { line: number; message: string };
export type ImportReview = { items: ImportItem[]; issues: ImportIssue[] };

export const TEMPLATE_CSV = [
  "type,key,name,parent_key,email,permissions,notes",
  "business_unit,west-operations,West Operations,,,,Regional business unit",
  "site,galway-hub,Galway Service Hub,west-operations,,,",
  "location,office-wing,Office Wing,galway-hub,,,",
  "department,customer-support,Customer Support,office-wing,,,",
  "role,site-coordinator,Site Coordinator,,,risk.view;risk.create;incident.view,",
  "user,jamie-lee,Jamie Lee,site-coordinator,jamie.lee@northstar.example,,",
  "category,training,Training,,,,",
  "template,equipment-checklist,Equipment inspection checklist,,,,",
].join("\r\n") + "\r\n";

const typeMap: Record<string, ImportEntityKey> = {
  business_unit: "businessUnits",
  site: "sites",
  location: "locations",
  department: "departments",
  role: "roles",
  user: "users",
  template: "templates",
  category: "categories",
};

const parentType: Partial<Record<ImportEntityKey, ImportEntityKey>> = {
  sites: "businessUnits",
  locations: "sites",
  departments: "locations",
  users: "roles",
};

const validPermissions = new Set([...allPermissionIds, "Risk", "Incident", "Audit", "Document", "Law"]);
const requiredHeaders = ["type", "key", "name", "parent_key", "email", "permissions", "notes"];
const normal = (value: string) => value.trim().toLowerCase();

type CsvRow = { line: number; cells: string[] };

function readCsv(text: string): { rows: CsvRow[]; error?: string } {
  const source = text.replace(/^\uFEFF/, "");
  const rows: CsvRow[] = [];
  let cells: string[] = [];
  let cell = "";
  let quoted = false;
  let line = 1;
  let rowLine = 1;

  for (let index = 0; index < source.length; index++) {
    const char = source[index];
    if (char === '"') {
      if (quoted && source[index + 1] === '"') {
        cell += '"';
        index++;
      } else if (!quoted && cell.trim() === "") {
        quoted = true;
      } else if (quoted) {
        quoted = false;
      } else {
        return { rows: [], error: `Unexpected quote on line ${line}.` };
      }
    } else if (char === "," && !quoted) {
      cells.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      cells.push(cell.trim());
      if (cells.some(value => value !== "")) rows.push({ line: rowLine, cells });
      cells = [];
      cell = "";
      if (char === "\r" && source[index + 1] === "\n") index++;
      line++;
      rowLine = line;
    } else {
      cell += char;
      if (char === "\n") line++;
    }
  }
  if (quoted) return { rows: [], error: `A quoted value is not closed near line ${rowLine}.` };
  cells.push(cell.trim());
  if (cells.some(value => value !== "")) rows.push({ line: rowLine, cells });
  return { rows };
}

export function inspectImportCsv(content: string, records: ImportRecords): ImportReview {
  const parsed = readCsv(content);
  if (parsed.error) return { items: [], issues: [{ line: 0, message: parsed.error }] };
  if (parsed.rows.length === 0) return { items: [], issues: [{ line: 0, message: "The file is empty." }] };

  const header = parsed.rows[0].cells.map(normal);
  const missing = requiredHeaders.filter(name => !header.includes(name));
  if (missing.length) return { items: [], issues: [{ line: 1, message: `Missing columns: ${missing.join(", ")}. Download the template to see the required format.` }] };

  const indexOf = (name: string) => header.indexOf(name);
  const items: ImportItem[] = [];
  const issues: ImportIssue[] = [];
  const fileKeys = new Map<string, ImportItem>();
  const body = parsed.rows.slice(1);
  if (body.length === 0) issues.push({ line: 0, message: "The file has headings but no data rows." });
  if (body.length > 500) issues.push({ line: 0, message: "This prototype accepts up to 500 data rows per file." });

  for (const row of body) {
    const value = (column: string) => row.cells[indexOf(column)]?.trim() || "";
    const rawType = normal(value("type"));
    const type = typeMap[rawType];
    const key = value("key");
    const name = value("name");
    if (!type) issues.push({ line: row.line, message: `Unknown type “${value("type")}”.` });
    if (!key) issues.push({ line: row.line, message: "A key is required." });
    if (!name) issues.push({ line: row.line, message: "A name is required." });
    if (!type || !key || !name) continue;

    if (fileKeys.has(normal(key))) issues.push({ line: row.line, message: `Key “${key}” is used more than once in this file.` });
    const permissions = value("permissions").split(";").map(item => item.trim()).filter(Boolean);
    const item: ImportItem = {
      line: row.line,
      type,
      key,
      name,
      parentKey: value("parent_key"),
      email: value("email"),
      permissions,
      notes: value("notes"),
    };
    fileKeys.set(normal(key), item);
    items.push(item);
    if (parentType[type] && !item.parentKey) issues.push({ line: row.line, message: `${rawType.replace("_", " ")} requires a parent_key.` });
    if (type === "users" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(item.email)) issues.push({ line: row.line, message: "A valid email is required for a user." });
    if (type === "roles") for (const permission of permissions) {
      if (!validPermissions.has(permission)) issues.push({ line: row.line, message: `Unknown permission “${permission}”.` });
    }
    if (type !== "roles" && permissions.length) issues.push({ line: row.line, message: "Permissions can only be set on role rows." });
  }

  const seenNames = new Set<string>();
  const seenEmails = new Set<string>();
  for (const item of items) {
    const nameSignature = `${item.type}|${normal(item.parentKey)}|${normal(item.name)}`;
    if (seenNames.has(nameSignature)) issues.push({ line: item.line, message: `${item.name} is repeated for the same type and parent in this file.` });
    seenNames.add(nameSignature);
    if (item.type === "users") {
      if (seenEmails.has(normal(item.email))) issues.push({ line: item.line, message: `Email ${item.email} is repeated in this file.` });
      seenEmails.add(normal(item.email));
    }
    const expectedParent = parentType[item.type];
    if (expectedParent && item.parentKey) {
      const fileParent = fileKeys.get(normal(item.parentKey));
      if (fileParent && fileParent.type !== expectedParent) {
        issues.push({ line: item.line, message: `Parent “${item.parentKey}” must be a ${expectedParent === "businessUnits" ? "business unit" : expectedParent.slice(0, -1)}.` });
      } else if (!fileParent) {
        const matches = records[expectedParent].filter(row => normal(row.name) === normal(item.parentKey));
        if (matches.length !== 1) issues.push({ line: item.line, message: `Parent “${item.parentKey}” was not found. Use a key in this file or one existing ${expectedParent === "businessUnits" ? "business unit" : expectedParent.slice(0, -1)} name.` });
      }
    }
    if (["businessUnits", "roles", "templates", "categories"].includes(item.type) && records[item.type].some(row => normal(row.name) === normal(item.name))) {
      issues.push({ line: item.line, message: `${item.name} already exists in ${item.type}.` });
    }
    if (item.type === "users" && records.users.some(row => normal(row.detail || "") === normal(item.email))) {
      issues.push({ line: item.line, message: `A user with email ${item.email} already exists.` });
    }
  }
  return { items, issues };
}

export function applyImport(items: ImportItem[], current: ImportRecords): ImportRecords {
  const next: ImportRecords = {
    businessUnits: [...current.businessUnits], sites: [...current.sites],
    locations: [...current.locations], departments: [...current.departments],
    roles: [...current.roles], users: [...current.users],
    templates: [...current.templates], categories: [...current.categories],
  };
  const prefix = `bulk-${Date.now()}-`;
  const ids = new Map(items.map(item => [normal(item.key), `${prefix}${item.key}`]));
  const order: ImportEntityKey[] = ["businessUnits", "sites", "locations", "departments", "roles", "users", "templates", "categories"];
  for (const type of order) {
    for (const item of items.filter(row => row.type === type)) {
      const expectedParent = parentType[type];
      const parentId = expectedParent && item.parentKey
        ? ids.get(normal(item.parentKey)) || next[expectedParent].find(row => normal(row.name) === normal(item.parentKey))?.id
        : undefined;
      const detail = type === "users" ? item.email : type === "roles" ? `${item.permissions.join(", ") || "No module permissions"} · Imported role` : item.notes || undefined;
      next[type].push({ id: ids.get(normal(item.key))!, name: item.name, parentId, detail });
    }
  }
  return next;
}
