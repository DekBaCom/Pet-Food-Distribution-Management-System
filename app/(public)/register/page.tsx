"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast";
import {
  User, Dog, Package, Image, CheckCircle2, ArrowLeft, ArrowRight,
  Info, Upload, X
} from "lucide-react";
import {
  RECEIVER_TYPES, FOOD_TYPES_CONFIG, PROVINCES, type RegistrationFormData,
  type AnimalData
} from "@/types";
import { formatPhone } from "@/lib/utils";

const STEPS = [
  { id: 1, title: "ข้อมูลผู้ลงทะเบียน", icon: User },
  { id: 2, title: "ข้อมูลสัตว์", icon: Dog },
  { id: 3, title: "อาหารที่ต้องการ", icon: Package },
  { id: 4, title: "อัปโหลดรูป", icon: Image },
  { id: 5, title: "ยืนยันข้อมูล", icon: CheckCircle2 },
];

const defaultAnimalData: AnimalData = { total: 0, young: 0, adult: 0, senior: 0, special: 0 };

const initialForm: RegistrationFormData = {
  fullName: "",
  phone: "",
  lineId: "",
  province: "",
  district: "",
  receiverType: "",
  dogs: { ...defaultAnimalData },
  cats: { ...defaultAnimalData },
  foodRequests: FOOD_TYPES_CONFIG.map((f) => ({ foodType: f.type, requestedQty: 0, unit: f.unit, selected: false })),
  consentPDPA: false,
  consentTruth: false,
};

function AnimalSection({
  title, emoji, data, onChange,
}: { title: string; emoji: string; data: AnimalData; onChange: (d: AnimalData) => void }) {
  const fields: { key: keyof AnimalData; label: string }[] = [
    { key: "young", label: "ลูก" },
    { key: "adult", label: "โต" },
    { key: "senior", label: "สูงอายุ" },
    { key: "special", label: "ป่วย/พิเศษ" },
  ];

  const updateField = (key: keyof AnimalData, value: number) => {
    const updated = { ...data, [key]: Math.max(0, value) };
    const sum = updated.young + updated.adult + updated.senior + updated.special;
    updated.total = sum;
    onChange(updated);
  };

  return (
    <div className="border rounded-lg p-4 bg-gray-50">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="text-2xl">{emoji}</span> {title}
        </h3>
        <Badge variant="secondary" className="text-base px-3">
          รวม <strong className="ml-1">{data.total}</strong> ตัว
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {fields.map((f) => (
          <div key={f.key}>
            <Label className="text-sm">{f.label}</Label>
            <Input
              type="number"
              min={0}
              value={data[f.key] || ""}
              onChange={(e) => updateField(f.key, parseInt(e.target.value) || 0)}
              className="mt-1"
              placeholder="0"
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<RegistrationFormData>(initialForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [photos, setPhotos] = useState<{ profile?: File; animals: File[]; docs: File[] }>({ animals: [], docs: [] });
  const [photoPreviews, setPhotoPreviews] = useState<{ profile?: string; animals: string[] }>({ animals: [] });
  const [submitting, setSubmitting] = useState(false);

  const totalAnimals = form.dogs.total + form.cats.total;
  const progress = (step / STEPS.length) * 100;

  const validateStep = (): boolean => {
    const e: Record<string, string> = {};
    if (step === 1) {
      if (!form.fullName.trim()) e.fullName = "กรุณากรอกชื่อ-นามสกุล";
      if (!form.phone.trim()) e.phone = "กรุณากรอกเบอร์โทรศัพท์";
      else if (!/^[0-9]{9,10}$/.test(form.phone.replace(/[-\s]/g, ""))) e.phone = "เบอร์โทรศัพท์ไม่ถูกต้อง";
      if (!form.province) e.province = "กรุณาเลือกจังหวัด";
      if (!form.receiverType) e.receiverType = "กรุณาเลือกประเภทผู้รับ";
    }
    if (step === 2) {
      if (totalAnimals === 0) e.animals = "กรุณากรอกจำนวนสัตว์อย่างน้อย 1 ตัว";
    }
    if (step === 3) {
      if (!form.foodRequests.some((f) => f.selected)) e.food = "กรุณาเลือกอาหารอย่างน้อย 1 ประเภท";
    }
    if (step === 5) {
      if (!form.consentPDPA) e.consentPDPA = "กรุณายอมรับนโยบายความเป็นส่วนตัว";
      if (!form.consentTruth) e.consentTruth = "กรุณารับรองความถูกต้องของข้อมูล";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) setStep((s) => Math.min(s + 1, STEPS.length));
  };
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const handlePhotoUpload = (type: "profile" | "animals" | "docs", files: FileList | null) => {
    if (!files) return;
    if (type === "profile") {
      const file = files[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => setPhotoPreviews((p) => ({ ...p, profile: e.target?.result as string }));
        reader.readAsDataURL(file);
        setPhotos((p) => ({ ...p, profile: file }));
      }
    } else if (type === "animals") {
      const arr = Array.from(files).slice(0, 5);
      arr.forEach((file) => {
        const reader = new FileReader();
        reader.onload = (e) =>
          setPhotoPreviews((p) => ({ ...p, animals: [...p.animals, e.target?.result as string].slice(0, 5) }));
        reader.readAsDataURL(file);
      });
      setPhotos((p) => ({ ...p, animals: [...p.animals, ...arr].slice(0, 5) }));
    }
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("data", JSON.stringify(form));
      if (photos.profile) formData.append("profile", photos.profile);
      photos.animals.forEach((f, i) => formData.append(`animal_${i}`, f));

      const res = await fetch("/api/registrations", { method: "POST", body: formData });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "เกิดข้อผิดพลาด");
      router.push(`/register/success?id=${json.registrationId}`);
    } catch (err: unknown) {
      toast({
        variant: "destructive",
        title: "เกิดข้อผิดพลาด",
        description: err instanceof Error ? err.message : "ไม่สามารถลงทะเบียนได้ กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const toggleFood = (index: number) => {
    setForm((f) => {
      const fr = [...f.foodRequests];
      fr[index] = { ...fr[index], selected: !fr[index].selected };
      if (!fr[index].selected) fr[index].requestedQty = 0;
      return { ...f, foodRequests: fr };
    });
  };

  const updateFoodQty = (index: number, qty: number) => {
    setForm((f) => {
      const fr = [...f.foodRequests];
      fr[index] = { ...fr[index], requestedQty: Math.max(0, qty) };
      return { ...f, foodRequests: fr };
    });
  };

  return (
    <div className="container py-8 max-w-2xl mx-auto">
      {/* Page title */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">ลงทะเบียนรับอาหาร</h1>
        <p className="text-muted-foreground text-sm mt-1">กรอกข้อมูลเพื่อรับสิทธิ์รับอาหารสุนัขและแมว</p>
      </div>

      {/* Step indicator */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-primary">ขั้นตอน {step} / {STEPS.length}</span>
          <span className="text-sm text-muted-foreground">{STEPS[step - 1].title}</span>
        </div>
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2">
          {STEPS.map((s) => (
            <div
              key={s.id}
              className={`flex flex-col items-center gap-1 cursor-pointer ${s.id <= step ? "text-primary" : "text-muted-foreground"}`}
              onClick={() => s.id < step && setStep(s.id)}
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                s.id < step ? "bg-primary border-primary text-white" :
                s.id === step ? "border-primary text-primary" :
                "border-muted-foreground"}`}>
                {s.id < step ? "✓" : s.id}
              </div>
              <span className="text-xs hidden sm:block">{s.title}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Step 1: Personal Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> ข้อมูลผู้ลงทะเบียน</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="fullName">ชื่อ-นามสกุล <span className="text-red-500">*</span></Label>
              <Input
                id="fullName"
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                placeholder="เช่น สมชาย ใจดี"
                className="mt-1"
              />
              {errors.fullName && <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>}
            </div>
            <div>
              <Label htmlFor="phone">เบอร์โทรศัพท์ <span className="text-red-500">*</span></Label>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="เช่น 089-123-4567"
                className="mt-1"
              />
              {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
            </div>
            <div>
              <Label htmlFor="lineId">LINE ID <span className="text-muted-foreground text-xs">(ไม่บังคับ)</span></Label>
              <Input
                id="lineId"
                value={form.lineId}
                onChange={(e) => setForm((f) => ({ ...f, lineId: e.target.value }))}
                placeholder="เช่น @example"
                className="mt-1"
              />
            </div>
            <div>
              <Label>จังหวัด <span className="text-red-500">*</span></Label>
              <Select value={form.province} onValueChange={(v) => setForm((f) => ({ ...f, province: v }))}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="เลือกจังหวัด" />
                </SelectTrigger>
                <SelectContent>
                  {PROVINCES.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              {errors.province && <p className="text-red-500 text-xs mt-1">{errors.province}</p>}
            </div>
            <div>
              <Label htmlFor="district">อำเภอ/เขต <span className="text-muted-foreground text-xs">(ไม่บังคับ)</span></Label>
              <Input
                id="district"
                value={form.district}
                onChange={(e) => setForm((f) => ({ ...f, district: e.target.value }))}
                placeholder="เช่น บางรัก"
                className="mt-1"
              />
            </div>
            <div>
              <Label>ประเภทผู้รับ <span className="text-red-500">*</span></Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2">
                {RECEIVER_TYPES.map((t) => (
                  <label
                    key={t}
                    className={`flex items-center gap-2 p-3 border rounded-lg cursor-pointer transition-colors ${
                      form.receiverType === t ? "border-primary bg-blue-50" : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <input
                      type="radio"
                      name="receiverType"
                      value={t}
                      checked={form.receiverType === t}
                      onChange={() => setForm((f) => ({ ...f, receiverType: t }))}
                      className="accent-primary"
                    />
                    <span className="text-sm">{t}</span>
                  </label>
                ))}
              </div>
              {errors.receiverType && <p className="text-red-500 text-xs mt-1">{errors.receiverType}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Animals */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>🐶🐱</span> ข้อมูลสัตว์
            </CardTitle>
            <CardDescription>กรอกจำนวนสัตว์ที่คุณดูแล แยกตามช่วงอายุ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimalSection
              title="สุนัข"
              emoji="🐶"
              data={form.dogs}
              onChange={(d) => setForm((f) => ({ ...f, dogs: d }))}
            />
            <AnimalSection
              title="แมว"
              emoji="🐱"
              data={form.cats}
              onChange={(d) => setForm((f) => ({ ...f, cats: d }))}
            />
            {totalAnimals > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                <div className="text-sm text-muted-foreground mb-1">รวมสัตว์ทั้งหมด</div>
                <div className="text-2xl font-bold text-primary">{totalAnimals} ตัว</div>
                <div className="text-sm text-muted-foreground">
                  สุนัข {form.dogs.total} + แมว {form.cats.total}
                </div>
              </div>
            )}
            {errors.animals && <Alert variant="destructive"><AlertDescription>{errors.animals}</AlertDescription></Alert>}
          </CardContent>
        </Card>
      )}

      {/* Step 3: Food */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5" /> อาหารที่ต้องการ</CardTitle>
            <CardDescription>เลือกประเภทอาหารที่ต้องการ</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert variant="info">
              <Info className="h-4 w-4" />
              <AlertDescription>จำนวนอาหารที่ได้รับจริงขึ้นอยู่กับ Stock และเงื่อนไขของกิจกรรม</AlertDescription>
            </Alert>
            {form.foodRequests.map((fr, i) => {
              const cfg = FOOD_TYPES_CONFIG[i];
              return (
                <div key={fr.foodType} className={`border rounded-lg p-4 transition-colors ${fr.selected ? "border-primary bg-blue-50" : "border-gray-200"}`}>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={fr.selected}
                      onCheckedChange={() => toggleFood(i)}
                      className="h-5 w-5"
                    />
                    <span className="text-xl">{cfg.icon}</span>
                    <span className="font-medium flex-1">{fr.foodType}</span>
                    <span className="text-sm text-muted-foreground">หน่วย: {fr.unit}</span>
                  </label>
                  {fr.selected && (
                    <div className="mt-3 pl-8">
                      <Label className="text-sm">จำนวนที่ต้องการ ({fr.unit})</Label>
                      <Input
                        type="number"
                        min={1}
                        value={fr.requestedQty || ""}
                        onChange={(e) => updateFoodQty(i, parseInt(e.target.value) || 0)}
                        className="mt-1 max-w-32"
                        placeholder="0"
                      />
                    </div>
                  )}
                </div>
              );
            })}
            {errors.food && <Alert variant="destructive"><AlertDescription>{errors.food}</AlertDescription></Alert>}
          </CardContent>
        </Card>
      )}

      {/* Step 4: Photos */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5" /> อัปโหลดรูปภาพ</CardTitle>
            <CardDescription>อัปโหลดรูปผู้ลงทะเบียนและสัตว์เลี้ยง (ไม่บังคับ)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile photo */}
            <div>
              <Label className="font-medium">รูปผู้ลงทะเบียน</Label>
              <div className="mt-2">
                {photoPreviews.profile ? (
                  <div className="relative inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={photoPreviews.profile} alt="profile" className="w-24 h-24 object-cover rounded-lg border" />
                    <button
                      onClick={() => { setPhotoPreviews((p) => ({ ...p, profile: undefined })); setPhotos((p) => ({ ...p, profile: undefined })); }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                    <Upload className="h-6 w-6 text-muted-foreground mb-2" />
                    <span className="text-sm text-muted-foreground">คลิกเพื่ออัปโหลด</span>
                    <span className="text-xs text-muted-foreground">JPG, PNG ขนาดไม่เกิน 5MB</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload("profile", e.target.files)} />
                  </label>
                )}
              </div>
            </div>

            {/* Animal photos */}
            <div>
              <Label className="font-medium">รูปสัตว์เลี้ยง (สูงสุด 5 รูป)</Label>
              <div className="mt-2 flex flex-wrap gap-2">
                {photoPreviews.animals.map((src, i) => (
                  <div key={i} className="relative">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={src} alt={`animal-${i}`} className="w-20 h-20 object-cover rounded-lg border" />
                    <button
                      onClick={() => {
                        setPhotoPreviews((p) => ({ ...p, animals: p.animals.filter((_, idx) => idx !== i) }));
                        setPhotos((p) => ({ ...p, animals: p.animals.filter((_, idx) => idx !== i) }));
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {photoPreviews.animals.length < 5 && (
                  <label className="flex flex-col items-center justify-center w-20 h-20 border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50">
                    <Upload className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground">เพิ่ม</span>
                    <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handlePhotoUpload("animals", e.target.files)} />
                  </label>
                )}
              </div>
            </div>

            <Alert variant="info">
              <Info className="h-4 w-4" />
              <AlertDescription>รูปภาพจะถูกใช้เพื่อยืนยันตัวตนในวันงาน ข้อมูลจะถูกเก็บรักษาอย่างปลอดภัย</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Step 5: Confirm */}
      {step === 5 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5" /> ยืนยันข้อมูล</CardTitle>
            <CardDescription>ตรวจสอบข้อมูลก่อนยืนยันการลงทะเบียน</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">ชื่อ-นามสกุล</div>
                  <div className="font-medium">{form.fullName}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">เบอร์โทร</div>
                  <div className="font-medium">{formatPhone(form.phone)}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">จังหวัด</div>
                  <div className="font-medium">{form.province}</div>
                </div>
                <div>
                  <div className="text-muted-foreground">ประเภทผู้รับ</div>
                  <div className="font-medium">{form.receiverType}</div>
                </div>
              </div>
              <div className="border-t pt-3 grid grid-cols-2 gap-2 text-sm">
                <div>
                  <div className="text-muted-foreground">สุนัข</div>
                  <div className="font-bold text-blue-600">{form.dogs.total} ตัว</div>
                </div>
                <div>
                  <div className="text-muted-foreground">แมว</div>
                  <div className="font-bold text-blue-600">{form.cats.total} ตัว</div>
                </div>
              </div>
              <div className="border-t pt-3 text-sm">
                <div className="text-muted-foreground mb-2">อาหารที่ต้องการ</div>
                <div className="flex flex-wrap gap-2">
                  {form.foodRequests.filter((f) => f.selected).map((f) => (
                    <Badge key={f.foodType} variant="secondary">
                      {f.foodType} {f.requestedQty > 0 ? `${f.requestedQty} ${f.unit}` : ""}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* PDPA & consent */}
            <div className="space-y-3">
              <div className={`flex items-start gap-3 p-3 rounded-lg border ${errors.consentPDPA ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                <Checkbox
                  id="pdpa"
                  checked={form.consentPDPA}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, consentPDPA: v as boolean }))}
                  className="mt-0.5"
                />
                <label htmlFor="pdpa" className="text-sm cursor-pointer">
                  ข้าพเจ้ายินยอมให้จัดเก็บและใช้ข้อมูลส่วนบุคคลตาม{" "}
                  <span className="text-primary underline">นโยบายความเป็นส่วนตัว (PDPA)</span>{" "}
                  เพื่อวัตถุประสงค์ในการดำเนินกิจกรรมแจกอาหารสัตว์
                </label>
              </div>
              {errors.consentPDPA && <p className="text-red-500 text-xs">{errors.consentPDPA}</p>}

              <div className={`flex items-start gap-3 p-3 rounded-lg border ${errors.consentTruth ? "border-red-300 bg-red-50" : "border-gray-200"}`}>
                <Checkbox
                  id="truth"
                  checked={form.consentTruth}
                  onCheckedChange={(v) => setForm((f) => ({ ...f, consentTruth: v as boolean }))}
                  className="mt-0.5"
                />
                <label htmlFor="truth" className="text-sm cursor-pointer">
                  ข้าพเจ้ารับรองว่าข้อมูลที่ให้ไว้ทั้งหมดเป็นความจริง และยอมรับเงื่อนไขของกิจกรรม
                </label>
              </div>
              {errors.consentTruth && <p className="text-red-500 text-xs">{errors.consentTruth}</p>}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between mt-6 gap-3">
        <Button
          variant="outline"
          onClick={prevStep}
          disabled={step === 1}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" /> ย้อนกลับ
        </Button>
        {step < STEPS.length ? (
          <Button onClick={nextStep} className="gap-2">
            ถัดไป <ArrowRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            {submitting ? "กำลังส่ง..." : "ยืนยันการลงทะเบียน"}
            <CheckCircle2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
