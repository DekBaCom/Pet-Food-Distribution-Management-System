"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Package, CheckCircle2, AlertCircle, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FOOD_TYPES_CONFIG } from "@/types";
import { formatDateTime } from "@/lib/utils";

interface RegistrationInfo {
  id: string;
  registrationId: string;
  fullName: string;
  receiverType: string;
  dogs: { total: number };
  cats: { total: number };
  foodRequests: { foodType: string; requestedQty: number; unit: string }[];
  status: string;
}

interface FoodEntry { foodType: string; quantity: number; unit: string }

export default function DistributionPage() {
  const searchParams = useSearchParams();
  const urlId = searchParams.get("id") || "";

  const [searchId, setSearchId] = useState(urlId);
  const [registration, setRegistration] = useState<RegistrationInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [distributedAt, setDistributedAt] = useState<string | null>(null);

  useEffect(() => {
    if (urlId) fetchRegistration(urlId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlId]);

  const fetchRegistration = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/registrations/by-id/${encodeURIComponent(id)}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "ไม่พบข้อมูล");
      setRegistration(json);
      setFoodEntries(
        FOOD_TYPES_CONFIG.map((cfg) => {
          const requested = json.foodRequests?.find((f: { foodType: string }) => f.foodType === cfg.type);
          return { foodType: cfg.type, quantity: requested?.requestedQty || 0, unit: cfg.unit };
        })
      );
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) fetchRegistration(searchId.trim());
  };

  const updateQty = (index: number, qty: number) => {
    setFoodEntries((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], quantity: Math.max(0, qty) };
      return updated;
    });
  };

  const handleDistribute = async () => {
    if (!registration) return;
    const toDistribute = foodEntries.filter((f) => f.quantity > 0);
    if (toDistribute.length === 0) { setError("กรุณากรอกจำนวนอาหารอย่างน้อย 1 รายการ"); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/distributions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          registrationId: registration.registrationId,
          foodItems: toDistribute,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "ไม่สามารถบันทึกได้");
      setSuccess(true);
      setDistributedAt(json.distributedAt);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const totalKg = foodEntries.filter((f) => f.unit === "KG").reduce((sum, f) => sum + f.quantity, 0);
  const totalBag = foodEntries.filter((f) => f.unit === "ซอง").reduce((sum, f) => sum + f.quantity, 0);

  if (success) {
    return (
      <div className="py-4">
        <Card className="border-green-300 bg-green-50 text-center">
          <CardContent className="pt-8 pb-6 space-y-4">
            <div className="text-5xl">🎉</div>
            <h2 className="text-xl font-bold text-green-700">รับอาหารสำเร็จ!</h2>
            <p className="text-muted-foreground text-sm">ขอบคุณที่ช่วยดูแลน้องหมาและน้องแมว</p>
            <div className="bg-white rounded-lg p-4 text-sm space-y-2 text-left">
              <div className="flex justify-between">
                <span className="text-muted-foreground">รหัส</span>
                <span className="font-mono font-bold">{registration?.registrationId}</span>
              </div>
              {distributedAt && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">เวลา</span>
                  <span>{formatDateTime(distributedAt)}</span>
                </div>
              )}
              <div className="border-t pt-2 font-medium">
                อาหารที่แจก:
              </div>
              {foodEntries.filter((f) => f.quantity > 0).map((f) => (
                <div key={f.foodType} className="flex justify-between text-sm">
                  <span>{f.foodType}</span>
                  <span className="font-medium">{f.quantity} {f.unit}</span>
                </div>
              ))}
            </div>
            <Button
              onClick={() => { setSuccess(false); setRegistration(null); setSearchId(""); }}
              className="w-full"
            >
              สแกนรายการถัดไป
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="py-4 space-y-4">
      <h1 className="text-xl font-bold">แจกอาหาร</h1>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <Input
          value={searchId}
          onChange={(e) => setSearchId(e.target.value)}
          placeholder="Registration ID หรือเบอร์โทร"
          className="flex-1 font-mono"
        />
        <Button type="submit" disabled={loading}>
          <Search className="h-4 w-4" />
        </Button>
      </form>

      {loading && <p className="text-center text-muted-foreground text-sm">กำลังโหลด...</p>}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {registration && !loading && (
        <>
          {/* Registration info */}
          <Card className="border-blue-100 bg-blue-50">
            <CardContent className="pt-4 pb-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">ชื่อ</div>
                  <div className="font-bold">{registration.fullName}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">รหัส</div>
                  <div className="font-mono text-xs">{registration.registrationId}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">สุนัข / แมว</div>
                  <div className="font-medium">{registration.dogs?.total ?? 0} / {registration.cats?.total ?? 0} ตัว</div>
                </div>
                <div>
                  <div className="text-muted-foreground">ประเภท</div>
                  <div className="text-xs">{registration.receiverType}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Food input */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-green-600" />
                กรอกจำนวนอาหารที่แจก
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {foodEntries.map((f, i) => {
                const cfg = FOOD_TYPES_CONFIG.find((c) => c.type === f.foodType);
                return (
                  <div key={f.foodType} className="flex items-center gap-3">
                    <span className="text-xl w-8">{cfg?.icon}</span>
                    <div className="flex-1">
                      <div className="text-sm font-medium">{f.foodType}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        min={0}
                        value={f.quantity || ""}
                        onChange={(e) => updateQty(i, parseFloat(e.target.value) || 0)}
                        className="w-20 text-center"
                        placeholder="0"
                      />
                      <span className="text-sm text-muted-foreground w-8">{f.unit}</span>
                    </div>
                  </div>
                );
              })}

              {/* Total */}
              <div className="border-t pt-3 bg-gray-50 rounded-lg p-3">
                <div className="text-sm font-medium text-center text-muted-foreground mb-1">รวมอาหารที่แจก</div>
                <div className="text-center font-bold">
                  {totalKg > 0 && <span className="mr-2">{totalKg} KG</span>}
                  {totalBag > 0 && <span>{totalBag} ซอง</span>}
                  {totalKg === 0 && totalBag === 0 && <span className="text-muted-foreground">-</span>}
                </div>
              </div>

              <Button
                onClick={handleDistribute}
                disabled={submitting}
                className="w-full h-12 text-base gap-2 bg-green-600 hover:bg-green-700"
              >
                {submitting ? "กำลังบันทึก..." : <><CheckCircle2 className="h-5 w-5" /> ยืนยันการรับอาหาร</>}
              </Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
