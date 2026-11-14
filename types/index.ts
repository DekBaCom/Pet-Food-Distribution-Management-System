export type UserRole =
  | "SUPER_ADMIN"
  | "ADMIN"
  | "REGISTRATION_STAFF"
  | "CHECKIN_STAFF"
  | "WAREHOUSE"
  | "SUPERVISOR"
  | "VIEWER";

export type RegistrationStatus =
  | "REGISTERED"
  | "VERIFIED"
  | "APPROVED"
  | "CHECKED_IN"
  | "RECEIVED"
  | "CANCELLED"
  | "REJECTED";

export type ReceiverType =
  | "ผู้เลี้ยงสัตว์ส่วนตัว"
  | "บ้านพักสัตว์ / Shelter"
  | "กลุ่มช่วยเหลือสัตว์"
  | "มูลนิธิ / องค์กร"
  | "ผู้ดูแลสัตว์จร"
  | "อื่น ๆ";

export type FoodType =
  | "อาหารสุนัข"
  | "อาหารแมว"
  | "อาหารลูกสุนัข"
  | "อาหารลูกแมว"
  | "อาหารเปียก";

export type AnimalType = "DOG" | "CAT";

export interface AnimalData {
  total: number;
  young: number;
  adult: number;
  senior: number;
  special: number;
}

export interface FoodRequestData {
  foodType: FoodType;
  requestedQty: number;
  unit: string;
  selected: boolean;
}

export interface RegistrationFormData {
  fullName: string;
  phone: string;
  lineId: string;
  province: string;
  district: string;
  receiverType: ReceiverType | "";
  dogs: AnimalData;
  cats: AnimalData;
  foodRequests: FoodRequestData[];
  consentPDPA: boolean;
  consentTruth: boolean;
}

export const RECEIVER_TYPES: ReceiverType[] = [
  "ผู้เลี้ยงสัตว์ส่วนตัว",
  "บ้านพักสัตว์ / Shelter",
  "กลุ่มช่วยเหลือสัตว์",
  "มูลนิธิ / องค์กร",
  "ผู้ดูแลสัตว์จร",
  "อื่น ๆ",
];

export const FOOD_TYPES_CONFIG: { type: FoodType; unit: string; icon: string; label: string }[] = [
  { type: "อาหารสุนัข", unit: "KG", icon: "🐶", label: "อาหารสุนัข" },
  { type: "อาหารแมว", unit: "KG", icon: "🐱", label: "อาหารแมว" },
  { type: "อาหารลูกสุนัข", unit: "KG", icon: "🐶", label: "อาหารลูกสุนัข" },
  { type: "อาหารลูกแมว", unit: "KG", icon: "🐱", label: "อาหารลูกแมว" },
  { type: "อาหารเปียก", unit: "ซอง", icon: "🥫", label: "อาหารเปียก" },
];

export const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  REGISTERED: { label: "รอยืนยัน", color: "text-blue-700", bg: "bg-blue-50", border: "border-blue-200" },
  VERIFIED: { label: "ยืนยันแล้ว", color: "text-indigo-700", bg: "bg-indigo-50", border: "border-indigo-200" },
  APPROVED: { label: "อนุมัติแล้ว", color: "text-green-700", bg: "bg-green-50", border: "border-green-200" },
  CHECKED_IN: { label: "Check-in แล้ว", color: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
  RECEIVED: { label: "รับอาหารแล้ว", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
  CANCELLED: { label: "ยกเลิก", color: "text-gray-500", bg: "bg-gray-50", border: "border-gray-200" },
  REJECTED: { label: "ไม่อนุมัติ", color: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
};

export const ROLE_CONFIG: Record<UserRole, { label: string; description: string; color: string }> = {
  SUPER_ADMIN: { label: "Super Admin", description: "สิทธิ์สูงสุด ควบคุมทุกอย่าง", color: "text-purple-700" },
  ADMIN: { label: "Admin", description: "จัดการระบบและข้อมูลทั้งหมด", color: "text-blue-700" },
  REGISTRATION_STAFF: { label: "เจ้าหน้าที่ลงทะเบียน", description: "รับลงทะเบียนและตรวจสอบข้อมูล", color: "text-cyan-700" },
  CHECKIN_STAFF: { label: "เจ้าหน้าที่ Check-in", description: "Scan QR และบันทึกการรับอาหาร", color: "text-green-700" },
  WAREHOUSE: { label: "คลังสินค้า", description: "จัดการ Stock อาหาร", color: "text-amber-700" },
  SUPERVISOR: { label: "Supervisor", description: "ดูแลและ Override ได้", color: "text-orange-700" },
  VIEWER: { label: "ผู้ดูข้อมูล", description: "ดูข้อมูลได้อย่างเดียว", color: "text-gray-700" },
};

export const PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร",
  "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท",
  "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง",
  "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม",
  "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส",
  "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์",
  "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พะเยา", "พังงา",
  "พัทลุง", "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์",
  "แพร่", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน",
  "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง",
  "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย",
  "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ",
  "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี",
  "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย",
  "หนองบัวลำภู", "อ่างทอง", "อำนาจเจริญ", "อุดรธานี", "อุตรดิตถ์",
  "อุทัยธานี", "อุบลราชธานี",
];

export function canAccessAdmin(role: string): boolean {
  return ["SUPER_ADMIN", "ADMIN"].includes(role);
}

export function canAccessStaff(role: string): boolean {
  return ["SUPER_ADMIN", "ADMIN", "REGISTRATION_STAFF", "CHECKIN_STAFF", "WAREHOUSE", "SUPERVISOR"].includes(role);
}

export function canOverride(role: string): boolean {
  return ["SUPER_ADMIN", "ADMIN", "SUPERVISOR"].includes(role);
}

export function canManageUsers(role: string): boolean {
  return ["SUPER_ADMIN", "ADMIN"].includes(role);
}

export function canManageInventory(role: string): boolean {
  return ["SUPER_ADMIN", "ADMIN", "WAREHOUSE"].includes(role);
}

export function canExportData(role: string): boolean {
  return ["SUPER_ADMIN", "ADMIN"].includes(role);
}
