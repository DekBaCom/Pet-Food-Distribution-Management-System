import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { subDays, format } from "date-fns";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // Registrations by day (last 14 days)
  const days: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);
    const count = await prisma.registration.count({ where: { createdAt: { gte: start, lte: end } } });
    days.push({ date: format(date, "d/M"), count });
  }

  // By food type
  const distByFood = await prisma.distribution.groupBy({ by: ["foodType"], _sum: { quantity: true } });
  const byFood = distByFood.map((d) => ({ name: d.foodType.replace("อาหาร", ""), value: d._sum.quantity ?? 0 }));

  // By receiver type
  const byTypeRaw = await prisma.registration.groupBy({ by: ["receiverType"], _count: { id: true } });
  const byType = byTypeRaw.map((t) => ({
    name: t.receiverType.length > 10 ? t.receiverType.substring(0, 10) + "..." : t.receiverType,
    value: t._count.id,
  }));

  return NextResponse.json({ daily: days, byFood, byType });
}
