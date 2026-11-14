import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, context: { params: Promise<{ registrationId: string }> }) {
  const { registrationId } = await context.params;
  const reg = await prisma.registration.findFirst({
    where: {
      OR: [
        { registrationId },
        { phone: registrationId },
      ],
    },
    include: {
      animals: true,
      foodRequests: true,
      checkin: { include: { staff: { select: { name: true } } } },
      distributions: true,
    },
  });
  if (!reg) return NextResponse.json({ error: "ไม่พบข้อมูลการลงทะเบียน" }, { status: 404 });

  // Don't expose secureToken
  const { secureToken: _secureToken, ...safeReg } = reg;
  const dogs = reg.animals.find((a) => a.animalType === "DOG") || { total: 0 };
  const cats = reg.animals.find((a) => a.animalType === "CAT") || { total: 0 };

  return NextResponse.json({ ...safeReg, dogs, cats });
}
