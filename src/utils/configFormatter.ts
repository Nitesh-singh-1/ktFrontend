import { TenantConfiguration } from "../../services/configService";

/**
 * Format a number as currency based on active tenant configuration or fallback to standard INR.
 */
export function formatTenantCurrency(
  amount: number | null | undefined,
  config?: TenantConfiguration | null
): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "₹ 0.00";
  }

  const symbol = config?.general?.currencySymbol || "₹";
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  return `${symbol} ${formatted}`;
}

export const formatCurrency = (amount: number | null | undefined) => formatTenantCurrency(amount);

/**
 * Format a date string using the active tenant's date format preference.
 */
export function formatTenantDate(
  dateInput: string | Date | null | undefined,
  config?: TenantConfiguration | null
): string {
  if (!dateInput) return "—";

  const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return "—";

  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();

  const pattern = config?.general?.dateFormat || "DD/MM/YYYY";

  switch (pattern.toUpperCase()) {
    case "MM/DD/YYYY":
      return `${month}/${day}/${year}`;
    case "YYYY-MM-DD":
      return `${year}-${month}-${day}`;
    case "DD-MM-YYYY":
      return `${day}-${month}-${year}`;
    case "DD/MM/YYYY":
    default:
      return `${day}/${month}/${year}`;
  }
}

export const formatDate = (dateInput: string | Date | null | undefined) => formatTenantDate(dateInput);

/**
 * Preview document sequence number based on tenant sequence configuration.
 */
export function previewSequenceNumber(
  prefix: string,
  suffix: string,
  paddingDigits: number,
  sequenceNum: number
): string {
  const padded = String(sequenceNum).padStart(paddingDigits || 5, "0");
  const year = new Date().getFullYear();
  let result = prefix ? `${prefix}-${year}-${padded}` : `${year}-${padded}`;
  if (suffix && suffix.trim().length > 0) {
    result += `-${suffix.trim()}`;
  }
  return result;
}
