import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const checkins = await prisma.checkin.findMany({
    orderBy: { checkinTime: "desc" },
    take: 100,
    include: {
      registration: { select: { registrationId: true, fullName: true, province: true } },
      staff: { select: { name: true } },
    },
  });
  return NextResponse.json({ checkins });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { registrationId } = await req.json();
    if (!registrationId) return NextResponse.json({ error: "Missing registrationId" }, { status: 400 });

    // Find registration
    const reg = await prisma.registration.findFirst({
      where: { registrationId },
      include: { checkin: true },
    });
    if (!reg) return NextResponse.json({ error: "ไม่พบข้อมูลการลงทะเบียน" }, { status: 404 });

    // Check already checked in
    if (reg.checkin) {
      return NextResponse.json({ error: "รับอาหารไปแล้ว", alreadyCheckedIn: true }, { status: 409 });
    }

    // Check cancelled/rejected
    if (["CANCELLED", "REJECTED"].includes(reg.status)) {
      return NextResponse.json({ error: "การลงทะเบียนนี้ถูกยกเลิกหรือไม่อนุมัติ" }, { status: 400 });
    }

    const staffId = (session.user as { id?: string })?.id;
    if (!staffId) return NextResponse.json({ error: "Invalid session" }, { status: 401 });

    // Create checkin
    const checkin = await prisma.checkin.create({
      data: {
        registrationId: reg.id,
        staffId,
        status: "CHECKED_IN",
      },
    });

    // Update registration status
    await prisma.registration.update({
      where: { id: reg.id },
      data: { status: "CHECKED_IN" },
    });

    // Audit
    await prisma.auditLog.create({
      data: { userId: staffId, action: "CHECKIN", entity: "Checkin", entityId: checkin.id },
    });

    return NextResponse.json({ id: checkin.id, checkinTime: checkin.checkinTime });
  } catch (err) {
    console.error("Checkin error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการ Check-in" }, { status: 500 });
  }
}
