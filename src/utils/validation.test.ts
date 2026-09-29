import { describe, expect, it } from "vitest";
import {
  sanitizeMobile,
  sanitizePincode,
  sanitizeDigits,
  validateMobile,
  validateMobileRequired,
  validatePincode,
  validateEmail,
  validateEmailRequired,
  validateGstin,
  validatePan,
  validateIfsc,
  validateAadhar,
  firstError,
} from "./validation";

/**
 * Pure-function tests for the shared client-side validators added under TASK-004
 * (form-validation pass). Anchor the regex behaviour so a future refactor of the
 * shared util can't silently change acceptance semantics — e.g. mobile numbers
 * starting with 5 must still be rejected.
 */

describe("sanitizeMobile", () => {
  it("strips non-digits and caps at 10", () => {
    // "+91 98-765 43210" -> 9198765432101 stripped, then first 10 chars.
    expect(sanitizeMobile("+91 98-765 43210 XX")).toBe("9198765432");
    expect(sanitizeMobile("98765432109999")).toBe("9876543210");
    expect(sanitizeMobile("")).toBe("");
  });
});

describe("sanitizePincode", () => {
  it("strips non-digits and caps at 6", () => {
    expect(sanitizePincode("411018")).toBe("411018");
    expect(sanitizePincode("411-018-999")).toBe("411018");
  });
});

describe("sanitizeDigits", () => {
  it("caps at the requested length", () => {
    expect(sanitizeDigits("abc12345def6789", 4)).toBe("1234");
    expect(sanitizeDigits("12", 6)).toBe("12");
  });
});

describe("validateMobile", () => {
  it("accepts a valid Indian mobile", () => {
    expect(validateMobile("9876543210")).toBeNull();
    expect(validateMobile("6234567890")).toBeNull();
  });

  it("rejects wrong length", () => {
    expect(validateMobile("98765432")).not.toBeNull();
    expect(validateMobile("98765432109")).not.toBeNull();
  });

  it("rejects numbers starting with 0-5", () => {
    expect(validateMobile("5876543210")).not.toBeNull();
    expect(validateMobile("0876543210")).not.toBeNull();
  });

  it("returns null for empty / whitespace (optional field)", () => {
    expect(validateMobile("")).toBeNull();
    expect(validateMobile("   ")).toBeNull();
  });
});

describe("validateMobileRequired", () => {
  it("rejects empty", () => {
    expect(validateMobileRequired("")).not.toBeNull();
    expect(validateMobileRequired("   ")).not.toBeNull();
  });

  it("passes through to validateMobile when non-empty", () => {
    expect(validateMobileRequired("9876543210")).toBeNull();
    expect(validateMobileRequired("5876543210")).not.toBeNull();
  });
});

describe("validatePincode", () => {
  it("accepts exactly 6 digits", () => {
    expect(validatePincode("411018")).toBeNull();
  });

  it("rejects wrong length or non-numeric", () => {
    expect(validatePincode("41101")).not.toBeNull();
    expect(validatePincode("4110188")).not.toBeNull();
    expect(validatePincode("41101a")).not.toBeNull();
  });
});

describe("validateEmail", () => {
  it("accepts basic well-formed addresses", () => {
    expect(validateEmail("nitesh@example.com")).toBeNull();
    expect(validateEmail("a.b+tag@sub.example.co.in")).toBeNull();
  });

  it("rejects obviously malformed", () => {
    expect(validateEmail("not-an-email")).not.toBeNull();
    expect(validateEmail("no@dot")).not.toBeNull();
    expect(validateEmail("@example.com")).not.toBeNull();
    expect(validateEmail("with space@example.com")).not.toBeNull();
  });

  it("returns null for empty (optional field)", () => {
    expect(validateEmail("")).toBeNull();
  });
});

describe("validateEmailRequired", () => {
  it("rejects empty", () => {
    expect(validateEmailRequired("")).not.toBeNull();
  });
});

describe("validateGstin", () => {
  it("accepts a canonical 15-char GSTIN", () => {
    expect(validateGstin("27AAAAA0000A1Z5")).toBeNull();
  });

  it("normalises case then checks", () => {
    expect(validateGstin("27aaaaa0000a1z5")).toBeNull();
  });

  it("rejects wrong length", () => {
    expect(validateGstin("27AAAAA0000A1Z")).not.toBeNull();
  });

  it("requires Z at position 13", () => {
    // Position-13 must be a literal Z. Substitute another letter -> rejected.
    expect(validateGstin("27AAAAA0000A1A5")).not.toBeNull();
  });
});

describe("validatePan", () => {
  it("accepts a canonical 10-char PAN", () => {
    expect(validatePan("AAAAA0000A")).toBeNull();
  });

  it("rejects wrong length or wrong shape", () => {
    expect(validatePan("AAAAA000A")).not.toBeNull();
    expect(validatePan("00000AAAAA")).not.toBeNull();
  });
});

describe("validateIfsc", () => {
  it("accepts the SBIN pattern", () => {
    expect(validateIfsc("SBIN0001234")).toBeNull();
  });

  it("rejects when the 5th char is not zero", () => {
    // IFSC's 5th character is always '0' by convention.
    expect(validateIfsc("SBIN1001234")).not.toBeNull();
  });
});

describe("validateAadhar", () => {
  it("accepts exactly 12 digits", () => {
    expect(validateAadhar("123456789012")).toBeNull();
  });

  it("rejects wrong length or non-numeric", () => {
    expect(validateAadhar("12345678901")).not.toBeNull();
    expect(validateAadhar("12345678A012")).not.toBeNull();
  });
});

describe("firstError", () => {
  it("returns the first non-null message", () => {
    expect(firstError(null, "second", "third")).toBe("second");
  });

  it("returns null when everything passed", () => {
    expect(firstError(null, null)).toBeNull();
  });
});
