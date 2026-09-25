export interface TenantPrintProfile {
  companyName: string;
  tagline?: string;
  logoUrl?: string;
  address?: string;
  phone?: string;
  email?: string;
  gstin?: string;
  panNumber?: string;
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
    } catch (e) {
      console.warn("Could not read stored tenant configuration for printing:", e);
    }
  }

  return {
    ...defaultProfile,
    ...customProfile,
  };
}
