import {
  BiltyPrintOptions,
  BiltyCopyKind,
  DEFAULT_BILTY_PRINT_OPTIONS,
} from "./shipmentPrintTemplate";

const KEY = "kt.print_prefs.bilty";

interface StoredPrefs {
  copyKinds: BiltyCopyKind[];
  layout: BiltyPrintOptions["layout"];
  paper: BiltyPrintOptions["paper"];
}

const COPY_LABELS: Record<BiltyCopyKind, string> = {
  consignor: "CONSIGNOR COPY",
  consignee: "CONSIGNEE COPY",
  office: "OFFICE COPY",
  driver: "DRIVER COPY",
};

export function copyLabel(kind: BiltyCopyKind): string {
  return COPY_LABELS[kind];
}

export function loadBiltyPrintPrefs(): BiltyPrintOptions {
  if (typeof window === "undefined") return DEFAULT_BILTY_PRINT_OPTIONS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULT_BILTY_PRINT_OPTIONS;
    const parsed = JSON.parse(raw) as StoredPrefs;
    if (!Array.isArray(parsed.copyKinds) || parsed.copyKinds.length === 0) {
      return DEFAULT_BILTY_PRINT_OPTIONS;
    }
    return {
      copies: parsed.copyKinds.map((k) => ({ kind: k, label: COPY_LABELS[k] })),
      layout: parsed.layout === "one-per-page" ? "one-per-page" : "3-up",
      paper: parsed.paper === "A5" ? "A5" : "A4",
    };
  } catch {
    return DEFAULT_BILTY_PRINT_OPTIONS;
  }
}

export function saveBiltyPrintPrefs(opts: BiltyPrintOptions): void {
  if (typeof window === "undefined") return;
  try {
    const stored: StoredPrefs = {
      copyKinds: opts.copies.map((c) => c.kind),
      layout: opts.layout,
      paper: opts.paper,
    };
    localStorage.setItem(KEY, JSON.stringify(stored));
  } catch {
    // ignore quota/private-mode errors
  }
}
