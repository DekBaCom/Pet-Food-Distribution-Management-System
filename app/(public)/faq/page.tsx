import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HelpCircle } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

const faqs = [
  {
    q: "ใครมีสิทธิ์ลงทะเบียนได้บ้าง?",
    a: "ผู้เลี้ยงสัตว์ส่วนตัว บ้านพักสัตว์ กลุ่มช่วยเหลือสัตว์ มูลนิธิ/องค์กร และผู้ดูแลสัตว์จร ทุกคนที่ดูแลสุนัขหรือแมวสามารถลงทะเบียนได้",
  },
  {
    q: "ลงทะเบียน 1 ครั้งรับอาหารได้กี่ครั้ง?",
    a: "1 การลงทะเบียนสามารถรับอาหารได้ 1 ครั้งเท่านั้น ระบบจะป้องกันการรับซ้ำโดยอัตโนมัติ",
  },
  {
    q: "QR Code ใช้งานได้นานแค่ไหน?",
    a: "QR Code ใช้ได้เฉพาะในวันงานที่กำหนด หลังจากรับอาหารแล้ว QR Code จะหมดอายุโดยอัตโนมัติ",
  },
  {
    q: "ถ้าลืมนำ QR Code มาจะทำอย่างไร?",
    a: "สามารถแจ้งเบอร์โทรศัพท์ที่ลงทะเบียนไว้กับเจ้าหน้าที่ เพื่อค้นหาข้อมูลในระบบได้",
  },
  {
    q: "อาหารที่ได้รับจะเป็นยี่ห้ออะไร?",
    a: "อาหารสัตว์คุณภาพที่ได้รับบริจาคมา ไม่สามารถระบุยี่ห้อล่วงหน้าได้ ขึ้นอยู่กับ Stock ที่มีในวันงาน",
  },
  {
    q: "สามารถรับอาหารแทนกันได้หรือไม่?",
    a: "สามารถรับแทนได้ โดยต้องนำ QR Code ของผู้ลงทะเบียนมาด้วย และต้องแสดงเอกสารมอบอำนาจ",
  },
  {
    q: "จำนวนอาหารที่ได้รับจะเท่ากับที่ขอไว้หรือไม่?",
    a: "ขึ้นอยู่กับ Stock ที่เหลืออยู่ในวันงาน ระบบจะแสดง Stock ปัจจุบัน เจ้าหน้าที่จะจัดให้ตามความเหมาะสม",
  },
  {
    q: "ลงทะเบียนแล้วจะได้รับอาหารแน่นอนหรือไม่?",
    a: "การลงทะเบียนไม่ได้รับประกัน 100% เนื่องจากจำนวนอาหารมีจำกัด ระบบจะแสดงสถานะล่าสุดได้ตลอดเวลา",
  },
];

export default function FAQPage() {
  return (
    <div className="container py-12 max-w-3xl mx-auto">
      <div className="text-center mb-10">
        <HelpCircle className="h-12 w-12 text-primary mx-auto mb-3" />
        <h1 className="text-3xl font-bold mb-2">คำถามที่พบบ่อย</h1>
        <p className="text-muted-foreground">ตอบคำถามที่ถามมาบ่อยที่สุดเกี่ยวกับกิจกรรมแจกอาหาร</p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, i) => (
          <Card key={i} className="hover:shadow-sm transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-start gap-2">
                <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs flex-shrink-0 mt-0.5">
                  {i + 1}
                </span>
                {faq.q}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground pl-8">{faq.a}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-10 text-center p-6 bg-blue-50 rounded-xl">
        <p className="text-sm text-muted-foreground mb-4">
          ยังมีคำถามอื่นๆ? ติดต่อเจ้าหน้าที่ของเราได้เลย
        </p>
        <Link href="/register">
          <Button>ลงทะเบียนรับอาหาร</Button>
        </Link>
      </div>
    </div>
  );
}
