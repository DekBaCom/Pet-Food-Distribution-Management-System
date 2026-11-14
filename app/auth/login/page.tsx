"use client";

import { Suspense } from "react";
import { useState } from "react";
import { signIn, getSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { PawPrint, LogIn, Eye, EyeOff, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  function destinationForRole(role: string | undefined): string {
    if (role === "SUPER_ADMIN" || role === "ADMIN") return "/admin";
    if (role === "VIEWER") return "/admin";
    return "/staff";
  }
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("กรุณากรอกอีเมลและรหัสผ่าน"); return; }
    setLoading(true);
    setError(null);
    try {
      const result = await signIn("credentials", {
        email: email.toLowerCase().trim(),
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else {
        const session = await getSession();
        const role = (session?.user as { role?: string } | undefined)?.role;
        router.push(callbackUrl || destinationForRole(role));
        router.refresh();
      }
    } catch {
      setError("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-pink-50 p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="text-center pb-2">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 bg-primary rounded-full flex items-center justify-center shadow">
              <PawPrint className="h-7 w-7 text-white" />
            </div>
          </div>
          <CardTitle>เข้าสู่ระบบเจ้าหน้าที่</CardTitle>
          <CardDescription>ระบบแจกอาหารหมาแมว</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div>
              <Label htmlFor="email">อีเมล</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="staff@petfood.th"
                className="mt-1"
                autoComplete="email"
                disabled={loading}
              />
            </div>
            <div>
              <Label htmlFor="password">รหัสผ่าน</Label>
              <div className="relative mt-1">
                <Input
                  id="password"
                  type={showPw ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                  autoComplete="current-password"
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full gap-2" disabled={loading}>
              {loading ? "กำลังเข้าสู่ระบบ..." : <><LogIn className="h-4 w-4" /> เข้าสู่ระบบ</>}
            </Button>
          </form>

          <div className="mt-6 p-3 bg-blue-50 rounded-lg text-xs text-muted-foreground">
            <p className="font-medium mb-1">บัญชีทดสอบ:</p>
            <p>admin@petfood.th / Admin123!</p>
            <p>checkin@petfood.th / Staff123!</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">กำลังโหลด...</div>}>
      <LoginContent />
    </Suspense>
  );
}
