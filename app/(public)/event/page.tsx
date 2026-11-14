import { Calendar, Clock, MapPin, Package, Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EventPage() {
  return (
    <div className="container py-12 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">กำหนดการ</h1>
      <p className="text-muted-foreground mb-8">รายละเอียดกิจกรรมแจกอาหารสุนัขและแมว</p>

      <div className="grid gap-6">
        <Card className="border-blue-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-500" />
              รายละเอียดกิจกรรม
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">วันที่จัดงาน</div>
                <div className="text-muted-foreground">วันเสาร์ที่ 22 พฤศจิกายน 2569 (2026)</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">เวลา</div>
                <div className="text-muted-foreground">09:00 น. - 16:00 น.</div>
                <div className="text-sm text-muted-foreground">หมดเขตรับอาหาร 15:30 น.</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <div className="font-medium">สถานที่</div>
                <div className="text-muted-foreground">ศูนย์ชุมชนกลาง กรุงเทพมหานคร</div>
                <div className="text-sm text-muted-foreground">ถนนพระราม 4 เขตปทุมวัน กรุงเทพฯ 10330</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-green-100">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-green-500" />
              อาหารที่เตรียมไว้
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { label: "🐶 อาหารสุนัข", qty: "2,000 KG" },
                { label: "🐱 อาหารแมว", qty: "1,500 KG" },
                { label: "🐶 อาหารลูกสุนัข", qty: "500 KG" },
                { label: "🐱 อาหารลูกแมว", qty: "500 KG" },
                { label: "🥫 อาหารเปียก", qty: "2,000 ซอง" },
              ].map((item) => (
                <div key={item.label} className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                  <span className="font-medium">{item.label}</span>
                  <span className="text-green-700 font-bold">{item.qty}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

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
            <Button size="lg" className="gap-2">
              ลงทะเบียนรับอาหาร
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
