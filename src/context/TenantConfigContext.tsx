"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  configService,
  TenantConfiguration,
  TenantFeatureFlags,
  TenantSubscription,
} from "../../services/configService";
import { formatTenantCurrency, formatTenantDate } from "../utils/configFormatter";

interface TenantConfigContextType {
  config: TenantConfiguration | null;
  featureFlags: TenantFeatureFlags | null;
  subscription: TenantSubscription | null;
  isLoading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
  updateConfig: (data: Partial<TenantConfiguration>) => Promise<TenantConfiguration>;
  hasModule: (moduleKey: keyof TenantFeatureFlags) => boolean;
  formatCurrency: (amount: number | null | undefined) => string;
  formatDate: (date: string | Date | null | undefined) => string;
  companyName: string;
  themeColor: string;
  currencySymbol: string;
}

const defaultFeatureFlags: TenantFeatureFlags = {
  gstBilling: true,
  withoutGstBilling: true,
  challanManagement: true,
  tripManagement: true,
  fleetManagement: true,
  vehicleMaintenance: true,
  cargoClaims: true,
  gpsTracking: true,
  reportsAndAnalytics: true,
  freightRateCards: true,
  vendorManagement: true,
  customerPortal: false,
};

const TenantConfigContext = createContext<TenantConfigContextType | undefined>(undefined);

export const TenantConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<TenantConfiguration | null>(null);
  const [featureFlags, setFeatureFlags] = useState<TenantFeatureFlags | null>(defaultFeatureFlags);
  const [subscription, setSubscription] = useState<TenantSubscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchConfig = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Check user role: Sub-users must NOT call super-user configuration endpoints
      const storedUserStr = typeof window !== "undefined" ? localStorage.getItem("user") : null;
      let isSuperUser = false;
      if (storedUserStr) {
        try {
          const u = JSON.parse(storedUserStr);
          const r = (u?.role || "").toUpperCase();
          isSuperUser = r === "SUPER_USER" || r === "ADMIN" || r === "TENANTADMIN" || r === "TENANT_OWNER" || r === "SUPERADMIN";
        } catch { }
      }

      // If user is a sub-user, provide standard defaults without firing 403-generating config calls
      if (!isSuperUser) {
        setFeatureFlags(defaultFeatureFlags);
        setIsLoading(false);
        return;
      }

      const [cfg, flags, sub] = await Promise.allSettled([
        configService.getConfiguration(),
        configService.getFeatureFlags(),
        configService.getSubscription(),
      ]);

      if (cfg.status === "fulfilled") {
        setConfig(cfg.value);
        if (cfg.value.featureFlags) {
          setFeatureFlags(cfg.value.featureFlags);
        }
      }

      if (flags.status === "fulfilled") {
        setFeatureFlags(flags.value);
      }

      if (sub.status === "fulfilled") {
        setSubscription(sub.value);
      }
    } catch (err: any) {
      console.error("Failed to load tenant configuration:", err);
      setError(err?.message || "Failed to load configuration");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const updateConfig = async (data: Partial<TenantConfiguration>): Promise<TenantConfiguration> => {
    try {
      const updated = await configService.updateConfiguration(data);
      setConfig(updated);
      if (updated.featureFlags) {
        setFeatureFlags(updated.featureFlags);
      }
      return updated;
    } catch (err: any) {
      console.error("Failed to update tenant configuration:", err);
      throw err;
    }
  };

  const hasModule = (moduleKey: keyof TenantFeatureFlags): boolean => {
    if (!featureFlags) return true;
    return featureFlags[moduleKey] ?? true;
  };

  const formatCurrency = (amount: number | null | undefined): string => {
    return formatTenantCurrency(amount, config);
  };

  const formatDate = (date: string | Date | null | undefined): string => {
    return formatTenantDate(date, config);
  };

  const companyName = config?.general?.companyName || "K-Transport";
  const themeColor = config?.general?.themeColor || "#4f46e5";
  const currencySymbol = config?.general?.currencySymbol || "₹";

  return (
    <TenantConfigContext.Provider
      value={{
        config,
        featureFlags,
        subscription,
        isLoading,
        error,
        refreshConfig: fetchConfig,
        updateConfig,
        hasModule,
        formatCurrency,
        formatDate,
        companyName,
        themeColor,
        currencySymbol,
      }}
    >
      {children}
    </TenantConfigContext.Provider>
  );
};

export const useTenantConfig = (): TenantConfigContextType => {
  const context = useContext(TenantConfigContext);
  if (!context) {
    throw new Error("useTenantConfig must be used within a TenantConfigProvider");
  }
  return context;
};
