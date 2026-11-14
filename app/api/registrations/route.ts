import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { generateSecureToken, generateRegistrationId, buildQRPayload } from "@/lib/qr";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = req.nextUrl;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const search = searchParams.get("search") || "";
  const province = searchParams.get("province") || "";
  const status = searchParams.get("status") || "";
  const receiverType = searchParams.get("receiverType") || "";

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { fullName: { contains: search } },
      { phone: { contains: search } },
      { registrationId: { contains: search } },
    ];
  }
  if (province) where.province = province;
  if (status) where.status = status;
  if (receiverType) where.receiverType = receiverType;

  const [registrations, total] = await Promise.all([
    prisma.registration.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: { animals: true },
    }),
    prisma.registration.count({ where }),
  ]);

  return NextResponse.json({ registrations, total, pages: Math.ceil(total / limit), page });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const dataStr = formData.get("data") as string;
    if (!dataStr) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    const data = JSON.parse(dataStr);
    const { fullName, phone, lineId, province, district, receiverType, dogs, cats, foodRequests } = data;

    if (!fullName || !phone || !province || !receiverType) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Generate registration ID
    const count = await prisma.registration.count();
    const registrationId = generateRegistrationId(count + 1);
    const secureToken = generateSecureToken();

    // Handle file uploads
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const documents: { documentType: string; fileUrl: string; fileName: string; fileSize?: number; mimeType?: string }[] = [];
    const profileFile = formData.get("profile") as File | null;
    if (profileFile) {
      const bytes = await profileFile.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const filename = `${registrationId}-profile-${Date.now()}.${profileFile.name.split(".").pop()}`;
      await writeFile(path.join(uploadDir, filename), buffer);
      documents.push({ documentType: "PROFILE_PHOTO", fileUrl: `/uploads/${filename}`, fileName: profileFile.name, fileSize: profileFile.size, mimeType: profileFile.type });
    }

    for (let i = 0; i < 5; i++) {
      const animalFile = formData.get(`animal_${i}`) as File | null;
      if (animalFile) {
        const bytes = await animalFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const filename = `${registrationId}-animal-${i}-${Date.now()}.${animalFile.name.split(".").pop()}`;
        await writeFile(path.join(uploadDir, filename), buffer);
        documents.push({ documentType: "ANIMAL_PHOTO", fileUrl: `/uploads/${filename}`, fileName: animalFile.name, fileSize: animalFile.size, mimeType: animalFile.type });
      }
    }

    // Build QR payload
    const qrPayload = buildQRPayload(registrationId, secureToken);

    // Create registration in DB
    const registration = await prisma.registration.create({
      data: {
        registrationId,
        secureToken,
        fullName: fullName.trim(),
        phone: phone.trim(),
        lineId: lineId?.trim() || null,
        province,
        district: district?.trim() || null,
        receiverType,
        status: "REGISTERED",
        animals: {
          create: [
            ...(dogs?.total > 0 ? [{ animalType: "DOG", total: dogs.total, young: dogs.young || 0, adult: dogs.adult || 0, senior: dogs.senior || 0, special: dogs.special || 0 }] : []),
            ...(cats?.total > 0 ? [{ animalType: "CAT", total: cats.total, young: cats.young || 0, adult: cats.adult || 0, senior: cats.senior || 0, special: cats.special || 0 }] : []),
          ],
        },
        foodRequests: {
          create: foodRequests?.filter((f: { selected: boolean }) => f.selected).map((f: { foodType: string; requestedQty: number; unit: string }) => ({
            foodType: f.foodType,
            requestedQty: f.requestedQty || 0,
            unit: f.unit,
          })) || [],
        },
        documents: { create: documents },
        qrCode: { create: { qrData: qrPayload, isActive: true } },
      },
    });

    // Audit log
    await prisma.auditLog.create({
      data: { action: "REGISTRATION_CREATED", entity: "Registration", entityId: registration.id, newData: JSON.stringify({ registrationId, fullName }) },
    });

    return NextResponse.json({ id: registration.id, registrationId: registration.registrationId }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการลงทะเบียน" }, { status: 500 });
  }
}
