"use client";

import { useState, useEffect } from "react";
import { Plus, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { formatNumber, formatDateTime } from "@/lib/utils";

interface InventoryItem {
  id: string;
  foodType: string;
  foodName: string;
  unit: string;
  openingStock: number;
  received: number;
  distributed: number;
  remaining: number;
  minStock: number;
  transactions: { id: string; type: string; quantity: number; unit: string; notes: string; createdAt: string }[];
}

export default function InventoryPage() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [txType, setTxType] = useState("RECEIVE");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/inventory");
      const json = await res.json();
      setInventory(json.inventory || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInventory(); }, []);

  const handleAddTransaction = async () => {
    if (!selectedId || !qty) { setError("กรุณากรอกข้อมูลให้ครบ"); return; }
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/inventory/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: txType, quantity: parseFloat(qty), notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setAddOpen(false);
      setQty("");
      setNotes("");
      fetchInventory();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "เกิดข้อผิดพลาด");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">คลังอาหาร</h1>
          <p className="text-muted-foreground text-sm">จัดการ Stock อาหารสัตว์</p>
        </div>
        <Button onClick={() => setAddOpen(true)} className="gap-1">
          <Plus className="h-4 w-4" /> เพิ่ม/ถอน Stock
        </Button>
      </div>

      {/* Stock cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {inventory.map((item) => {
          const pct = item.openingStock + item.received > 0
            ? (item.remaining / (item.openingStock + item.received)) * 100 : 0;
          const low = item.remaining <= item.minStock;
          return (
            <Card key={item.id} className={`border ${low ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center justify-between">
                  <span>{item.foodName}</span>
                  {low && <AlertTriangle className="h-4 w-4 text-red-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-3xl font-bold text-primary">
                  {formatNumber(item.remaining)} <span className="text-sm font-normal text-muted-foreground">{item.unit}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full ${low ? "bg-red-400" : "bg-primary"}`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
                <div className="grid grid-cols-3 gap-1 text-xs text-muted-foreground">
                  <div>เริ่มต้น<br /><span className="font-bold text-gray-700">{formatNumber(item.openingStock)}</span></div>
                  <div>รับเพิ่ม<br /><span className="font-bold text-blue-600">+{formatNumber(item.received)}</span></div>
                  <div>แจกไป<br /><span className="font-bold text-orange-600">-{formatNumber(item.distributed)}</span></div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Transaction history */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">ประวัติธุรกรรม</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>เวลา</TableHead>
                <TableHead>อาหาร</TableHead>
                <TableHead>ประเภท</TableHead>
                <TableHead className="text-right">จำนวน</TableHead>
                <TableHead>หมายเหตุ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inventory.flatMap((inv) =>
                inv.transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="text-xs text-muted-foreground">{formatDateTime(t.createdAt)}</TableCell>
                    <TableCell>{inv.foodName}</TableCell>
                    <TableCell>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        t.type === "RECEIVE" ? "bg-blue-100 text-blue-700" :
                        t.type === "DISTRIBUTE" ? "bg-orange-100 text-orange-700" :
                        "bg-gray-100 text-gray-700"
                      }`}>{t.type}</span>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {t.type === "DISTRIBUTE" ? "-" : "+"}{formatNumber(t.quantity)} {t.unit}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">{t.notes || "-"}</TableCell>
                  </TableRow>
                ))
              ).slice(0, 20)}
              {inventory.every((i) => i.transactions.length === 0) && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">ยังไม่มีธุรกรรม</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add transaction dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>เพิ่ม / ถอน Stock</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
            <div>
              <Label>อาหาร</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="เลือกประเภทอาหาร" /></SelectTrigger>
                <SelectContent>
                  {inventory.map((i) => <SelectItem key={i.id} value={i.id}>{i.foodName}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>ประเภท</Label>
              <Select value={txType} onValueChange={setTxType}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="RECEIVE">รับเพิ่ม (RECEIVE)</SelectItem>
                  <SelectItem value="ADJUST">ปรับ (ADJUST)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>จำนวน</Label>
              <Input type="number" min={0} value={qty} onChange={(e) => setQty(e.target.value)} className="mt-1" placeholder="0" />
            </div>
            <div>
              <Label>หมายเหตุ</Label>
              <Input value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" placeholder="เช่น รับจากผู้บริจาค..." />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddOpen(false)}>ยกเลิก</Button>
            <Button onClick={handleAddTransaction} disabled={saving}>
              {saving ? "กำลังบันทึก..." : "ยืนยัน"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
