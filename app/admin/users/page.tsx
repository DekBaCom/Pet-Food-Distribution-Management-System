"use client";

import { useState, useEffect } from "react";
import { Plus, ToggleLeft, ToggleRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { ROLE_CONFIG, type UserRole } from "@/types";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  staffCode: string | null;
  isActive: boolean;
  createdAt: string;
}

const ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "REGISTRATION_STAFF", "CHECKIN_STAFF", "WAREHOUSE", "SUPERVISOR", "VIEWER"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "VIEWER" as UserRole, staffCode: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      setUsers(json.users || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleCreate = async () => {
    if (!form.name || !form.email || !form.password) { setError("กรุณากรอกข้อมูลให้ครบ"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "เกิดข้อผิดพลาด");
      setAddOpen(false);
      setForm({ name: "", email: "", password: "", role: "VIEWER", staffCode: "" });
      fetchUsers();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    fetchUsers();
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">จัดการผู้ใช้งาน</h1>
          <p className="text-muted-foreground text-sm">เพิ่ม แก้ไข และจัดการบัญชีเจ้าหน้าที่</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" /> เพิ่มผู้ใช้
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ชื่อ</TableHead>
                <TableHead>อีเมล</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>รหัสเจ้าหน้าที่</TableHead>
                <TableHead>สถานะ</TableHead>
                <TableHead>จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const roleCfg = ROLE_CONFIG[u.role as UserRole];
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{u.email}</TableCell>
                    <TableCell>
                      <span className={`text-xs font-medium ${roleCfg?.color || "text-gray-600"}`}>
                        {roleCfg?.label || u.role}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{u.staffCode || "-"}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${u.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                        {u.isActive ? "ใช้งาน" : "ปิดใช้งาน"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(u.id, u.isActive)}
                        className={u.isActive ? "text-red-500 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                      >
                        {u.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add user dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>เพิ่มผู้ใช้งานใหม่</DialogTitle></DialogHeader>
          <div className="space-y-3">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div>
              <Label>ชื่อ-นามสกุล</Label>
              <Input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>อีเมล</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>รหัสผ่าน</Label>
              <Input type="password" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} className="mt-1" />
            </div>
            <div>
              <Label>Role</Label>
              <Select value={form.role} onValueChange={(v) => setForm((f) => ({ ...f, role: v as UserRole }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_CONFIG[r].label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>รหัสเจ้าหน้าที่ (optional)</Label>
              <Input value={form.staffCode} onChange={(e) => setForm((f) => ({ ...f, staffCode: e.target.value }))} className="mt-1" placeholder="เช่น STAFF-001" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleCreate} disabled={saving}>{saving ? "กำลังบันทึก..." : "สร้างบัญชี"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
