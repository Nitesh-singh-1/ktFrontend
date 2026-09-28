export interface TenantPrintProfile {
  companyName: string;
  tagline?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  panNumber?: string;
  /** Active station / branch names, shown vertically in the left column of the Bilty. */
  activeStations?: string[];
  /** Legal disclaimer / T&C printed at the bottom of every Bilty copy. */
  printDisclaimer?: string;
}

const STATIONS_CACHE_KEY = "kt.print_stations_cache";
const DEFAULT_DISCLAIMER =
  "All disputes subject to local jurisdiction. Goods carried entirely at owner's risk. Not responsible for leakage, breakage, shortage, fire, riot, theft or accident. Freight & charges payable in advance / on delivery as per terms above. Received in good condition unless otherwise stated. Taxable under Reverse Charge Mechanism where applicable (Notification No. 12/2003-ST 20.06.2003).";

/**
 * Save the currently-active station names to a local cache so the print pipeline can render
 * them without an extra API call. Pages that manage stations (Fleet → Stations) should call
 * this after loading/updating locations.
 */
export function cacheActiveStations(names: string[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STATIONS_CACHE_KEY, JSON.stringify({ names, at: Date.now() }));
  } catch {
    // ignore quota errors
  }
}

export function readCachedActiveStations(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STATIONS_CACHE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { names?: string[] };
    return Array.isArray(parsed.names) ? parsed.names : [];
  } catch {
    return [];
  }
}

export function getTenantPrintProfile(customProfile?: Partial<TenantPrintProfile>): TenantPrintProfile {
  let defaultProfile: TenantPrintProfile = {
    companyName: "K Transport Logistics",
    tagline: "Fleet & Consignment Management Platform",
    logoUrl: "/logo.jpeg",
    address: "Zero Mile, Pahari, Patna-7",
    phone: "+91 9430492601",
    email: "info@ktransport.in",
    gstin: "",
    panNumber: "",
    activeStations: [],
    printDisclaimer: DEFAULT_DISCLAIMER,
  };

  if (typeof window !== "undefined") {
    try {
      const storedConfig = localStorage.getItem("tenant_config");
      if (storedConfig) {
        const parsed = JSON.parse(storedConfig);
        if (parsed?.general?.companyName) {
          defaultProfile.companyName = parsed.general.companyName;
        }
        if (parsed?.general?.legalName) {
          defaultProfile.tagline = parsed.general.legalName;
        }
        if (parsed?.general?.logoUrl) {
          defaultProfile.logoUrl = parsed.general.logoUrl;
        }
        if (parsed?.general?.address) {
          defaultProfile.address = parsed.general.address;
        }
        if (parsed?.general?.supportPhone) {
          defaultProfile.phone = parsed.general.supportPhone;
        }
        if (parsed?.general?.supportEmail) {
          defaultProfile.email = parsed.general.supportEmail;
        }
        if (parsed?.general?.printDisclaimer && typeof parsed.general.printDisclaimer === "string") {
          defaultProfile.printDisclaimer = parsed.general.printDisclaimer;
        }
        if (parsed?.billingAndTax?.gstin) {
          defaultProfile.gstin = parsed.billingAndTax.gstin;
        }
        if (parsed?.billingAndTax?.panNumber) {
          defaultProfile.panNumber = parsed.billingAndTax.panNumber;
        }
      } else {
        const storedUser = localStorage.getItem("user");
        if (storedUser) {
          const u = JSON.parse(storedUser);
          if (u?.tenantName || u?.organizationName) {
            defaultProfile.companyName = u.tenantName || u.organizationName;
          }
        }
      }

      // Active stations come from a separate cache (populated when the user browses / manages
      // the Fleet → Stations page). Falling back to an empty list is fine — the strip is just
      // hidden if there's nothing to show.
      const stations = readCachedActiveStations();
      if (stations.length > 0) defaultProfile.activeStations = stations;
    } catch (e) {
      console.warn("Could not read stored tenant configuration for printing:", e);
    }
  }

  return {
    ...defaultProfile,
    ...customProfile,
  };
}
