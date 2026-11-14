import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const distributions = await prisma.distribution.findMany({
    orderBy: { distributedAt: "desc" },
    take: 100,
    include: {
      registration: { select: { registrationId: true, fullName: true } },
      distributedBy: { select: { name: true } },
    },
  });
  return NextResponse.json({ distributions });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { registrationId, foodItems } = await req.json();
    if (!registrationId || !foodItems?.length) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const reg = await prisma.registration.findFirst({
      where: { registrationId },
      include: { distributions: true },
    });
    if (!reg) return NextResponse.json({ error: "ไม่พบข้อมูล" }, { status: 404 });

    // Check already received (allow multiple distributions for same registration only if no food yet)
    if (reg.status === "RECEIVED" && reg.distributions.length > 0) {
      return NextResponse.json({ error: "รับอาหารไปแล้ว" }, { status: 409 });
    }

    const staffId = (session.user as { id: string }).id;
    const now = new Date();

    // Check and deduct inventory
    for (const item of foodItems) {
      const inv = await prisma.inventory.findFirst({ where: { foodType: item.foodType } });
      if (!inv) continue;
      if (inv.remaining < item.quantity) {
        return NextResponse.json({ error: `Stock ไม่เพียงพอสำหรับ ${item.foodType}` }, { status: 400 });
      }

      // Deduct stock
      await prisma.inventory.update({
        where: { id: inv.id },
        data: {
          distributed: { increment: item.quantity },
          remaining: { decrement: item.quantity },
          transactions: {
            create: {
              type: "DISTRIBUTE",
              quantity: item.quantity,
              unit: item.unit,
              reference: registrationId,
              createdById: staffId,
            },
          },
        },
      });
    }

    // Create distribution records
    const distributions = await Promise.all(
      foodItems.map((item: { foodType: string; quantity: number; unit: string }) =>
        prisma.distribution.create({
          data: {
            registrationId: reg.id,
            distributedById: staffId,
            foodType: item.foodType,
            quantity: item.quantity,
            unit: item.unit,
            distributedAt: now,
          },
        })
      )
    );

    // Update registration status to RECEIVED
    await prisma.registration.update({
      where: { id: reg.id },
      data: { status: "RECEIVED" },
    });

    await prisma.auditLog.create({
      data: { userId: staffId, action: "DISTRIBUTION", entity: "Distribution", entityId: reg.id },
    });

    return NextResponse.json({ success: true, distributedAt: now.toISOString(), count: distributions.length });
  } catch (err) {
    console.error("Distribution error:", err);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการบันทึก" }, { status: 500 });
  }
}
