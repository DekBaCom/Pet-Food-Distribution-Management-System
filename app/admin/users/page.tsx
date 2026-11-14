"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Plus, ToggleLeft, ToggleRight, Pencil, Trash2 } from "lucide-react";
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

type EditForm = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  staffCode: string;
  password: string;
  isActive: boolean;
};

const ROLES: UserRole[] = ["SUPER_ADMIN", "ADMIN", "REGISTRATION_STAFF", "CHECKIN_STAFF", "WAREHOUSE", "SUPERVISOR", "VIEWER"];

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const myId = (session?.user as { id?: string } | undefined)?.id;

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "VIEWER" as UserRole, staffCode: "" });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [editUser, setEditUser] = useState<EditForm | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [editSaving, setEditSaving] = useState(false);

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
    const res = await fetch(`/api/admin/users/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      alert(json.error || "ไม่สามารถเปลี่ยนสถานะได้");
    }
    fetchUsers();
  };

  const openEdit = (u: User) => {
    setEditUser({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role as UserRole,
      staffCode: u.staffCode ?? "",
      password: "",
      isActive: u.isActive,
    });
    setEditError(null);
  };

  const handleEditSave = async () => {
    if (!editUser) return;
    if (!editUser.name) { setEditError("กรุณากรอกชื่อ"); return; }
    setEditSaving(true);
    setEditError(null);
    try {
      const payload: Record<string, unknown> = {
        name: editUser.name,
        role: editUser.role,
        staffCode: editUser.staffCode || null,
        isActive: editUser.isActive,
      };
      if (editUser.password) payload.password = editUser.password;
      const res = await fetch(`/api/admin/users/${editUser.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "แก้ไขไม่สำเร็จ");
      setEditUser(null);
      fetchUsers();
    } catch (err: unknown) {
      setEditError(err instanceof Error ? err.message : "แก้ไขไม่สำเร็จ");
    } finally {
      setEditSaving(false);
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`ลบบัญชี "${u.name}" (${u.email})?\n\nถ้าผู้ใช้นี้มีประวัติ check-in / แจกอาหาร / audit log จะถูก "ปิดใช้งาน" แทนการลบจริง`)) return;
    const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      alert(json.error || "ลบไม่สำเร็จ");
      return;
    }
    if (json.softDeleted) alert("ปิดใช้งานผู้ใช้แล้ว (ลบจริงไม่ได้เพราะมีประวัติในระบบ)");
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
                <TableHead className="w-48">จัดการ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const roleCfg = ROLE_CONFIG[u.role as UserRole];
                const isSelf = myId === u.id;
                return (
                  <TableRow key={u.id}>
                    <TableCell className="font-medium">
                      {u.name}
                      {isSelf && <span className="ml-2 text-xs text-blue-600">(ฉัน)</span>}
                    </TableCell>
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
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleActive(u.id, u.isActive)}
                          className={u.isActive ? "text-red-500 hover:text-red-700" : "text-green-600 hover:text-green-700"}
                          title={u.isActive ? "ปิดใช้งาน" : "เปิดใช้งาน"}
                        >
                          {u.isActive ? <ToggleRight className="h-4 w-4" /> : <ToggleLeft className="h-4 w-4" />}
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => openEdit(u)} title="แก้ไข">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(u)}
                          className="text-red-600 hover:text-red-700 disabled:opacity-30"
                          disabled={isSelf}
                          title={isSelf ? "ลบตนเองไม่ได้" : "ลบ"}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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

      {/* Edit user dialog */}
      <Dialog open={!!editUser} onOpenChange={(open) => { if (!open) setEditUser(null); }}>
        <DialogContent>
          <DialogHeader><DialogTitle>แก้ไขบัญชีผู้ใช้</DialogTitle></DialogHeader>
          {editUser && (
            <div className="space-y-3">
              {editError && <Alert variant="destructive"><AlertDescription>{editError}</AlertDescription></Alert>}
              <div>
                <Label>ชื่อ-นามสกุล</Label>
                <Input value={editUser.name} onChange={(e) => setEditUser({ ...editUser, name: e.target.value })} className="mt-1" />
              </div>
              <div>
                <Label>อีเมล (เปลี่ยนไม่ได้)</Label>
                <Input value={editUser.email} disabled className="mt-1 bg-gray-50" />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={editUser.role} onValueChange={(v) => setEditUser({ ...editUser, role: v as UserRole })}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ROLES.map((r) => <SelectItem key={r} value={r}>{ROLE_CONFIG[r].label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>รหัสเจ้าหน้าที่</Label>
                <Input value={editUser.staffCode} onChange={(e) => setEditUser({ ...editUser, staffCode: e.target.value })} className="mt-1" placeholder="เช่น STAFF-001" />
              </div>
              <div>
                <Label>รหัสผ่านใหม่ (เว้นว่างไว้ถ้าไม่เปลี่ยน)</Label>
                <Input type="password" value={editUser.password} onChange={(e) => setEditUser({ ...editUser, password: e.target.value })} className="mt-1" placeholder="อย่างน้อย 6 ตัวอักษร" autoComplete="new-password" />
              </div>
              <div className="flex items-center gap-2">
                <input id="edit-active" type="checkbox" checked={editUser.isActive} onChange={(e) => setEditUser({ ...editUser, isActive: e.target.checked })} className="h-4 w-4" />
                <Label htmlFor="edit-active" className="cursor-pointer">เปิดใช้งาน</Label>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>ยกเลิก</Button>
            <Button onClick={handleEditSave} disabled={editSaving}>{editSaving ? "กำลังบันทึก..." : "บันทึก"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
