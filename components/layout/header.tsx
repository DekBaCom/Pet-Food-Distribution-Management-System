"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { Menu, X, PawPrint, LogIn, LogOut, User, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "หน้าหลัก" },
  { href: "/register", label: "ลงทะเบียน" },
  { href: "/status", label: "ตรวจสอบสถานะ" },
  { href: "/event", label: "กำหนดการ" },
  { href: "/faq", label: "คำถามที่พบบ่อย" },
];

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-sm">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-primary">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-white">
            <PawPrint className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <div className="text-sm font-bold text-primary leading-tight">ระบบแจกอาหารหมาแมว</div>
            <div className="text-xs text-muted-foreground leading-tight">Pet Food Distribution</div>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-blue-50 hover:text-primary",
                pathname === link.href ? "bg-blue-50 text-primary" : "text-gray-600"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {session ? (
            <div className="hidden lg:flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{session.user?.name}</span>
              {(session.user as { role?: string })?.role &&
                ["SUPER_ADMIN", "ADMIN"].includes((session.user as { role?: string }).role!) && (
                  <Link href="/admin">
                    <Button variant="outline" size="sm" className="gap-1">
                      <LayoutDashboard className="h-4 w-4" />
                      Admin
                    </Button>
                  </Link>
                )}
              <Link href="/staff">
                <Button variant="outline" size="sm" className="gap-1">
                  <User className="h-4 w-4" />
                  เจ้าหน้าที่
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="gap-1 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
                ออกจากระบบ
              </Button>
            </div>
          ) : (
            <Link href="/auth/login" className="hidden lg:block">
              <Button variant="outline" size="sm" className="gap-1 border-primary text-primary hover:bg-blue-50">
                <LogIn className="h-4 w-4" />
                สำหรับเจ้าหน้าที่
              </Button>
            </Link>
          )}

          {/* Mobile menu button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="เมนู"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="lg:hidden border-t bg-white px-4 py-3 space-y-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              className={cn(
                "block px-3 py-2 rounded-md text-sm font-medium",
                pathname === link.href ? "bg-blue-50 text-primary" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-2 border-t">
            {session ? (
              <>
                <Link href="/staff" onClick={() => setMobileOpen(false)}>
                  <Button variant="outline" className="w-full mb-2 gap-1">
                    <User className="h-4 w-4" />
                    หน้าเจ้าหน้าที่
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className="w-full text-red-600"
                  onClick={() => { setMobileOpen(false); signOut({ callbackUrl: "/" }); }}
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  ออกจากระบบ
                </Button>
              </>
            ) : (
              <Link href="/auth/login" onClick={() => setMobileOpen(false)}>
                <Button className="w-full gap-1">
                  <LogIn className="h-4 w-4" />
                  สำหรับเจ้าหน้าที่
                </Button>
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
