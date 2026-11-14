import Link from "next/link";
import { PawPrint, Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t bg-gray-50 mt-auto">
      <div className="container py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                <PawPrint className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-bold text-primary">ระบบแจกอาหารหมาแมว</div>
                <div className="text-xs text-muted-foreground">Pet Food Distribution System</div>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              ระบบจัดการการแจกอาหารสุนัขและแมว สำหรับผู้ดูแลสัตว์ บ้านพักสัตว์ และกลุ่มช่วยเหลือสัตว์
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">ลิงก์ด่วน</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/register" className="hover:text-primary">ลงทะเบียนรับอาหาร</Link></li>
              <li><Link href="/status" className="hover:text-primary">ตรวจสอบสถานะ</Link></li>
              <li><Link href="/event" className="hover:text-primary">กำหนดการ</Link></li>
              <li><Link href="/faq" className="hover:text-primary">คำถามที่พบบ่อย</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-3 text-sm">สำหรับเจ้าหน้าที่</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/auth/login" className="hover:text-primary">เข้าสู่ระบบ</Link></li>
              <li><Link href="/staff/checkin" className="hover:text-primary">Scan QR</Link></li>
              <li><Link href="/admin" className="hover:text-primary">Admin Dashboard</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-8 border-t pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} ระบบแจกอาหารหมาแมว. สงวนลิขสิทธิ์</p>
          <p className="flex items-center gap-1">
            สร้างด้วย <Heart className="h-3 w-3 text-pink-500 fill-pink-500" /> เพื่อน้องหมาและน้องแมว
          </p>
        </div>
      </div>
    </footer>
  );
}
