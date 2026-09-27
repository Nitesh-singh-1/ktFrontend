import { baseService } from "./baseservice";

export interface PublicTenantConfig {
  tenantId: string;
  tenantName: string;
  tenantCode: string;
  companyName: string;
  logoUrl?: string;
  faviconUrl?: string;
  themeColor: string;
  currencyCode: string;
  currencySymbol: string;
}

export interface GeneralSettings {
  companyName: string;
  legalName: string;
  supportEmail: string;
  supportPhone: string;
  logoUrl?: string;
  faviconUrl?: string;
  themeColor: string;
  currencyCode: string;
  currencySymbol: string;
  timeZone: string;
  dateFormat: string;
  timeFormat: string;
  address: string;
}

export interface BillingAndTaxSettings {
  isGstEnabled: boolean;
  gstin: string;
  panNumber: string;
  defaultCgstRate: number;
  defaultSgstRate: number;
  defaultIgstRate: number;
  enableRcm: boolean;
  eWayBillThresholdAmount: number;
  isTdsEnabled: boolean;
  tdsPercentage: number;
  isTcsEnabled: boolean;
  tcsPercentage: number;
}

export interface DocumentSequence {
  docType: "Invoice" | "GR" | "Challan" | "Trip" | "Claim";
  prefix: string;
  suffix: string;
  paddingDigits: number;
  nextNumber: number;
  resetPeriod: "Never" | "Yearly" | "Monthly";
}

export interface OperationalWorkflowSettings {
  mandatoryDriverPhone: boolean;
  mandatoryPodBeforeSettlement: boolean;
  mandatoryEWayBillForDispatch: boolean;
  allowOverweightTolerancePercentage: number;
  maxDetentionFreeHours: number;
  autoCloseCompletedTrips: boolean;
}

export interface TenantFeatureFlags {
  gstBilling: boolean;
  withoutGstBilling: boolean;
  challanManagement: boolean;
  tripManagement: boolean;
  fleetManagement: boolean;
  vehicleMaintenance: boolean;
  cargoClaims: boolean;
  gpsTracking: boolean;
  reportsAndAnalytics: boolean;
  freightRateCards: boolean;
  vendorManagement: boolean;
  customerPortal: boolean;
}

export interface IntegrationSettings {
  whatsAppEnabled: boolean;
  smsEnabled: boolean;
  gpsProvider: "None" | "Custom" | "TrackSolid" | "WheelsEye";
  fastagEnabled: boolean;
  webhookUrl?: string;
}

export interface TenantConfiguration {
  tenantId: string;
  general: GeneralSettings;
  billingAndTax: BillingAndTaxSettings;
  documentSequences: DocumentSequence[];
  operationalWorkflows: OperationalWorkflowSettings;
  featureFlags: TenantFeatureFlags;
  integrations: IntegrationSettings;
  updatedAt?: string;
}

export interface TenantSubscription {
  planName: string;
  planTier: string;
  status: string;
  expiresAt?: string;
  maxVehicles: number;
  currentVehicles: number;
  maxUsers: number;
  currentUsers: number;
  maxMonthlyShipments: number;
  currentMonthlyShipments: number;
}

export const configService = {
  getPublicConfig: (codeOrDomain: string) =>
    baseService.get<PublicTenantConfig>(`/configuration/public/${encodeURIComponent(codeOrDomain)}`),

  getConfiguration: () =>
    baseService.get<TenantConfiguration>("/configuration"),

  // Branding subset readable by ANY authenticated tenant user (not just super users),
  // so regular users' printed reports show the organization's logo/company details.
  getBranding: () =>
    baseService.get<{ tenantId: string; general: GeneralSettings; billingAndTax: Pick<BillingAndTaxSettings, "gstin" | "panNumber"> }>("/branding"),

  updateConfiguration: (data: Partial<TenantConfiguration>) =>
    baseService.put<TenantConfiguration>("/configuration", data),

  getFeatureFlags: () =>
    baseService.get<TenantFeatureFlags>("/configuration/features"),

  getSubscription: () =>
    baseService.get<TenantSubscription>("/configuration/subscription"),

  resetToDefaults: () =>
    baseService.post<TenantConfiguration>("/configuration/reset", {}),
};
