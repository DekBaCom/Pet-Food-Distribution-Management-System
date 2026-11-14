import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reg = await prisma.registration.findUnique({
    where: { id: params.id },
    include: { animals: true, foodRequests: true, documents: true, qrCode: true, checkin: { include: { staff: true } }, distributions: true },
  });
  if (!reg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(reg);
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const allowedFields = ["status", "notes"];
  const updateData: Record<string, unknown> = {};
  for (const key of allowedFields) {
    if (key in body) updateData[key] = body[key];
  }

  const reg = await prisma.registration.update({ where: { id: params.id }, data: updateData });
  return NextResponse.json(reg);
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const role = (session.user as { role?: string })?.role;
  if (!["SUPER_ADMIN", "ADMIN"].includes(role || "")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.registration.update({ where: { id: params.id }, data: { status: "CANCELLED" } });
  return NextResponse.json({ success: true });
}
