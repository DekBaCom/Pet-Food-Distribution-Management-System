"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton({ className }: { className?: string }) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
      className={
        className ??
        "inline-flex items-center gap-1 rounded-md px-2.5 py-1.5 text-sm font-medium bg-white/10 hover:bg-white/20 transition-colors"
      }
    >
      <LogOut className="h-4 w-4" />
      ออกจากระบบ
    </button>
  );
}
