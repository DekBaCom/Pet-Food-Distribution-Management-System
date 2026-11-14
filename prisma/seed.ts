import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateRegistrationId, generateSecureToken, buildQRPayload } from "../lib/qr";

const prisma = new PrismaClient();

const RECEIVER_TYPES = [
  "ผู้เลี้ยงสัตว์ส่วนตัว",
  "บ้านพักสัตว์ / Shelter",
  "กลุ่มช่วยเหลือสัตว์",
  "มูลนิธิ / องค์กร",
  "ผู้ดูแลสัตว์จร",
  "อื่น ๆ",
];

const PROVINCES = [
  "กรุงเทพมหานคร", "เชียงใหม่", "ชลบุรี", "ขอนแก่น", "นครราชสีมา",
  "สงขลา", "ภูเก็ต", "ปทุมธานี", "นนทบุรี", "สมุทรปราการ",
];

const FOOD_TYPES = [
  { type: "อาหารสุนัข", unit: "KG", opening: 2000 },
  { type: "อาหารแมว", unit: "KG", opening: 1500 },
  { type: "อาหารลูกสุนัข", unit: "KG", opening: 500 },
  { type: "อาหารลูกแมว", unit: "KG", opening: 500 },
  { type: "อาหารเปียก", unit: "ซอง", opening: 2000 },
];

const FIRST_NAMES = ["สมชาย", "วิภา", "นันทกา", "ประทีป", "สุนีย์", "วิชัย", "มาลี", "สมศรี", "อนุชา", "พรทิพย์"];
const LAST_NAMES = ["ใจดี", "รักสัตว์", "ศรีสวัสดิ์", "แสนดี", "มีสุข", "ดีมาก", "สุวรรณ", "โอสถ", "แก้วใส", "เพชรงาม"];

function rand<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  console.log("🌱 Starting seed...");

  // Clean up
  await prisma.auditLog.deleteMany();
  await prisma.inventoryTransaction.deleteMany();
  await prisma.inventory.deleteMany();
  await prisma.distribution.deleteMany();
  await prisma.checkin.deleteMany();
  await prisma.qRCode.deleteMany();
  await prisma.document.deleteMany();
  await prisma.foodRequest.deleteMany();
  await prisma.animal.deleteMany();
  await prisma.registration.deleteMany();
  await prisma.event.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const userDefs = [
    { name: "Super Admin", email: "super_admin@petfood.th", password: "Admin123!", role: "SUPER_ADMIN", staffCode: "ADMIN-001" },
    { name: "Admin ระบบ", email: "admin@petfood.th", password: "Admin123!", role: "ADMIN", staffCode: "ADMIN-002" },
    { name: "เจ้าหน้าที่ลงทะเบียน", email: "reg_staff@petfood.th", password: "Staff123!", role: "REGISTRATION_STAFF", staffCode: "STAFF-001" },
    { name: "เจ้าหน้าที่ Check-in", email: "checkin@petfood.th", password: "Staff123!", role: "CHECKIN_STAFF", staffCode: "STAFF-002" },
    { name: "เจ้าหน้าที่คลัง", email: "warehouse@petfood.th", password: "Staff123!", role: "WAREHOUSE", staffCode: "STAFF-003" },
    { name: "Supervisor หน้างาน", email: "supervisor@petfood.th", password: "Staff123!", role: "SUPERVISOR", staffCode: "SUP-001" },
    { name: "ผู้ดูข้อมูล", email: "viewer@petfood.th", password: "View123!", role: "VIEWER", staffCode: null },
  ];

  const users: { id: string; email: string; role: string; staffCode: string | null }[] = [];
  for (const u of userDefs) {
    const hashed = await bcrypt.hash(u.password, 10);
    const user = await prisma.user.create({
      data: { name: u.name, email: u.email, password: hashed, role: u.role, staffCode: u.staffCode, isActive: true },
    });
    users.push(user);
    console.log(`  ✅ Created user: ${u.email}`);
  }

  // Create event
  const event = await prisma.event.create({
    data: {
      name: "กิจกรรมแจกอาหารสัตว์ 2026",
      description: "กิจกรรมแจกอาหารสุนัขและแมวประจำปี 2026",
      eventDate: new Date("2026-11-22"),
      startTime: "09:00",
      endTime: "16:00",
      location: "ศูนย์ชุมชนกลาง กรุงเทพมหานคร",
      province: "กรุงเทพมหานคร",
      isActive: true,
    },
  });
  console.log("  ✅ Created event");

  // Create inventory
  for (const f of FOOD_TYPES) {
    await prisma.inventory.create({
      data: {
        foodType: f.type,
        foodName: f.type,
        unit: f.unit,
        openingStock: f.opening,
        received: 0,
        distributed: 0,
        remaining: f.opening,
        minStock: f.opening * 0.1,
      },
    });
  }
  console.log("  ✅ Created inventory");

  // Create 100 registrations
  const checkinStaff = users.find((u) => u.role === "CHECKIN_STAFF") || users[0];
  const registrations: { id: string; registrationId: string }[] = [];

  for (let i = 0; i < 100; i++) {
    const firstName = rand(FIRST_NAMES);
    const lastName = rand(LAST_NAMES);
    const fullName = `${firstName} ${lastName}`;
    const phone = `08${randInt(1, 9)}${randInt(1000000, 9999999)}`;
    const province = rand(PROVINCES);
    const receiverType = rand(RECEIVER_TYPES);
    const dogTotal = randInt(0, 30);
    const catTotal = randInt(0, 20);

    const registrationId = generateRegistrationId(i + 1);
    const secureToken = generateSecureToken();
    const qrPayload = buildQRPayload(registrationId, secureToken);

    const reg = await prisma.registration.create({
      data: {
        registrationId,
        secureToken,
        fullName,
        phone,
        province,
        district: "",
        receiverType,
        status: "REGISTERED",
        eventId: event.id,
        createdAt: new Date(Date.now() - randInt(0, 7) * 86400000),
        animals: {
          create: [
            ...(dogTotal > 0 ? [{
              animalType: "DOG", total: dogTotal,
              young: randInt(0, Math.floor(dogTotal / 3)),
              adult: randInt(0, Math.floor(dogTotal / 2)),
              senior: randInt(0, Math.floor(dogTotal / 4)),
              special: randInt(0, Math.floor(dogTotal / 6)),
            }] : []),
            ...(catTotal > 0 ? [{
              animalType: "CAT", total: catTotal,
              young: randInt(0, Math.floor(catTotal / 3)),
              adult: randInt(0, Math.floor(catTotal / 2)),
              senior: randInt(0, Math.floor(catTotal / 4)),
              special: randInt(0, Math.floor(catTotal / 6)),
            }] : []),
          ],
        },
        foodRequests: {
          create: [
            ...(dogTotal > 0 ? [{ foodType: "อาหารสุนัข", requestedQty: Math.ceil(dogTotal / 5) * 2, unit: "KG" }] : []),
            ...(catTotal > 0 ? [{ foodType: "อาหารแมว", requestedQty: Math.ceil(catTotal / 5) * 2, unit: "KG" }] : []),
            ...(Math.random() > 0.5 ? [{ foodType: "อาหารเปียก", requestedQty: randInt(5, 20), unit: "ซอง" }] : []),
          ],
        },
        qrCode: { create: { qrData: qrPayload, isActive: true } },
      },
    });
    registrations.push(reg);
  }
  console.log("  ✅ Created 100 registrations");

  // Create 50 check-ins with distributions
  const toCheckin = registrations.slice(0, 50);
  for (const reg of toCheckin) {
    // Create checkin
    await prisma.checkin.create({
      data: {
        registrationId: reg.id,
        staffId: checkinStaff.id,
        checkinTime: new Date(Date.now() - randInt(0, 3) * 3600000),
        status: "CHECKED_IN",
      },
    });

    // Create distributions
    const dogQty = randInt(2, 15);
    const catQty = randInt(2, 10);

    const distItems = [
      { foodType: "อาหารสุนัข", qty: dogQty, unit: "KG" },
      { foodType: "อาหารแมว", qty: catQty, unit: "KG" },
    ];

    for (const item of distItems) {
      // Update inventory
      const inv = await prisma.inventory.findFirst({ where: { foodType: item.foodType } });
      if (inv && inv.remaining >= item.qty) {
        await prisma.inventory.update({
          where: { id: inv.id },
          data: {
            distributed: { increment: item.qty },
            remaining: { decrement: item.qty },
            transactions: {
              create: { type: "DISTRIBUTE", quantity: item.qty, unit: item.unit, reference: reg.registrationId, createdById: checkinStaff.id },
            },
          },
        });

        await prisma.distribution.create({
          data: {
            registrationId: reg.id,
            distributedById: checkinStaff.id,
            foodType: item.foodType,
            quantity: item.qty,
            unit: item.unit,
          },
        });
      }
    }

    // Update registration status
    await prisma.registration.update({
      where: { id: reg.id },
      data: { status: "RECEIVED" },
    });
  }
  console.log("  ✅ Created 50 check-ins and distributions");

  console.log("\n🎉 Seed completed!");
  console.log("\n📋 Demo Accounts:");
  console.log("  super_admin@petfood.th / Admin123! (SUPER_ADMIN)");
  console.log("  admin@petfood.th / Admin123! (ADMIN)");
  console.log("  reg_staff@petfood.th / Staff123! (REGISTRATION_STAFF)");
  console.log("  checkin@petfood.th / Staff123! (CHECKIN_STAFF)");
  console.log("  warehouse@petfood.th / Staff123! (WAREHOUSE)");
  console.log("  supervisor@petfood.th / Staff123! (SUPERVISOR)");
  console.log("  viewer@petfood.th / View123! (VIEWER)");
}

main()
  .then(() => prisma.$disconnect())
  .catch((e) => { console.error(e); prisma.$disconnect(); process.exit(1); });
