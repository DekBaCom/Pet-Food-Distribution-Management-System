import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, CheckCircle2, Package, Clock } from "lucide-react";
import { formatNumber, formatDateTime } from "@/lib/utils";
import { AdminCharts } from "@/components/admin/charts";

export default async function AdminDashboard() {
  const [
    totalReg,
    received,
    checkedIn,
    distributions,
    inventory,
    recentRegs,
  ] = await Promise.all([
    prisma.registration.count(),
    prisma.registration.count({ where: { status: "RECEIVED" } }),
    prisma.registration.count({ where: { status: "CHECKED_IN" } }),
    prisma.distribution.groupBy({ by: ["foodType"], _sum: { quantity: true } }),
    prisma.inventory.findMany(),
    prisma.registration.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { animals: true },
    }),
  ]);

  const animals = await prisma.animal.aggregate({
    _sum: { total: true },
    where: { animalType: "DOG" },
  });
  const catsAgg = await prisma.animal.aggregate({
    _sum: { total: true },
    where: { animalType: "CAT" },
  });

  const totalDogs = animals._sum.total ?? 0;
  const totalCats = catsAgg._sum.total ?? 0;
  const pending = totalReg - received - checkedIn;

  const stats = [
    { label: "ผู้ลงทะเบียน", value: totalReg, icon: Users, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "รับอาหารแล้ว", value: received, icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
    { label: "ยังไม่รับ", value: pending, icon: Clock, color: "text-orange-600", bg: "bg-orange-50" },
    { label: "สุนัขทั้งหมด", value: totalDogs, icon: () => <span className="text-xl">🐶</span>, color: "text-indigo-600", bg: "bg-indigo-50" },
    { label: "แมวทั้งหมด", value: totalCats, icon: () => <span className="text-xl">🐱</span>, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Stock เหลือ (KG)", value: inventory.reduce((s, i) => s + i.remaining, 0), icon: Package, color: "text-teal-600", bg: "bg-teal-50" },
  ];

  const distMap: Record<string, number> = {};
  distributions.forEach((d) => {
    distMap[d.foodType] = d._sum.quantity ?? 0;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm">ภาพรวมของกิจกรรมแจกอาหาร</p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
                <div>
                  <div className={`text-xl font-bold ${s.color}`}>{formatNumber(s.value)}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Distribution summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">อาหารที่แจกจ่ายแล้ว</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {["อาหารสุนัข", "อาหารแมว", "อาหารลูกสุนัข", "อาหารลูกแมว", "อาหารเปียก"].map((ft) => (
              <div key={ft} className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-bold text-primary">{formatNumber(distMap[ft] || 0)}</div>
                <div className="text-xs text-muted-foreground">
                  {ft.includes("เปียก") ? "ซอง" : "KG"}
                </div>
                <div className="text-xs mt-1">{ft}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts */}
      <AdminCharts />

      {/* Recent registrations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">ลงทะเบียนล่าสุด</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRegs.length === 0 ? (
            <p className="text-muted-foreground text-sm text-center py-4">ยังไม่มีข้อมูล</p>
          ) : (
            <div className="space-y-3">
              {recentRegs.map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <div className="font-medium text-sm">{r.fullName}</div>
                    <div className="text-xs text-muted-foreground">
                      {r.registrationId} · {r.province}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</div>
                    <div className="text-xs mt-0.5">
                      🐶 {r.animals.find((a) => a.animalType === "DOG")?.total ?? 0}
                      &nbsp;🐱 {r.animals.find((a) => a.animalType === "CAT")?.total ?? 0}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
