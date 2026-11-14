"use client";

import { Suspense } from "react";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Download, Printer, Share2, QrCode, ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { STATUS_CONFIG } from "@/types";
import { formatDate } from "@/lib/utils";

interface RegistrationData {
  id: string;
  registrationId: string;
  fullName: string;
  phone: string;
  province: string;
  receiverType: string;
  status: string;
  createdAt: string;
  dogs: { total: number };
  cats: { total: number };
  qrCodeDataUrl?: string;
}

function RegisterSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const registrationId = searchParams.get("id");

  const [data, setData] = useState<RegistrationData | null>(null);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!registrationId) {
      router.replace("/register");
      return;
    }
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registrationId]);

  const fetchData = async () => {
    try {
      const res = await fetch(`/api/registrations/by-id/${registrationId}`);
      if (!res.ok) throw new Error("ไม่พบข้อมูลการลงทะเบียน");
      const json = await res.json();
      setData(json);

      // Fetch QR
      const qrRes = await fetch(`/api/registrations/${json.id}/qr`);
      if (qrRes.ok) {
        const qrJson = await qrRes.json();
        setQrUrl(qrJson.qrDataUrl);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!qrUrl || !data) return;
    const link = document.createElement("a");
    link.download = `QR-${data.registrationId}.png`;
    link.href = qrUrl;
    link.click();
  };

  const handlePrint = () => window.print();

  const handleShare = async () => {
    if (!data) return;
    const text = `ลงทะเบียนแจกอาหารสัตว์สำเร็จ\nรหัส: ${data.registrationId}\nชื่อ: ${data.fullName}`;
    if (navigator.share) {
      await navigator.share({ title: "QR Code รับอาหารสัตว์", text });
    } else {
      await navigator.clipboard.writeText(text);
      alert("คัดลอกข้อมูลแล้ว");
    }
  };

  if (loading) {
    return (
      <div className="container py-12 max-w-md mx-auto">
        <div className="text-center mb-6">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
          <p className="mt-3 text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="container py-12 max-w-md mx-auto">
        <Alert variant="destructive">
          <AlertDescription>{error || "ไม่พบข้อมูล"}</AlertDescription>
        </Alert>
        <div className="mt-4 text-center">
          <Link href="/register"><Button>ลงทะเบียนใหม่</Button></Link>
        </div>
      </div>
    );
  }

  const statusCfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.REGISTERED;

  return (
    <div className="container py-8 max-w-md mx-auto">
      {/* Success banner */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
          <CheckCircle2 className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-bold text-green-700">ลงทะเบียนสำเร็จ!</h1>
        <p className="text-muted-foreground text-sm mt-1">
          บันทึกหรือ Screenshot QR Code นี้ไว้ใช้ในวันงาน
        </p>
      </div>

      {/* QR Card */}
      <Card className="border-blue-200 shadow-md mb-4" id="qr-card">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            {/* Registration ID */}
            <div>
              <div className="text-xs text-muted-foreground">รหัสการลงทะเบียน</div>
              <div className="text-2xl font-bold font-mono text-primary tracking-wider">{data.registrationId}</div>
            </div>

            {/* QR Code */}
            <div className="flex justify-center">
              {qrUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrUrl} alt="QR Code" className="w-56 h-56 border rounded-lg p-2" />
              ) : (
                <div className="w-56 h-56 border rounded-lg flex items-center justify-center bg-gray-50">
                  <QrCode className="h-16 w-16 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Summary */}
            <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">ชื่อ</span>
                <span className="font-medium">{data.fullName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">สุนัข</span>
                <span className="font-medium">{data.dogs?.total ?? 0} ตัว</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">แมว</span>
                <span className="font-medium">{data.cats?.total ?? 0} ตัว</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">ประเภท</span>
                <span className="font-medium text-xs">{data.receiverType}</span>
              </div>
            </div>

            {/* Status */}
            <div className="flex justify-center">
              <span className={`status-badge ${statusCfg.color} ${statusCfg.bg} ${statusCfg.border}`}>
                {statusCfg.label}
              </span>
            </div>

            <div className="text-xs text-muted-foreground">
              ลงทะเบียนเมื่อ {formatDate(data.createdAt)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Action buttons */}
      <div className="grid grid-cols-3 gap-2 mb-4">
        <Button variant="outline" onClick={handleDownload} disabled={!qrUrl} className="gap-1 text-xs">
          <Download className="h-4 w-4" /> ดาวน์โหลด
        </Button>
        <Button variant="outline" onClick={handlePrint} className="gap-1 text-xs">
          <Printer className="h-4 w-4" /> พิมพ์
        </Button>
        <Button variant="outline" onClick={handleShare} className="gap-1 text-xs">
          <Share2 className="h-4 w-4" /> แชร์
        </Button>
      </div>

      {/* Nav links */}
      <div className="flex flex-col gap-2">
        <Link href={`/status?id=${data.registrationId}`}>
          <Button variant="outline" className="w-full gap-2">
            <CheckCircle2 className="h-4 w-4" /> ตรวจสอบสถานะ
          </Button>
        </Link>
        <Link href="/">
          <Button variant="ghost" className="w-full gap-2 text-muted-foreground">
            <ArrowLeft className="h-4 w-4" /> กลับหน้าหลัก
          </Button>
        </Link>
      </div>
    </div>
  );
}

export default function RegisterSuccessPage() {
  return (
    <Suspense fallback={<div className="container py-12 max-w-md mx-auto text-center">กำลังโหลด...</div>}>
      <RegisterSuccessContent />
    </Suspense>
  );
}
