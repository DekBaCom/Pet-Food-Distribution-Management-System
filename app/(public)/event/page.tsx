import { Calendar, Clock, MapPin, Package, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatThaiDate(d: Date): string {
  return d.toLocaleDateString("th-TH", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });
}

export default async function EventPage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = (await prisma.event.findMany({
    where: { isActive: true, eventDate: { gte: today } },
    orderBy: { eventDate: "asc" },
    take: 10,
  })) as unknown as Array<{
    id: string; name: string; description: string | null;
    eventDate: Date; startTime: string; endTime: string;
    location: string; province: string | null;
  }>;

  const inventory = (await prisma.inventory.findMany({ orderBy: { foodType: "asc" } })) as unknown as Array<{
    foodType: string; foodName: string; remaining: number; unit: string;
  }>;

  return (
    <div className="container py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">กำหนดการ</h1>
      <p className="text-muted-foreground mb-8">รายละเอียดกิจกรรมแจกอาหารสุนัขและแมว</p>

      {upcoming.length === 0 ? (
        <Card className="border-gray-200">
          <CardContent className="py-12 text-center">
            <Calendar className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
            <p className="text-lg font-medium">ยังไม่มีงานที่กำหนด</p>
            <p className="text-sm text-muted-foreground mt-1">โปรดติดตามข่าวสารการจัดกิจกรรมครั้งถัดไป</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {upcoming.map((e) => (
            <Card key={e.id} className="border-blue-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-blue-500" />
                  {e.name}
                </CardTitle>
                {e.description && <p className="text-sm text-muted-foreground">{e.description}</p>}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-start gap-3">
                  <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">วันที่จัดงาน</div>
                    <div className="text-muted-foreground">{formatThaiDate(new Date(e.eventDate))}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">เวลา</div>
                    <div className="text-muted-foreground">{e.startTime} น. - {e.endTime} น.</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <div className="font-medium">สถานที่</div>
                    <div className="text-muted-foreground">{e.location}</div>
                    {e.province && <div className="text-sm text-muted-foreground">{e.province}</div>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {inventory.length > 0 && (
            <Card className="border-green-100">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-green-500" />
                  อาหารที่เตรียมไว้
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {inventory.map((item) => (
                    <div key={item.foodType} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                      <span className="font-medium">{item.foodName}</span>
                      <span className="text-green-700 font-bold">{item.remaining.toLocaleString()} {item.unit}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          <Card className="border-orange-100">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-orange-500" />
                เงื่อนไขการรับอาหาร
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                {[
                  "ต้องลงทะเบียนออนไลน์ล่วงหน้าเท่านั้น",
                  "1 การลงทะเบียนรับอาหารได้ 1 ครั้งเท่านั้น",
                  "ต้องนำ QR Code มาแสดงในวันงาน",
                  "จำนวนอาหารที่ได้รับขึ้นอยู่กับ Stock ที่มี",
                  "เจ้าหน้าที่ขอสงวนสิทธิ์ในการตรวจสอบข้อมูล",
                  "ต้องแสดงบัตรประชาชนหรือเอกสารยืนยันตัวตน",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-orange-500 mt-0.5">•</span>
                    <span className="text-muted-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="text-center">
            <Link href="/register">
              <Button size="lg" className="gap-2">ลงทะเบียนรับอาหาร</Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
