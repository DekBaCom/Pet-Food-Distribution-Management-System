import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";
import { PawPrint } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const role = (session.user as { role?: string })?.role || "";
  if (!["SUPER_ADMIN", "ADMIN", "WAREHOUSE", "VIEWER"].includes(role)) {
    redirect("/staff");
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <AdminSidebar />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile header */}
        <header className="lg:hidden bg-gray-900 text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PawPrint className="h-5 w-5" />
            <span className="font-semibold text-sm">Admin Panel</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-400 hidden sm:inline">{session.user?.name}</span>
            <LogoutButton />
          </div>
        </header>

        {/* Mobile nav (horizontal scroll) */}
        <div className="lg:hidden bg-gray-800 px-2 overflow-x-auto flex gap-1">
          {[
            { href: "/admin", label: "หน้าหลัก" },
            { href: "/admin/registrations", label: "ลงทะเบียน" },
            { href: "/admin/checkins", label: "Check-in" },
            { href: "/admin/inventory", label: "คลัง" },
            { href: "/admin/reports", label: "รายงาน" },
            { href: "/admin/users", label: "ผู้ใช้" },
          ].map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-gray-300 hover:text-white text-xs whitespace-nowrap px-3 py-2.5"
            >
              {item.label}
            </a>
          ))}
        </div>

        <main className="flex-1 p-6 overflow-auto">
          <div className="max-w-6xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
