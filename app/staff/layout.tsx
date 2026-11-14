import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { PawPrint, ScanLine, Package, LayoutDashboard } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const role = (session.user as { role?: string })?.role || "";
  const allowedRoles = ["SUPER_ADMIN", "ADMIN", "REGISTRATION_STAFF", "CHECKIN_STAFF", "WAREHOUSE", "SUPERVISOR"];
  if (!allowedRoles.includes(role)) redirect("/auth/login");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Staff header */}
      <header className="bg-primary text-white px-4 py-3 flex items-center justify-between shadow">
        <div className="flex items-center gap-2">
          <PawPrint className="h-5 w-5" />
          <span className="font-semibold">Staff Portal</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="opacity-80 hidden sm:inline">{session.user?.name}</span>
          <LogoutButton />
        </div>
      </header>

      {/* Nav tabs */}
      <div className="bg-white border-b px-4 flex gap-1 overflow-x-auto">
        <Link href="/staff" className="flex items-center gap-1.5 px-3 py-3 text-sm font-medium text-gray-600 hover:text-primary border-b-2 border-transparent hover:border-primary whitespace-nowrap transition-colors">
          <LayoutDashboard className="h-4 w-4" /> ภาพรวม
        </Link>
        <Link href="/staff/checkin" className="flex items-center gap-1.5 px-3 py-3 text-sm font-medium text-gray-600 hover:text-primary border-b-2 border-transparent hover:border-primary whitespace-nowrap transition-colors">
          <ScanLine className="h-4 w-4" /> Scan QR
        </Link>
        <Link href="/staff/distribution" className="flex items-center gap-1.5 px-3 py-3 text-sm font-medium text-gray-600 hover:text-primary border-b-2 border-transparent hover:border-primary whitespace-nowrap transition-colors">
          <Package className="h-4 w-4" /> แจกอาหาร
        </Link>
      </div>

      <main className="p-4 max-w-2xl mx-auto">{children}</main>
    </div>
  );
}
