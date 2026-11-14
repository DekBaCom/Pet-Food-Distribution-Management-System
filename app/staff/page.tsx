import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { ScanLine, Package } from "lucide-react";
import { formatNumber } from "@/lib/utils";

export default async function StaffPage() {
  const session = await getServerSession(authOptions);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [todayCheckins, totalPending, totalReceived] = await Promise.all([
    prisma.checkin.count({ where: { checkinTime: { gte: today } } }),
    prisma.registration.count({ where: { status: "REGISTERED" } }),
    prisma.registration.count({ where: { status: "RECEIVED" } }),
  ]);

  return (
    <div className="py-6">
      <div className="mb-6">
        <h1 className="text-xl font-bold">สวัสดี, {session?.user?.name || "เจ้าหน้าที่"} 👋</h1>
        <p className="text-muted-foreground text-sm">
          วันนี้ {new Date().toLocaleDateString("th-TH", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="border-green-100">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-green-600">{formatNumber(todayCheckins)}</div>
            <div className="text-xs text-muted-foreground">Check-in วันนี้</div>
          </CardContent>
        </Card>
        <Card className="border-blue-100">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-blue-600">{formatNumber(totalPending)}</div>
            <div className="text-xs text-muted-foreground">รอรับอาหาร</div>
          </CardContent>
        </Card>
        <Card className="border-orange-100">
          <CardContent className="pt-4 pb-3 text-center">
            <div className="text-2xl font-bold text-orange-600">{formatNumber(totalReceived)}</div>
            <div className="text-xs text-muted-foreground">รับแล้ว</div>
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 gap-3">
        <Link href="/staff/checkin">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-primary/20 hover:border-primary">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ScanLine className="h-7 w-7 text-blue-600" />
                </div>
                <div>
                  <div className="font-bold text-lg">Scan QR Code</div>
                  <div className="text-sm text-muted-foreground">สแกน QR เพื่อ Check-in และแจกอาหาร</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
        <Link href="/staff/distribution">
          <Card className="hover:shadow-md transition-shadow cursor-pointer border-green-100">
            <CardContent className="pt-5 pb-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
                  <Package className="h-7 w-7 text-green-600" />
                </div>
                <div>
                  <div className="font-bold text-lg">กรอก ID แจกอาหาร</div>
                  <div className="text-sm text-muted-foreground">ค้นหาด้วยรหัส แล้วบันทึกการแจก</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
