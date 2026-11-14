import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const ADMIN_ROLES = new Set(["SUPER_ADMIN", "ADMIN"]);

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role;
  if (!ADMIN_ROLES.has(role || "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const body = await req.json();

  const updateData: Record<string, unknown> = {};
  if ("name" in body) updateData.name = String(body.name).trim();
  if ("role" in body) updateData.role = String(body.role);
  if ("staffCode" in body) updateData.staffCode = body.staffCode ? String(body.staffCode).trim() : null;
  if ("isActive" in body) updateData.isActive = Boolean(body.isActive);
  if ("password" in body && body.password) {
    const pw = String(body.password);
    if (pw.length < 6) return NextResponse.json({ error: "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร" }, { status: 400 });
    updateData.password = await bcrypt.hash(pw, 12);
  }

  // Guardrail: don't let the last active SUPER_ADMIN demote or deactivate themselves into irrecoverable state.
  if (updateData.role !== undefined || updateData.isActive === false) {
    const target = await prisma.user.findUnique({ where: { id }, select: { role: true, isActive: true } });
    if (target?.role === "SUPER_ADMIN" && target.isActive) {
      const willStayAdmin = (updateData.role ?? target.role) === "SUPER_ADMIN";
      const willStayActive = updateData.isActive !== false;
      if (!willStayAdmin || !willStayActive) {
        const remaining = await prisma.user.count({ where: { role: "SUPER_ADMIN", isActive: true, NOT: { id } } });
        if (remaining === 0) {
          return NextResponse.json({ error: "ต้องมี SUPER_ADMIN อย่างน้อย 1 คนในระบบ" }, { status: 400 });
        }
      }
    }
  }

  try {
    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: { id: true, name: true, email: true, role: true, staffCode: true, isActive: true },
    });
    return NextResponse.json(user);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "P2002") return NextResponse.json({ error: "รหัสเจ้าหน้าที่นี้ถูกใช้แล้ว" }, { status: 409 });
    return NextResponse.json({ error: "อัปเดตไม่สำเร็จ" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const role = (session.user as { role?: string })?.role;
  if (!ADMIN_ROLES.has(role || "")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await context.params;
  const myId = (session.user as { id?: string })?.id;
  if (myId === id) {
    return NextResponse.json({ error: "ไม่สามารถลบบัญชีของตนเองได้" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id }, select: { role: true } });
  if (!target) return NextResponse.json({ error: "ไม่พบผู้ใช้" }, { status: 404 });

  if (target.role === "SUPER_ADMIN") {
    const remaining = await prisma.user.count({ where: { role: "SUPER_ADMIN", isActive: true, NOT: { id } } });
    if (remaining === 0) {
      return NextResponse.json({ error: "ต้องมี SUPER_ADMIN อย่างน้อย 1 คนในระบบ" }, { status: 400 });
    }
  }

  // Soft-delete if user has any references we can't drop (checkins/distributions/audit logs)
  const [checkins, distributions, auditLogs] = await Promise.all([
    prisma.checkin.count({ where: { staffId: id } }),
    prisma.distribution.count({ where: { distributedById: id } }),
    prisma.auditLog.count({ where: { userId: id } }),
  ]);
  if (checkins + distributions + auditLogs > 0) {
    const user = await prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: { id: true, isActive: true },
    });
    return NextResponse.json({ user, softDeleted: true });
  }

  await prisma.session.deleteMany({ where: { userId: id } });
  await prisma.account.deleteMany({ where: { userId: id } });
  await prisma.user.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
