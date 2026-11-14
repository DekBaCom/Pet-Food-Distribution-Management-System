"use client";

import { useState, useEffect, useCallback } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { STATUS_CONFIG, RECEIVER_TYPES, PROVINCES } from "@/types";
import { formatDateTime } from "@/lib/utils";

interface ReportRow {
  registrationId: string;
  fullName: string;
  phone: string;
  province: string;
  receiverType: string;
  status: string;
  dogs: number;
  cats: number;
  foodRequests: string;
  createdAt: string;
  receivedAt: string | null;
  staffName: string | null;
}

export default function ReportsPage() {
  const [data, setData] = useState<{ rows: ReportRow[]; total: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [province, setProvince] = useState("all");
  const [status, setStatus] = useState("all");
  const [receiverType, setReceiverType] = useState("all");

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ format: "json" });
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    if (province !== "all") params.set("province", province);
    if (status !== "all") params.set("status", status);
    if (receiverType !== "all") params.set("receiverType", receiverType);
    try {
      const res = await fetch(`/api/reports?${params}`);
      const json = await res.json();
      setData(json);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, province, status, receiverType]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  const exportCSV = async () => {
    const params = new URLSearchParams({ format: "csv" });
    if (dateFrom) params.set("from", dateFrom);
    if (dateTo) params.set("to", dateTo);
    if (province !== "all") params.set("province", province);
    if (status !== "all") params.set("status", status);
    if (receiverType !== "all") params.set("receiverType", receiverType);
    const res = await fetch(`/api/reports?${params}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report-${Date.now()}.csv`;
    a.click();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">รายงาน</h1>
          <p className="text-muted-foreground text-sm">รายงานการลงทะเบียนและการรับอาหาร</p>
        </div>
        <Button onClick={exportCSV} variant="outline" size="sm" className="gap-1">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4 pb-3">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div>
              <Label className="text-xs">วันที่เริ่ม</Label>
              <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="mt-1 h-9 text-sm" />
            </div>
            <div>
              <Label className="text-xs">วันที่สิ้นสุด</Label>
              <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="mt-1 h-9 text-sm" />
            </div>
            <Select value={province} onValueChange={setProvince}>
              <SelectTrigger className="h-9"><SelectValue placeholder="จังหวัด" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกจังหวัด</SelectItem>
                {PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger className="h-9"><SelectValue placeholder="สถานะ" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกสถานะ</SelectItem>
                {Object.entries(STATUS_CONFIG).map(([k, v]) => (
                  <SelectItem key={k} value={k}>{v.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={receiverType} onValueChange={setReceiverType}>
              <SelectTrigger className="h-9"><SelectValue placeholder="ประเภท" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทุกประเภท</SelectItem>
                {RECEIVER_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Summary */}
      {data && (
        <div className="text-sm text-muted-foreground">
          พบ <span className="font-semibold text-foreground">{data.total}</span> รายการ
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>รหัส</TableHead>
                  <TableHead>ชื่อ</TableHead>
                  <TableHead>โทร</TableHead>
                  <TableHead>จังหวัด</TableHead>
                  <TableHead className="text-center">🐶</TableHead>
                  <TableHead className="text-center">🐱</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>ลงทะเบียน</TableHead>
                  <TableHead>รับอาหาร</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.rows.map((r) => {
                  const cfg = STATUS_CONFIG[r.status];
                  return (
                    <TableRow key={r.registrationId}>
                      <TableCell className="font-mono text-xs">{r.registrationId}</TableCell>
                      <TableCell className="font-medium whitespace-nowrap">{r.fullName}</TableCell>
                      <TableCell className="text-xs">{r.phone}</TableCell>
                      <TableCell className="text-sm">{r.province}</TableCell>
                      <TableCell className="text-center">{r.dogs}</TableCell>
                      <TableCell className="text-center">{r.cats}</TableCell>
                      <TableCell>
                        {cfg && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${cfg.color} ${cfg.bg}`}>
                            {cfg.label}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDateTime(r.createdAt)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {r.receivedAt ? formatDateTime(r.receivedAt) : "-"}
                      </TableCell>
                    </TableRow>
                  );
                })}
                {data?.rows.length === 0 && (
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
    </div>
  );
}
