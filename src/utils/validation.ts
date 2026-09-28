// Shared client-side validators, mirroring the backend DataAnnotation regexes.
// All *validate* functions return null on success or a human-readable error string.
// All *sanitize* functions restrict input as the user types (call from onChange).

export const sanitizeMobile = (v: string): string => v.replace(/\D/g, "").slice(0, 10);
export const sanitizePincode = (v: string): string => v.replace(/\D/g, "").slice(0, 6);
export const sanitizeDigits = (v: string, max: number): string => v.replace(/\D/g, "").slice(0, max);

const MOBILE_RE = /^[6-9]\d{9}$/;
const PINCODE_RE = /^\d{6}$/;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GSTIN_RE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
const PAN_RE = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
const IFSC_RE = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const AADHAR_RE = /^\d{12}$/;

export const validateMobile = (v: string, label = "Mobile number"): string | null => {
  const t = v.trim();
  if (!t) return null;
  if (!MOBILE_RE.test(t)) return `${label} must be a valid 10-digit Indian mobile number starting with 6, 7, 8, or 9.`;
  return null;
};

export const validateMobileRequired = (v: string, label = "Mobile number"): string | null => {
  const t = v.trim();
  if (!t) return `${label} is required.`;
  return validateMobile(t, label);
};

export const validatePincode = (v: string, label = "Pincode"): string | null => {
  const t = v.trim();
  if (!t) return null;
  if (!PINCODE_RE.test(t)) return `${label} must be exactly 6 numeric digits.`;
  return null;
};

export const validateEmail = (v: string, label = "Email"): string | null => {
  const t = v.trim();
  if (!t) return null;
  if (!EMAIL_RE.test(t)) return `Please enter a valid ${label.toLowerCase()} address (e.g. name@example.com).`;
  return null;
};

export const validateEmailRequired = (v: string, label = "Email"): string | null => {
  const t = v.trim();
  if (!t) return `${label} is required.`;
  return validateEmail(t, label);
};

export const validateGstin = (v: string): string | null => {
  const t = v.trim().toUpperCase();
  if (!t) return null;
  if (!GSTIN_RE.test(t)) return "Invalid GSTIN format. Expected 15 characters (e.g. 27AAAAA0000A1Z5).";
  return null;
};

export const validatePan = (v: string): string | null => {
  const t = v.trim().toUpperCase();
  if (!t) return null;
  if (!PAN_RE.test(t)) return "Invalid PAN format. Expected 10 alphanumeric characters (e.g. AAAAA0000A).";
  return null;
};

export const validateIfsc = (v: string): string | null => {
  const t = v.trim().toUpperCase();
  if (!t) return null;
  if (!IFSC_RE.test(t)) return "Invalid IFSC code. Expected 11 characters (e.g. SBIN0001234).";
  return null;
};

export const validateAadhar = (v: string): string | null => {
  const t = v.trim();
  if (!t) return null;
  if (!AADHAR_RE.test(t)) return "Aadhar number must be exactly 12 digits.";
  return null;
};

// Run a list of (value, validator) pairs and return the FIRST error message, or null.
export const firstError = (...checks: Array<string | null>): string | null => {
  for (const c of checks) if (c) return c;
  return null;
};
