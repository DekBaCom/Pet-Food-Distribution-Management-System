import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { registrationId, phone } = await req.json();
    if (!registrationId && !phone) {
      return NextResponse.json({ error: "กรุณากรอกรหัสหรือเบอร์โทรศัพท์" }, { status: 400 });
    }

    const where = registrationId
      ? { registrationId: String(registrationId) }
      : { phone: String(phone) };

    const reg = await prisma.registration.findFirst({
      where,
      include: {
        animals: true,
        checkin: { include: { staff: { select: { name: true } } } },
        distributions: { orderBy: { distributedAt: "desc" } },
      },
    });

    if (!reg) return NextResponse.json({ error: "ไม่พบข้อมูลการลงทะเบียน" }, { status: 404 });

    const { secureToken: _secureToken, ...safe } = reg;
    const dogs = reg.animals.find((a) => a.animalType === "DOG") || { total: 0 };
    const cats = reg.animals.find((a) => a.animalType === "CAT") || { total: 0 };

    return NextResponse.json({ ...safe, dogs, cats });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
