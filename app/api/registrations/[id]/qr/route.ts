import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { generateQRDataURL } from "@/lib/qr";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const reg = await prisma.registration.findUnique({
    where: { id },
    include: { qrCode: true },
  });
  if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const qrDataUrl = await generateQRDataURL(reg.registrationId, reg.secureToken);
  return NextResponse.json({ qrDataUrl, registrationId: reg.registrationId });
}
