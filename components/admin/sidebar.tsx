"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Users, ClipboardList, Package, BarChart3,
  ScanLine, Settings, PawPrint
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/admin/registrations", label: "ผู้ลงทะเบียน", icon: ClipboardList },
  { href: "/admin/checkins", label: "Check-in", icon: ScanLine },
  { href: "/admin/inventory", label: "คลังอาหาร", icon: Package },
  { href: "/admin/reports", label: "รายงาน", icon: BarChart3 },
  { href: "/admin/users", label: "ผู้ใช้งาน", icon: Users },
  { href: "/admin/settings", label: "ตั้งค่า", icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-56 bg-gray-900 text-white min-h-screen">
      {/* Logo */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <PawPrint className="h-4 w-4 text-white" />
          </div>
          <div className="text-sm font-bold leading-tight">
            <div>Admin Panel</div>
            <div className="text-gray-400 text-xs font-normal">Pet Food Dist.</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <item.icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-gray-700">
        <Link href="/" className="flex items-center gap-2 text-xs text-gray-400 hover:text-white px-3 py-2">
          ← กลับหน้าหลัก
        </Link>
      </div>
    </aside>
  );
}
