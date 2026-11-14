import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { parseQRData } from "@/lib/qr";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { qrData, registrationId } = await req.json();

    let reg;

    if (qrData) {
      // Parse QR code data
      const parsed = parseQRData(qrData);
      if (!parsed?.rid) {
        return NextResponse.json({ error: "QR Code ไม่ถูกต้อง" }, { status: 400 });
      }

      // Find registration and verify token prefix
      reg = await prisma.registration.findFirst({
        where: { registrationId: parsed.rid },
        include: {
          animals: true,
          qrCode: true,
          checkin: { include: { staff: { select: { name: true } } } },
          distributions: true,
        },
      });

      if (!reg) return NextResponse.json({ error: "ไม่พบข้อมูลการลงทะเบียน" }, { status: 404 });

      // Verify token prefix
      if (!reg.secureToken.startsWith(parsed.tok)) {
        return NextResponse.json({ error: "QR Code ไม่ถูกต้องหรือหมดอายุ" }, { status: 400 });
      }

      // Check QR active
      if (!reg.qrCode?.isActive) {
        return NextResponse.json({ error: "QR Code ถูกปิดใช้งานแล้ว" }, { status: 400 });
      }
    } else if (registrationId) {
      // Lookup by registration ID directly (staff manual entry)
      reg = await prisma.registration.findFirst({
        where: {
          OR: [
            { registrationId: String(registrationId) },
            { phone: String(registrationId) },
          ],
        },
        include: {
          animals: true,
          qrCode: true,
          checkin: { include: { staff: { select: { name: true } } } },
          distributions: true,
        },
      });
      if (!reg) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });
    } else {
      return NextResponse.json({ error: "Missing qrData or registrationId" }, { status: 400 });
    }

    // Check if cancelled/rejected
    if (["CANCELLED", "REJECTED"].includes(reg.status)) {
      return NextResponse.json({ error: `การลงทะเบียนนี้ถูก${reg.status === "CANCELLED" ? "ยกเลิก" : "ไม่อนุมัติ"}แล้ว` }, { status: 400 });
    }

    const dogs = reg.animals.find((a) => a.animalType === "DOG") || { total: 0 };
    const cats = reg.animals.find((a) => a.animalType === "CAT") || { total: 0 };

    // Check already received
    if (reg.status === "RECEIVED" || reg.checkin) {
      return NextResponse.json({
        ...reg,
        secureToken: undefined,
        dogs,
        cats,
        alreadyCheckedIn: true,
        checkinInfo: reg.checkin,
      });
    }

    return NextResponse.json({
      id: reg.id,
      registrationId: reg.registrationId,
      fullName: reg.fullName,
      phone: reg.phone,
      province: reg.province,
      receiverType: reg.receiverType,
      status: reg.status,
      dogs,
      cats,
      alreadyCheckedIn: false,
    });
  } catch (err) {
    console.error("QR scan error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการตรวจสอบ QR" }, { status: 500 });
  }
}
