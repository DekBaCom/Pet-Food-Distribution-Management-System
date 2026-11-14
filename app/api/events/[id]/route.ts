import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const event = await prisma.event.findUnique({ where: { id } });
  if (!event) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(event);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role;
  if (!ADMIN_ROLES.has(role || "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const body = await req.json();

  const data: Record<string, unknown> = {};
  if ("name" in body) data.name = String(body.name).trim();
  if ("description" in body) data.description = body.description ? String(body.description).trim() : null;
  if ("eventDate" in body) {
    const parsed = new Date(body.eventDate);
    if (Number.isNaN(parsed.getTime())) {
      return NextResponse.json({ error: "รูปแบบวันที่ไม่ถูกต้อง" }, { status: 400 });
    }
    data.eventDate = parsed;
  }
  if ("startTime" in body) data.startTime = String(body.startTime);
  if ("endTime" in body) data.endTime = String(body.endTime);
  if ("location" in body) data.location = String(body.location).trim();
  if ("province" in body) data.province = body.province ? String(body.province).trim() : null;
  if ("isActive" in body) data.isActive = Boolean(body.isActive);

  const event = await prisma.event.update({ where: { id }, data });
  return NextResponse.json(event);
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role;
  if (!ADMIN_ROLES.has(role || "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const regs = await prisma.registration.count({ where: { eventId: id } });
  if (regs > 0) {
    // Soft-delete if anyone's already registered so we don't orphan rows
    const event = await prisma.event.update({ where: { id }, data: { isActive: false } });
    return NextResponse.json({ event, softDeleted: true });
  }
  await prisma.event.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
