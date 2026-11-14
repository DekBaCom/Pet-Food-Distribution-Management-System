"use client";

import { Suspense } from "react";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, CheckCircle2, Clock, XCircle, Package, AlertCircle, QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { STATUS_CONFIG } from "@/types";
import { formatDateTime } from "@/lib/utils";

interface StatusResult {
  registrationId: string;
  fullName: string;
  phone: string;
  province: string;
  receiverType: string;
  status: string;
  createdAt: string;
  dogs: { total: number };
  cats: { total: number };
  checkin?: { checkinTime: string; staff: { name: string } };
  distributions?: { foodType: string; quantity: number; unit: string; distributedAt: string }[];
}

const STATUS_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  REGISTERED: Clock,
  VERIFIED: CheckCircle2,
  APPROVED: CheckCircle2,
  CHECKED_IN: Package,
  RECEIVED: CheckCircle2,
  CANCELLED: XCircle,
  REJECTED: XCircle,
};

function StatusContent() {
  const searchParams = useSearchParams();
  const [regId, setRegId] = useState(searchParams.get("id") || "");
  const [phone, setPhone] = useState("");
  const [result, setResult] = useState<StatusResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    const id = searchParams.get("id");
    if (id) { setRegId(id); }
  }, [searchParams]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!regId.trim() && !phone.trim()) {
      setError("กรุณากรอกรหัสการลงทะเบียนหรือเบอร์โทรศัพท์");
      return;
    }
    setLoading(true);
    setError(null);
    setResult(null);
    setSearched(true);
    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: regId.trim(), phone: phone.trim() }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "ไม่พบข้อมูล");
      setResult(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-12 max-w-2xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ตรวจสอบสถานะ</h1>
        <p className="text-muted-foreground">ตรวจสอบสถานะการลงทะเบียนและการรับอาหาร</p>
      </div>

      {/* Search Form */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <Label htmlFor="regId">รหัสการลงทะเบียน</Label>
              <Input
                id="regId"
                value={regId}
                onChange={(e) => setRegId(e.target.value)}
                placeholder="เช่น PF-2026-000001"
                className="mt-1 font-mono"
              />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <div className="flex-1 h-px bg-border" />
              <span>หรือ</span>
              <div className="flex-1 h-px bg-border" />
            </div>
            <div>
              <Label htmlFor="phone">เบอร์โทรศัพท์ที่ลงทะเบียน</Label>
              <Input
                id="phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="เช่น 089-123-4567"
                className="mt-1"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full gap-2">
              {loading ? "กำลังค้นหา..." : <><Search className="h-4 w-4" /> ตรวจสอบสถานะ</>}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loading */}
      {loading && (
        <div className="space-y-3">
          <Skeleton className="h-32 w-full rounded-xl" />
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Result */}
      {result && !loading && (
        <div className="space-y-4">
          {/* Main card */}
          <Card className="border-blue-200">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{result.registrationId}</CardTitle>
                {(() => {
                  const cfg = STATUS_CONFIG[result.status];
                  const Icon = STATUS_ICONS[result.status] || CheckCircle2;
                  return cfg ? (
                    <span className={`status-badge ${cfg.color} ${cfg.bg} ${cfg.border} flex items-center gap-1`}>
                      <Icon className="h-3 w-3" />
                      {cfg.label}
                    </span>
                  ) : null;
                })()}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-muted-foreground">ชื่อ</div>
                  <div className="font-medium">{result.fullName}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">จังหวัด</div>
                  <div className="font-medium">{result.province}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">ประเภท</div>
                  <div className="font-medium text-xs">{result.receiverType}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">ลงทะเบียน</div>
                  <div className="font-medium text-xs">{formatDateTime(result.createdAt)}</div>
                </div>
              </div>
              <div className="border-t pt-3 grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-xl">🐶</span>
                  <div>
                    <div className="text-muted-foreground">สุนัข</div>
                    <div className="font-bold">{result.dogs?.total ?? 0} ตัว</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🐱</span>
                  <div>
                    <div className="text-muted-foreground">แมว</div>
                    <div className="font-bold">{result.cats?.total ?? 0} ตัว</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground">ประวัติสถานะ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  <div className="text-sm">
                    <span className="font-medium">ลงทะเบียนแล้ว</span>
                    <span className="text-muted-foreground ml-2 text-xs">{formatDateTime(result.createdAt)}</span>
                  </div>
                </div>
                {result.checkin && (
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <div className="text-sm">
                      <span className="font-medium">Check-in แล้ว</span>
                      <span className="text-muted-foreground ml-2 text-xs">
                        {formatDateTime(result.checkin.checkinTime)} โดย {result.checkin.staff?.name}
                      </span>
                    </div>
                  </div>
                )}
                {result.distributions && result.distributions.length > 0 && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 mt-1.5" />
                    <div className="text-sm flex-1">
                      <span className="font-medium">รับอาหารแล้ว</span>
                      <div className="mt-1 space-y-1">
                        {result.distributions.map((d, i) => (
                          <div key={i} className="text-muted-foreground text-xs">
                            {d.foodType}: {d.quantity} {d.unit}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Empty state after search */}
      {searched && !loading && !error && !result && (
        <div className="text-center py-8 text-muted-foreground">
          <QrCode className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>ไม่พบข้อมูลการลงทะเบียน</p>
          <p className="text-sm mt-1">กรุณาตรวจสอบรหัสหรือเบอร์โทรศัพท์อีกครั้ง</p>
        </div>
      )}
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense fallback={<div className="container py-12 max-w-2xl mx-auto">กำลังโหลด...</div>}>
      <StatusContent />
    </Suspense>
  );
}
