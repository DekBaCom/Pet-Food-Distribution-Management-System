import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const { id } = await context.params;
    const { type, quantity, notes } = await req.json();
    const inv = await prisma.inventory.findUnique({ where: { id } });
    if (!inv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    let newReceived = inv.received;
    let newRemaining = inv.remaining;

    if (type === "RECEIVE") {
      newReceived += quantity;
      newRemaining += quantity;
    } else if (type === "ADJUST") {
      newRemaining = quantity;
    }

    if (newRemaining < 0) return NextResponse.json({ error: "Stock ไม่เพียงพอ" }, { status: 400 });

    const updated = await prisma.inventory.update({
      where: { id },
      data: {
        received: newReceived,
        remaining: newRemaining,
        transactions: {
          create: {
            type,
            quantity,
            unit: inv.unit,
            notes,
            createdById: (session.user as { id?: string })?.id,
          },
        },
      },
    });
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
