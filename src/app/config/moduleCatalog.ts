// TASK-049b — Canonical module code catalog, shared by /clients and /settings
// (and the next page in Phase B). Keep in sync with the backend `modules.code`
// column 1:1. The dotted "menu key" catalog that the /settings page uses for
// its role / user override UI is intentionally separate — those overrides
// still travel as flat string[] inside the `roleOverrides` / `userOverrides`
// maps on the save payload and are NOT part of `moduleCodes`.
//
// TODO (Phase B): once backend exposes GET /api/admin/modules, replace this
// static list with a runtime fetch so platform-admin UI stays in sync with
// the DB without a frontend redeploy. See .agent/menu.md §5.6.

export interface ModuleCodeDefinition {
  code: string;
  label: string;
}

export const ALL_MODULE_CODES: ModuleCodeDefinition[] = [
  { code: "dashboard", label: "Dashboard" },
  { code: "bilty", label: "Bilty / Consignments" },
  { code: "pod", label: "Proof of Delivery" },
  { code: "trips", label: "Trips & Manifests" },
  { code: "billing", label: "Billing & Invoicing" },
  { code: "master_data", label: "Master Data" },
  { code: "reports", label: "Reports" },
  { code: "vendors", label: "Vendors & Lorry Hire" },
  { code: "claims", label: "Claims" },
  { code: "quotations", label: "Quotations" },
  { code: "tracking", label: "Live Tracking" },
  { code: "analytics", label: "Analytics" },
  { code: "trip_settlement", label: "Trip Settlement" },
  { code: "delivery_settlement", label: "Delivery Settlement" },
  { code: "system", label: "System" },
];

export const ALL_MODULE_CODE_LIST: string[] = ALL_MODULE_CODES.map((m) => m.code);

export const ALL_MODULE_CODE_SET: Set<string> = new Set(ALL_MODULE_CODE_LIST);

export type PresetKey =
  | "starter"
  | "professional"
  | "enterprise"
  | "tax_reports"
  | "client_a"
  | "client_b";

// Preset == pre-selected moduleCodes before the admin clicks save. No legacy
// aliases (`gr`, `challan`, `consignments`), no dotted keys
// (`system.settings`, `gr.list`). Backend infers nothing from these.
export const PRESET_MODULE_CODES: Record<PresetKey, string[]> = {
  starter: ["dashboard", "bilty", "reports", "system"],
  professional: [
    "dashboard",
    "bilty",
    "pod",
    "trips",
    "billing",
    "master_data",
    "trip_settlement",
    "delivery_settlement",
    "analytics",
    "reports",
    "system",
  ],
  enterprise: ALL_MODULE_CODE_LIST,
  tax_reports: ["dashboard", "bilty", "trips", "billing", "reports", "system"],
  client_a: ["dashboard", "bilty", "trips", "billing", "system"],
  client_b: ["dashboard", "bilty", "billing", "reports", "system"],
};

// Phase A transition helper: maps the legacy dotted-key menu catalog used by
// the /settings page override UI (`fullMenuCatalog`) back to its parent
// canonical module code. Used ONLY to filter the override checklist against
// the active `moduleCodes` Set during the transition window.
// TODO: Phase B — delete this once /settings override UI iterates
// ALL_MODULE_CODES directly.
export const MENU_KEY_TO_MODULE_CODE: Record<string, string> = {
  dashboard: "dashboard",
  consignments: "bilty",
  "consignments.create": "bilty",
  "consignments.all": "bilty",
  "consignments.delivery_settlement": "delivery_settlement",
  delivery_settlement: "delivery_settlement",
  quotations: "quotations",
  trips: "trips",
  "trips.all": "trips",
  "trips.settlement": "trip_settlement",
  trip_settlement: "trip_settlement",
  empty_trips: "trips",
  pod: "pod",
  billing: "billing",
  "billing.bill_book": "billing",
  "billing.invoices": "billing",
  "billing.receipts": "billing",
  bill_book: "billing",
  master_data: "master_data",
  "master_data.parties": "master_data",
  "master_data.fleet": "master_data",
  "master_data.compliance": "master_data",
  "master_data.tyres": "master_data",
  "master_data.spares": "master_data",
  "master_data.loans": "master_data",
  "master_data.driverledger": "master_data",
  "master_data.vehicleclaims": "master_data",
  "master_data.rates": "master_data",
  "master_data.vendorrates": "master_data",
  vendors: "vendors",
  claims: "claims",
  analytics: "analytics",
  reports: "reports",
  tracking: "tracking",
  clients: "system",
  system: "system",
  "system.settings": "system",
  "system.onboard": "system",
};
