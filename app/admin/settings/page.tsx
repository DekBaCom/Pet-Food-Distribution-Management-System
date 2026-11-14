import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Calendar, MapPin } from "lucide-react";

export default function AdminSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">ตั้งค่าระบบ</h1>
        <p className="text-muted-foreground text-sm">ตั้งค่าข้อมูลงาน สถานที่ และระบบ</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <Calendar className="h-4 w-4" /> ข้อมูลงาน
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">ชื่องาน</span>
                <span>กิจกรรมแจกอาหารสัตว์ 2026</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">วันที่</span>
                <span>22 พฤศจิกายน 2026</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">เวลา</span>
                <span>09:00 - 16:00</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm flex items-center gap-2">
              <MapPin className="h-4 w-4" /> สถานที่
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">สถานที่</span>
                <span>ศูนย์ชุมชนกลาง กรุงเทพฯ</span>
              </div>
              <div className="flex justify-between py-2 border-b">
                <span className="text-muted-foreground">จังหวัด</span>
                <span>กรุงเทพมหานคร</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Settings className="h-4 w-4" /> ข้อมูลเวอร์ชัน
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-1">
          <p>ระบบแจกอาหารหมาแมว v0.1.0</p>
          <p>Pet Food Distribution Management System</p>
          <p>สร้างด้วย Next.js 14, Prisma, SQLite</p>
        </CardContent>
      </Card>
    </div>
  );
}
