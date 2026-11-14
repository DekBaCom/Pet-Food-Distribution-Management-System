import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const upcoming = searchParams.get("upcoming") === "true";
  const activeOnly = searchParams.get("active") === "true";

  const where: Record<string, unknown> = {};
  if (upcoming) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    where.eventDate = { gte: today };
  }
  if (activeOnly) where.isActive = true;

  const events = await prisma.event.findMany({
    where,
    orderBy: { eventDate: "asc" },
  });
  return NextResponse.json({ events });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role;
  if (!ADMIN_ROLES.has(role || "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await req.json();
  const { name, description, eventDate, startTime, endTime, location, province, isActive } = body;

  if (!name || !eventDate || !startTime || !endTime || !location) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบ" }, { status: 400 });
  }

  const parsed = new Date(eventDate);
  if (Number.isNaN(parsed.getTime())) {
    return NextResponse.json({ error: "รูปแบบวันที่ไม่ถูกต้อง" }, { status: 400 });
  }

  const event = await prisma.event.create({
    data: {
      name: String(name).trim(),
      description: description ? String(description).trim() : null,
      eventDate: parsed,
      startTime: String(startTime),
      endTime: String(endTime),
      location: String(location).trim(),
      province: province ? String(province).trim() : null,
      isActive: isActive !== false,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
