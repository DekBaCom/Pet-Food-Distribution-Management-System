import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role;
  if (!["SUPER_ADMIN", "ADMIN"].includes(role || "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, staffCode: true, isActive: true, createdAt: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role;
  if (!["SUPER_ADMIN", "ADMIN"].includes(role || "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const { name, email, password, role: userRole, staffCode } = await req.json();
    if (!name || !email || !password) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) return NextResponse.json({ error: "อีเมลนี้ถูกใช้งานแล้ว" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashed,
        role: userRole || "VIEWER",
        staffCode: staffCode || null,
        isActive: true,
      },
      select: { id: true, name: true, email: true, role: true },
    });
    return NextResponse.json(user, { status: 201 });
  } catch {
    return NextResponse.json({ error: "เกิดข้อผิดพลาด" }, { status: 500 });
  }
}
