import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const reg = await prisma.registration.findUnique({
    where: { id },
    include: { animals: true, foodRequests: true, documents: true, qrCode: true, checkin: { include: { staff: true } }, distributions: true },
  });
  if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(reg);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await context.params;
  const body = await req.json();
  const allowedFields = ["status", "notes"];
  const updateData: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) updateData[key] = body[key];
  }

  const reg = await prisma.registration.update({ where: { id }, data: updateData });
  return NextResponse.json(reg);
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (!["SUPER_ADMIN", "ADMIN"].includes(role || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  await prisma.registration.update({ where: { id }, data: { status: "CANCELLED" } });
  return NextResponse.json({ success: true });
}
