import Link from "next/link";
import {
  ClipboardList, QrCode, ScanLine, CheckCircle2, Package, BarChart3,
  MapPin, Clock, Calendar, ChevronRight, PawPrint, Heart, ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function formatThaiDate(d: Date): string {
  return d.toLocaleDateString("th-TH", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

const features = [
  { icon: ClipboardList, title: "ลงทะเบียนออนไลน์", desc: "กรอกข้อมูลสัตว์และผู้ดูแล พร้อม Upload รูปภาพ", color: "bg-blue-100 text-blue-600" },
  { icon: QrCode, title: "รับ QR Code", desc: "รับ QR Code ส่วนตัวสำหรับใช้วันงาน", color: "bg-purple-100 text-purple-600" },
  { icon: ScanLine, title: "Scan หน้างาน", desc: "เจ้าหน้าที่ Scan QR เพื่อยืนยันการรับอาหาร", color: "bg-green-100 text-green-600" },
  { icon: CheckCircle2, title: "ติดตามสถานะ", desc: "ตรวจสอบสถานะการลงทะเบียนได้ตลอดเวลา", color: "bg-orange-100 text-orange-600" },
  { icon: Package, title: "ตรวจสอบอาหาร", desc: "จัดการ Stock อาหารสุนัขและแมวแบบ Real-time", color: "bg-teal-100 text-teal-600" },
  { icon: BarChart3, title: "รายงานผล", desc: "Dashboard และ Report ครบถ้วนสำหรับผู้จัดงาน", color: "bg-pink-100 text-pink-600" },
];

const steps = [
  { step: "1", title: "ลงทะเบียน", desc: "กรอกข้อมูลผู้รับและสัตว์เลี้ยง" },
  { step: "2", title: "รับ QR Code", desc: "ดาวน์โหลดหรือ Screenshot QR Code" },
  { step: "3", title: "มาในวันงาน", desc: "นำ QR Code มาแสดงที่จุดแจกอาหาร" },
  { step: "4", title: "รับอาหาร", desc: "เจ้าหน้าที่ Scan และแจกอาหาร" },
];

export default async function HomePage() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = (await prisma.event.findMany({
    where: { isActive: true, eventDate: { gte: today } },
    orderBy: { eventDate: "asc" },
    take: 3,
  })) as unknown as Array<{
    id: string; name: string; description: string | null;
    eventDate: Date; startTime: string; endTime: string;
    location: string; province: string | null; mapUrl: string | null;
  }>;

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-white to-pink-50 py-16 md:py-24">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <PawPrint className="h-4 w-4" />
              กิจกรรมแจกอาหารสัตว์
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4 leading-tight">
              กิจกรรมแจกอาหาร
              <span className="text-primary block">สำหรับน้องหมาและน้องแมว 🐶🐱</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed">
              ช่วยเหลือผู้ดูแลสัตว์ บ้านพักสัตว์ และกลุ่มช่วยเหลือสัตว์
              <br />ลงทะเบียนออนไลน์ รับ QR Code และมารับอาหารในวันงาน
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/register">
                <Button size="lg" className="gap-2 w-full sm:w-auto text-base h-12 px-8">
                  <ClipboardList className="h-5 w-5" />
                  ลงทะเบียนรับอาหาร
                </Button>
              </Link>
              <Link href="/status">
                <Button size="lg" variant="outline" className="gap-2 w-full sm:w-auto text-base h-12 px-8 border-primary text-primary hover:bg-blue-50">
                  <CheckCircle2 className="h-5 w-5" />
                  ตรวจสอบสถานะ
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Decorative paw prints */}
        <div className="absolute top-10 left-10 opacity-10 text-6xl select-none">🐾</div>
        <div className="absolute bottom-10 right-10 opacity-10 text-6xl select-none">🐾</div>
        <div className="absolute top-1/2 left-4 opacity-5 text-5xl select-none">🐾</div>
      </section>

      {/* Upcoming Events */}
      <section className="py-10 bg-white">
        <div className="container">
          <div className="text-center mb-6">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">งานที่กำลังจะมาถึง</h2>
            <p className="text-sm text-muted-foreground">กิจกรรมแจกอาหารที่กำหนดไว้ล่วงหน้า</p>
          </div>
          {upcoming.length === 0 ? (
            <div className="max-w-xl mx-auto text-center p-8 border border-dashed rounded-lg text-muted-foreground">
              <Calendar className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="font-medium">ยังไม่มีงานที่กำหนด</p>
              <p className="text-sm mt-1">โปรดติดตามข่าวสารการจัดกิจกรรมครั้งถัดไป</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
              {upcoming.map((e) => (
                <Card key={e.id} className="border-blue-100 hover:shadow-md transition-shadow">
                  <CardContent className="pt-5 pb-5 space-y-3">
                    <div className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 rounded-full px-2.5 py-1 text-xs font-medium">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatThaiDate(new Date(e.eventDate))}
                    </div>
                    <h3 className="font-bold text-gray-900 text-base leading-snug">{e.name}</h3>
                    {e.description && <p className="text-xs text-muted-foreground line-clamp-2">{e.description}</p>}
                    <div className="space-y-1.5 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4 flex-shrink-0" />
                        <span>{e.startTime} - {e.endTime} น.</span>
                      </div>
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 flex-shrink-0 mt-0.5" />
                        <span className="leading-tight">{e.location}{e.province ? ` · ${e.province}` : ""}</span>
                      </div>
                    </div>
                    {e.mapUrl && (
                      <a
                        href={e.mapUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium"
                      >
                        <ExternalLink className="h-3.5 w-3.5" /> เปิดใน Google Maps
                      </a>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
          {upcoming.length > 0 && (
            <div className="text-center mt-6">
              <Link href="/event" className="text-sm text-blue-600 hover:underline inline-flex items-center gap-1">
                ดูรายละเอียดกิจกรรมทั้งหมด <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">ระบบจัดการครบวงจร</h2>
            <p className="text-muted-foreground">ตั้งแต่ลงทะเบียนจนถึงรับอาหาร ทุกขั้นตอนใช้งานง่าย</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f) => (
              <Card key={f.title} className="hover:shadow-md transition-shadow border-0 shadow-sm">
                <CardContent className="pt-6">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 ${f.color}`}>
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-muted-foreground">{f.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-3">วิธีการรับอาหาร</h2>
            <p className="text-muted-foreground">ขั้นตอนง่ายๆ 4 ขั้นตอน</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {steps.map((s, i) => (
              <div key={s.step} className="text-center relative">
                <div className="w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4 shadow-md">
                  {s.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
                {i < steps.length - 1 && (
                  <ChevronRight className="hidden lg:block absolute top-5 -right-3 h-5 w-5 text-gray-300" />
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold mb-1">1,250+</div>
              <div className="text-blue-200 text-sm">ผู้ลงทะเบียน</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-1">8,520</div>
              <div className="text-blue-200 text-sm">สุนัขที่ได้รับการช่วยเหลือ</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-1">6,230</div>
              <div className="text-blue-200 text-sm">แมวที่ได้รับการช่วยเหลือ</div>
            </div>
            <div>
              <div className="text-4xl font-bold mb-1">5,000+</div>
              <div className="text-blue-200 text-sm">KG อาหารที่แจกจ่าย</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="container">
          <div className="max-w-2xl mx-auto text-center">
            <div className="text-5xl mb-4">🐾</div>
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              ร่วมช่วยเหลือน้องหมาและน้องแมว
            </h2>
            <p className="text-muted-foreground mb-8">
              ลงทะเบียนวันนี้เพื่อรับสิทธิ์รับอาหารสำหรับสัตว์เลี้ยงของคุณ
            </p>
            <Link href="/register">
              <Button size="lg" className="gap-2 text-base h-12 px-10">
                <Heart className="h-5 w-5" />
                ลงทะเบียนรับอาหารเดี๋ยวนี้
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
