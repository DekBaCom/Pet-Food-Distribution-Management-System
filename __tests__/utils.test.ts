import { formatDate, formatPhone, formatNumber } from "@/lib/utils";
import { generateRegistrationId, generateSecureToken, parseQRData, buildQRPayload } from "@/lib/qr";

describe("formatPhone", () => {
  it("formats 10-digit phone correctly", () => {
    expect(formatPhone("0891234567")).toBe("089-123-4567");
  });
  it("returns input unchanged for non-10-digit", () => {
    expect(formatPhone("123")).toBe("123");
  });
});

describe("generateRegistrationId", () => {
  it("generates correct format", () => {
    const id = generateRegistrationId(1);
    expect(id).toMatch(/^PF-\d{4}-000001$/);
  });
  it("pads sequence to 6 digits", () => {
    const id = generateRegistrationId(42);
    expect(id).toContain("-000042");
  });
});

describe("generateSecureToken", () => {
  it("generates 32-char token", () => {
    const token = generateSecureToken();
    expect(token.length).toBe(32);
  });
  it("generates unique tokens", () => {
    const t1 = generateSecureToken();
    const t2 = generateSecureToken();
    expect(t1).not.toBe(t2);
  });
});

describe("parseQRData", () => {
  it("parses valid QR data", () => {
    const payload = buildQRPayload("PF-2026-000001", "abc123def456ghij");
    const parsed = parseQRData(payload);
    expect(parsed).not.toBeNull();
    expect(parsed?.rid).toBe("PF-2026-000001");
    expect(parsed?.tok).toBe("abc123def456ghij");
  });

  it("returns null for invalid JSON", () => {
    expect(parseQRData("not-json")).toBeNull();
  });

  it("returns null for missing fields", () => {
    expect(parseQRData('{"foo":"bar"}')).toBeNull();
  });
});

describe("formatNumber", () => {
  it("formats numbers with Thai locale", () => {
    const result = formatNumber(1000);
    expect(result).toBeTruthy();
    expect(typeof result).toBe("string");
  });
});
