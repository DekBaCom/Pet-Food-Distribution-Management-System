import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET() {
  const inventory = await prisma.inventory.findMany({
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 10 } },
    orderBy: { foodType: "asc" },
  });
  return NextResponse.json({ inventory });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { foodType, foodName, unit, openingStock } = body;

  const inv = await prisma.inventory.create({
    data: { foodType, foodName, unit: unit || "KG", openingStock: openingStock || 0, received: 0, distributed: 0, remaining: openingStock || 0 },
  });
  return NextResponse.json(inv, { status: 201 });
}
