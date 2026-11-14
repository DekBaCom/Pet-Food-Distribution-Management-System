"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import jsQR from "jsqr";
import { Camera, CameraOff, Search, AlertTriangle, CheckCircle2, XCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface ScanResult {
  id: string;
  registrationId: string;
  fullName: string;
  phone: string;
  province: string;
  receiverType: string;
  status: string;
  dogs: { total: number };
  cats: { total: number };
  alreadyCheckedIn?: boolean;
  checkinInfo?: { checkinTime: string; staff: { name: string } };
}

export default function CheckinPage() {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animRef = useRef<number | null>(null);

  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [manualId, setManualId] = useState("");
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkinDone, setCheckinDone] = useState(false);
  const [checkinLoading, setCheckinLoading] = useState(false);

  const stopCamera = useCallback(() => {
    if (animRef.current) cancelAnimationFrame(animRef.current);
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const processQR = useCallback(async (qrData: string) => {
    stopCamera();
    await lookupByQR(qrData);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopCamera]);

  const scanFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height);
    if (code?.data) {
      processQR(code.data);
    } else {
      animRef.current = requestAnimationFrame(scanFrame);
    }
  }, [processQR]);

  const startCamera = async () => {
    setResult(null);
    setError(null);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
      animRef.current = requestAnimationFrame(scanFrame);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "ไม่สามารถเข้าถึงกล้องได้";
      setCameraError(msg.includes("Permission") ? "กรุณาอนุญาตการเข้าถึงกล้อง" : "ไม่สามารถเปิดกล้องได้");
    }
  };

  useEffect(() => {
    return () => { stopCamera(); };
  }, [stopCamera]);

  const lookupByQR = async (qrData: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/qr/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrData }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "QR ไม่ถูกต้อง");
      setResult(json);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  const lookupById = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualId.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await fetch("/api/qr/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: manualId.trim() }),
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

  const handleCheckin = async () => {
    if (!result) return;
    setCheckinLoading(true);
    try {
      const res = await fetch("/api/checkins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId: result.registrationId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "ไม่สามารถ Check-in ได้");
      setCheckinDone(true);
      setTimeout(() => {
        router.push(`/staff/distribution?id=${result.registrationId}`);
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setCheckinLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setError(null);
    setCheckinDone(false);
    setManualId("");
  };

  return (
    <div className="py-4">
      <h1 className="text-xl font-bold mb-4">สแกน QR Code</h1>

      {!result && !checkinDone && (
        <>
          {/* Camera scanner */}
          <Card className="mb-4 overflow-hidden">
            <CardContent className="p-0">
              <div className="relative bg-black aspect-square max-h-72">
                <video
                  ref={videoRef}
                  className={`w-full h-full object-cover ${!scanning ? "hidden" : ""}`}
                  playsInline
                  muted
                />
                {!scanning && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-white">
                    <Camera className="h-12 w-12 opacity-60" />
                    <span className="text-sm opacity-60">กดปุ่มเพื่อเปิดกล้อง</span>
                  </div>
                )}
                {scanning && (
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-8 border-2 border-primary rounded-lg opacity-70">
                      <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-primary rounded-tl" />
                      <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-primary rounded-tr" />
                      <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-primary rounded-bl" />
                      <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-primary rounded-br" />
                    </div>
                  </div>
                )}
              </div>
              <canvas ref={canvasRef} className="hidden" />
            </CardContent>
          </Card>

          {cameraError && (
            <Alert variant="destructive" className="mb-3">
              <CameraOff className="h-4 w-4" />
              <AlertDescription>{cameraError}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2 mb-4">
            {!scanning ? (
              <Button onClick={startCamera} className="flex-1 gap-2 h-12 text-base">
                <Camera className="h-5 w-5" /> เปิดกล้องสแกน
              </Button>
            ) : (
              <Button onClick={stopCamera} variant="outline" className="flex-1 gap-2 h-12 text-base">
                <CameraOff className="h-5 w-5" /> ปิดกล้อง
              </Button>
            )}
          </div>

          {/* Divider */}
          <div className="flex items-center gap-2 mb-4 text-muted-foreground text-sm">
            <div className="flex-1 h-px bg-border" />
            <span>หรือกรอก ID เอง</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Manual ID */}
          <form onSubmit={lookupById} className="flex gap-2">
            <Input
              value={manualId}
              onChange={(e) => setManualId(e.target.value)}
              placeholder="กรอก Registration ID เช่น PF-2026-000001"
              className="flex-1 font-mono"
            />
            <Button type="submit" disabled={loading || !manualId.trim()} className="gap-1">
              <Search className="h-4 w-4" />
            </Button>
          </form>

          {loading && <p className="text-center text-muted-foreground mt-4 text-sm">กำลังค้นหาข้อมูล...</p>}

          {error && (
            <Alert variant="destructive" className="mt-3">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Result */}
      {result && !checkinDone && (
        <div className="space-y-4">
          {result.alreadyCheckedIn ? (
            /* Already checked in */
            <Card className="border-yellow-300 bg-yellow-50">
              <CardHeader>
                <CardTitle className="text-yellow-700 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> รับอาหารไปแล้ว
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <p className="font-medium">{result.fullName}</p>
                <p className="text-muted-foreground">{result.registrationId}</p>
                {result.checkinInfo && (
                  <div className="bg-white p-3 rounded border">
                    <p>เวลา: {new Date(result.checkinInfo.checkinTime).toLocaleString("th-TH")}</p>
                    <p>เจ้าหน้าที่: {result.checkinInfo.staff?.name}</p>
                  </div>
                )}
                <Button variant="outline" className="w-full mt-3" onClick={reset}>
                  กลับหน้าสแกน
                </Button>
              </CardContent>
            </Card>
          ) : (
            /* Eligible */
            <div>
              <Card className="border-green-300 bg-green-50 mb-3">
                <CardHeader className="pb-2">
                  <CardTitle className="text-green-700 flex items-center gap-2">
                    <CheckCircle2 className="h-5 w-5" /> ตรวจสอบสำเร็จ
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-muted-foreground">รหัส</div>
                      <div className="font-mono font-bold">{result.registrationId}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">ชื่อ</div>
                      <div className="font-bold">{result.fullName}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">ประเภท</div>
                      <div className="text-xs">{result.receiverType}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">จังหวัด</div>
                      <div>{result.province}</div>
                    </div>
                  </div>
                  <div className="flex gap-4 bg-white p-3 rounded border">
                    <div className="text-center flex-1">
                      <span className="text-2xl">🐶</span>
                      <div className="text-xl font-bold">{result.dogs?.total ?? 0}</div>
                      <div className="text-xs text-muted-foreground">สุนัข</div>
                    </div>
                    <div className="text-center flex-1">
                      <span className="text-2xl">🐱</span>
                      <div className="text-xl font-bold">{result.cats?.total ?? 0}</div>
                      <div className="text-xs text-muted-foreground">แมว</div>
                    </div>
                  </div>
                  <Badge variant="success" className="text-green-700 bg-green-100">ELIGIBLE - มีสิทธิ์รับอาหาร</Badge>
                </CardContent>
              </Card>

              <div className="flex gap-2">
                <Button variant="outline" onClick={reset} className="flex-1">
                  <XCircle className="h-4 w-4 mr-1" /> ยกเลิก
                </Button>
                <Button
                  onClick={handleCheckin}
                  disabled={checkinLoading}
                  className="flex-1 gap-1 bg-green-600 hover:bg-green-700"
                >
                  {checkinLoading ? "กำลัง Check-in..." : <><CheckCircle2 className="h-4 w-4" /> ยืนยัน Check-in</>}
                </Button>
              </div>
              {error && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </div>
      )}

      {/* Success after checkin */}
      {checkinDone && (
        <Card className="border-green-300 bg-green-50 text-center">
          <CardContent className="pt-8 pb-6">
            <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-green-700">Check-in สำเร็จ!</h2>
            <p className="text-muted-foreground text-sm mt-2 mb-4">กำลังไปหน้าแจกอาหาร...</p>
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
              <ArrowRight className="h-4 w-4 animate-bounce" />
              กำลังโหลด...
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
