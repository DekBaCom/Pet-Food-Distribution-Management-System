"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Calendar, MapPin, Plus, Pencil, Trash2, Save, X, CheckCircle2, CircleOff, ExternalLink } from "lucide-react";
import { normalizeMapUrl, toEmbedSrc } from "@/lib/map";

type EventItem = {
  id: string;
  name: string;
  description: string | null;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  province: string | null;
  mapUrl: string | null;
  isActive: boolean;
};

type FormState = {
  id?: string;
  name: string;
  description: string;
  eventDate: string;
  startTime: string;
  endTime: string;
  location: string;
  province: string;
  mapUrl: string;
  isActive: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  description: "",
  eventDate: "",
  startTime: "09:00",
  endTime: "16:00",
  location: "",
  province: "",
  mapUrl: "",
  isActive: true,
};

function toDateInputValue(iso: string): string {
  const d = new Date(iso);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function formatThaiDate(iso: string): string {
  return new Date(iso).toLocaleDateString("th-TH", {
    year: "numeric", month: "long", day: "numeric", weekday: "long",
  });
}

export default function AdminSettingsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<"list" | "form">("list");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadEvents() {
    setLoading(true);
    try {
      const res = await fetch("/api/events");
      const data = await res.json();
      setEvents(data.events || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadEvents(); }, []);

  function startCreate() {
    setForm(EMPTY_FORM);
    setError(null);
    setMode("form");
  }

  function startEdit(e: EventItem) {
    setForm({
      id: e.id,
      name: e.name,
      description: e.description ?? "",
      eventDate: toDateInputValue(e.eventDate),
      startTime: e.startTime,
      endTime: e.endTime,
      location: e.location,
      province: e.province ?? "",
      mapUrl: e.mapUrl ?? "",
      isActive: e.isActive,
    });
    setError(null);
    setMode("form");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name || !form.eventDate || !form.location || !form.startTime || !form.endTime) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const url = form.id ? `/api/events/${form.id}` : "/api/events";
      const method = form.id ? "PATCH" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: "บันทึกไม่สำเร็จ" }));
        setError(body.error || "บันทึกไม่สำเร็จ");
        return;
      }
      await loadEvents();
      setMode("list");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(e: EventItem) {
    if (!confirm(`ลบงาน "${e.name}"?`)) return;
    const res = await fetch(`/api/events/${e.id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("ลบไม่สำเร็จ");
      return;
    }
    await loadEvents();
  }

  async function toggleActive(e: EventItem) {
    await fetch(`/api/events/${e.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !e.isActive }),
    });
    await loadEvents();
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const upcoming = events.filter((e) => new Date(e.eventDate) >= today);
  const past = events.filter((e) => new Date(e.eventDate) < today);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">ตั้งค่าระบบ</h1>
          <p className="text-muted-foreground text-sm">จัดการข้อมูลงาน สถานที่ และระบบ</p>
        </div>
        {mode === "list" && (
          <Button onClick={startCreate} className="gap-1">
            <Plus className="h-4 w-4" /> เพิ่มงานใหม่
          </Button>
        )}
      </div>

      {mode === "form" ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{form.id ? "แก้ไขงาน" : "เพิ่มงานใหม่"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-2">{error}</div>
              )}
              <div>
                <Label htmlFor="name">ชื่องาน *</Label>
                <Input id="name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="เช่น กิจกรรมแจกอาหารสัตว์ 2026" required />
              </div>
              <div>
                <Label htmlFor="description">รายละเอียด</Label>
                <Input id="description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="รายละเอียดเพิ่มเติม (ไม่บังคับ)" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Label htmlFor="eventDate">วันที่จัดงาน *</Label>
                  <Input id="eventDate" type="date" value={form.eventDate} onChange={(e) => setForm({ ...form, eventDate: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="startTime">เวลาเริ่ม *</Label>
                  <Input id="startTime" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="endTime">เวลาสิ้นสุด *</Label>
                  <Input id="endTime" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} required />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="location">สถานที่ *</Label>
                  <Input id="location" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} placeholder="เช่น ศูนย์ชุมชนกลาง กรุงเทพฯ" required />
                </div>
                <div>
                  <Label htmlFor="province">จังหวัด</Label>
                  <Input id="province" value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })} placeholder="เช่น กรุงเทพมหานคร" />
                </div>
              </div>
              <div>
                <Label htmlFor="mapUrl">Google Maps</Label>
                <Input
                  id="mapUrl"
                  value={form.mapUrl}
                  onChange={(e) => setForm({ ...form, mapUrl: e.target.value })}
                  placeholder="วางลิงก์ Google Maps หรือโค้ด <iframe src=...>"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  เปิด Google Maps → กด <b>Share</b> → <b>Embed a map</b> → Copy HTML → วางที่นี่ (หรือวางลิงก์ธรรมดาก็ได้ แต่ถ้าเป็น embed จะโชว์แผนที่ในหน้าได้)
                </p>
                <MapPreview url={form.mapUrl} />
              </div>
              <div className="flex items-center gap-2">
                <input id="isActive" type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} className="h-4 w-4" />
                <Label htmlFor="isActive" className="cursor-pointer">เปิดใช้งาน (แสดงต่อสาธารณะ)</Label>
              </div>
              <div className="flex gap-2 pt-2">
                <Button type="submit" disabled={saving} className="gap-1">
                  <Save className="h-4 w-4" />
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setMode("list")} className="gap-1">
                  <X className="h-4 w-4" /> ยกเลิก
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <EventSection title="งานที่กำลังจะมาถึง" events={upcoming} loading={loading} onEdit={startEdit} onDelete={handleDelete} onToggle={toggleActive} emptyText="ยังไม่มีงานที่กำหนด" />
          {past.length > 0 && (
            <EventSection title="งานที่ผ่านมา" events={past} loading={false} onEdit={startEdit} onDelete={handleDelete} onToggle={toggleActive} muted />
          )}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Settings className="h-4 w-4" /> ข้อมูลเวอร์ชัน
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-1">
              <p>ระบบแจกอาหารหมาแมว v0.1.0</p>
              <p>Deployed on Cloudflare Workers + D1 + R2</p>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

function MapPreview({ url }: { url: string }) {
  const normalized = normalizeMapUrl(url);
  const embed = toEmbedSrc(normalized);
  if (!normalized) return null;
  return (
    <div className="mt-2 rounded-md border overflow-hidden bg-gray-50">
      {embed ? (
        <iframe
          src={embed}
          width="100%"
          height="220"
          style={{ border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title="Map preview"
        />
      ) : (
        <div className="p-3 text-xs">
          <p className="text-muted-foreground mb-1">{`ลิงก์นี้ไม่ใช่ embed URL — หน้าเว็บจะแสดงเป็นลิงก์คลิกเท่านั้น (ถ้าต้องการให้แสดงแผนที่ในหน้า ใช้ "Embed a map" จาก Share menu ของ Google Maps)`}</p>
          <a href={normalized} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{normalized}</a>
        </div>
      )}
    </div>
  );
}

function EventSection({
  title, events, loading, onEdit, onDelete, onToggle, emptyText, muted,
}: {
  title: string;
  events: EventItem[];
  loading: boolean;
  onEdit: (e: EventItem) => void;
  onDelete: (e: EventItem) => void;
  onToggle: (e: EventItem) => void;
  emptyText?: string;
  muted?: boolean;
}) {
  return (
    <div>
      <h2 className={`text-sm font-semibold mb-2 ${muted ? "text-muted-foreground" : ""}`}>{title}</h2>
      {loading ? (
        <div className="text-sm text-muted-foreground">กำลังโหลด...</div>
      ) : events.length === 0 ? (
        <div className="text-sm text-muted-foreground p-6 text-center border border-dashed rounded-lg">
          {emptyText ?? "ไม่มีข้อมูล"}
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((e) => (
            <Card key={e.id} className={muted ? "opacity-70" : ""}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div className="flex-1 min-w-[16rem]">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold">{e.name}</h3>
                      {e.isActive ? (
                        <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" /> เปิดใช้งาน
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CircleOff className="h-3 w-3" /> ปิด
                        </span>
                      )}
                    </div>
                    {e.description && <p className="text-sm text-muted-foreground mb-2">{e.description}</p>}
                    <div className="text-sm space-y-1">
                      <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-muted-foreground" /> {formatThaiDate(e.eventDate)}</div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        เวลา {e.startTime} - {e.endTime}
                      </div>
                      <div className="flex items-start gap-2"><MapPin className="h-4 w-4 text-muted-foreground mt-0.5" /> <span>{e.location}{e.province ? ` · ${e.province}` : ""}</span></div>
                      {e.mapUrl && (
                        <a href={e.mapUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline inline-flex items-center gap-1 ml-6">
                          <ExternalLink className="h-3 w-3" /> เปิดใน Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => onToggle(e)}>
                      {e.isActive ? "ปิด" : "เปิด"}
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onEdit(e)} className="gap-1">
                      <Pencil className="h-3 w-3" /> แก้ไข
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onDelete(e)} className="gap-1 text-red-600 hover:text-red-700">
                      <Trash2 className="h-3 w-3" /> ลบ
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
