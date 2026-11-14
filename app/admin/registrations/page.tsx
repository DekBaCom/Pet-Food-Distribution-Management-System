"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, Download, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_CONFIG, RECEIVER_TYPES, PROVINCES } from "@/types";
import { formatDateTime } from "@/lib/utils";

interface Registration {
  id: string;
  registrationId: string;
  fullName: string;
  phone: string;
  province: string;
  receiverType: string;
  status: string;
  createdAt: string;
  animals: { animalType: string; total: number }[];
}

export default function AdminRegistrationsPage() {
  const [data, setData] = useState<{ registrations: Registration[]; total: number; pages: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [province, setProvince] = useState("all");
  const [status, setStatus] = useState("all");
  const [receiverType, setReceiverType] = useState("all");
  const [page, setPage] = useState(1);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "20" });
    if (search) params.set("search", search);
    if (province !== "all") params.set("province", province);
    if (status !== "all") params.set("status", status);
    if (receiverType !== "all") params.set("receiverType", receiverType);
    try {
      const res = await fetch(`/api/registrations?${params}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [page, search, province, status, receiverType]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleExportCSV = async () => {
    const res = await fetch("/api/reports?format=csv");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `registrations-${Date.now()}.csv`;
    a.click();
  };

  const updateStatus = async (id: string, newStatus: string) => {
    await fetch(`/api/registrations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    fetchData();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ผู้ลงทะเบียน</h1>
          <p className="text-muted-foreground text-sm">รายชื่อผู้ลงทะเบียนทั้งหมด</p>
        </div>
        <Button onClick={handleExportCSV} variant="outline" size="sm" className="gap-1">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="ค้นหาชื่อ / เบอร์ / รหัส"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
            </div>
            <Select value={province} onValueChange={(v) => { setProvince(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="จังหวัด" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกจังหวัด</SelectItem>
                {PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="สถานะ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={receiverType} onValueChange={(v) => { setReceiverType(v); setPage(1); }}>
              <SelectTrigger><SelectValue placeholder="ประเภท" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                {RECEIVER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัส</TableHead>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>จังหวัด</TableHead>
                  <TableHead>ประเภท</TableHead>
                  <TableHead className="text-center">🐶</TableHead>
                  <TableHead className="text-center">🐱</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>วันที่</TableHead>
                  <TableHead>จัดการ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.registrations.map((r) => {
                  const cfg = STATUS_CONFIG[r.status];
                  const dogs = r.animals.find((a) => a.animalType === "DOG")?.total ?? 0;
                  const cats = r.animals.find((a) => a.animalType === "CAT")?.total ?? 0;
                  return (
                    <TableRow key={r.id}>
                      <TableCell className="font-mono text-xs">{r.registrationId}</TableCell>
                      <TableCell className="font-medium">{r.fullName}</TableCell>
                      <TableCell className="text-sm">{r.province}</TableCell>
                      <TableCell className="text-xs">{r.receiverType}</TableCell>
                      <TableCell className="text-center">{dogs}</TableCell>
                      <TableCell className="text-center">{cats}</TableCell>
                      <TableCell>
                        {cfg && (
                          <span className={`status-badge ${cfg.color} ${cfg.bg} ${cfg.border}`}>
                            {cfg.label}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {formatDateTime(r.createdAt)}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {r.status === "REGISTERED" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-green-600"
                              onClick={() => updateStatus(r.id, "APPROVED")}
                            >
                              <CheckCircle2 className="h-3 w-3" />
                            </Button>
                          )}
                          {!["CANCELLED", "REJECTED", "RECEIVED"].includes(r.status) && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-red-600"
                              onClick={() => updateStatus(r.id, "CANCELLED")}
                            >
                              <XCircle className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {data?.registrations.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      ไม่พบข้อมูล
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.pages > 1 && (
        <div className="flex justify-center gap-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>ก่อนหน้า</Button>
          <span className="px-3 py-1.5 text-sm text-muted-foreground">หน้า {page} / {data.pages}</span>
          <Button variant="outline" size="sm" disabled={page >= data.pages} onClick={() => setPage(p => p + 1)}>ถัดไป</Button>
        </div>
      )}
    </div>
  );
}
