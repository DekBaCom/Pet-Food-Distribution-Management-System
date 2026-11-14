import QRCode from "qrcode";
import { nanoid } from "nanoid";

export async function generateQRDataURL(
  registrationId: string,
  secureToken: string
): Promise<string> {
  const qrData = JSON.stringify({
    rid: registrationId,
    tok: secureToken.substring(0, 16),
  });
  return QRCode.toDataURL(qrData, {
    errorCorrectionLevel: "M",
    margin: 2,
    width: 300,
    color: { dark: "#1e40af", light: "#ffffff" },
  });
}

export function generateSecureToken(): string {
  return nanoid(32);
}

export function generateRegistrationId(sequence: number): string {
  const year = new Date().getFullYear();
  return `PF-${year}-${String(sequence).padStart(6, "0")}`;
}

export function parseQRData(qrString: string): { rid: string; tok: string } | null {
  try {
    const parsed = JSON.parse(qrString);
    if (parsed.rid && parsed.tok) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function buildQRPayload(registrationId: string, secureToken: string): string {
  return JSON.stringify({
    rid: registrationId,
    tok: secureToken.substring(0, 16),
  });
}
