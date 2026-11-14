import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const format = searchParams.get("format") || "json";
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const province = searchParams.get("province");
  const status = searchParams.get("status");
  const receiverType = searchParams.get("receiverType");

  const where: Record<string, unknown> = {};
  if (province) where.province = province;
  if (status) where.status = status;
  if (receiverType) where.receiverType = receiverType;
  if (from || to) {
    where.createdAt = {};
    if (from) (where.createdAt as Record<string, Date>).gte = new Date(from);
    if (to) (where.createdAt as Record<string, Date>).lte = new Date(to + "T23:59:59");
  }

  const registrations = await prisma.registration.findMany({
    where,
    include: {
      animals: true,
      foodRequests: true,
      checkin: { include: { staff: { select: { name: true } } } },
      distributions: { orderBy: { distributedAt: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  const rows = registrations.map((r) => ({
    registrationId: r.registrationId,
    fullName: r.fullName,
    phone: r.phone,
    province: r.province,
    receiverType: r.receiverType,
    status: r.status,
    dogs: r.animals.find((a) => a.animalType === "DOG")?.total ?? 0,
    cats: r.animals.find((a) => a.animalType === "CAT")?.total ?? 0,
    foodRequests: r.foodRequests.map((f) => `${f.foodType}:${f.requestedQty}${f.unit}`).join("; "),
    createdAt: r.createdAt.toISOString(),
    receivedAt: r.distributions[0]?.distributedAt?.toISOString() || null,
    staffName: r.checkin?.staff?.name || null,
  }));

  if (format === "csv") {
    const headers = ["Registration ID", "ชื่อ", "โทร", "จังหวัด", "ประเภท", "สถานะ", "สุนัข", "แมว", "อาหาร", "ลงทะเบียน", "รับอาหาร", "เจ้าหน้าที่"];
    const csvRows = rows.map((r) => [
      r.registrationId, r.fullName, r.phone, r.province, r.receiverType, r.status,
      r.dogs, r.cats, r.foodRequests, r.createdAt, r.receivedAt || "", r.staffName || "",
    ].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","));
    const csv = [headers.join(","), ...csvRows].join("\n");
    return new NextResponse("﻿" + csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="report-${Date.now()}.csv"`,
      },
    });
  }

  return NextResponse.json({ rows, total: rows.length });
}
