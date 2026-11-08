// TASK-054 — Canonical module code catalog. Keep in sync with the backend
// `modules.code` column 1:1. This list is now ONLY the first-render / offline
// fallback: the live module + page catalog comes from
// `tenantService.getCatalog()` (GET /admin/catalog) at runtime, so paid add-ons
// (e.g. `accounting`) and anything added later provision without a frontend
// redeploy. `PRESET_MODULE_CODES` below is pure UI sugar (pre-selected module
// codes before an admin saves). No dotted "menu keys" live here any more —
// page-level entitlement is driven by the live catalog's `pages[]`.

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
  { code: "accounting", label: "Accounting & Finance" },
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
