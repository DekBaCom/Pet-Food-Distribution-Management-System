import {
  canAccessAdmin, canAccessStaff, canOverride, canManageInventory, canExportData,
  STATUS_CONFIG, FOOD_TYPES_CONFIG, RECEIVER_TYPES
} from "@/types";

describe("Role permissions", () => {
  it("SUPER_ADMIN can access admin", () => {
    expect(canAccessAdmin("SUPER_ADMIN")).toBe(true);
  });
  it("ADMIN can access admin", () => {
    expect(canAccessAdmin("ADMIN")).toBe(true);
  });
  it("CHECKIN_STAFF cannot access admin", () => {
    expect(canAccessAdmin("CHECKIN_STAFF")).toBe(false);
  });
  it("VIEWER cannot access admin", () => {
    expect(canAccessAdmin("VIEWER")).toBe(false);
  });
  it("CHECKIN_STAFF can access staff", () => {
    expect(canAccessStaff("CHECKIN_STAFF")).toBe(true);
  });
  it("VIEWER cannot access staff", () => {
    expect(canAccessStaff("VIEWER")).toBe(false);
  });
  it("SUPERVISOR can override", () => {
    expect(canOverride("SUPERVISOR")).toBe(true);
  });
  it("CHECKIN_STAFF cannot override", () => {
    expect(canOverride("CHECKIN_STAFF")).toBe(false);
  });
  it("WAREHOUSE can manage inventory", () => {
    expect(canManageInventory("WAREHOUSE")).toBe(true);
  });
  it("VIEWER cannot manage inventory", () => {
    expect(canManageInventory("VIEWER")).toBe(false);
  });
  it("ADMIN can export data", () => {
    expect(canExportData("ADMIN")).toBe(true);
  });
  it("CHECKIN_STAFF cannot export data", () => {
    expect(canExportData("CHECKIN_STAFF")).toBe(false);
  });
});

describe("STATUS_CONFIG", () => {
  it("contains all expected statuses", () => {
    const statuses = ["REGISTERED", "VERIFIED", "APPROVED", "CHECKED_IN", "RECEIVED", "CANCELLED", "REJECTED"];
    statuses.forEach((s) => expect(STATUS_CONFIG[s]).toBeDefined());
  });
  it("each status has label, color, bg, border", () => {
    Object.values(STATUS_CONFIG).forEach((cfg) => {
      expect(cfg.label).toBeTruthy();
      expect(cfg.color).toBeTruthy();
      expect(cfg.bg).toBeTruthy();
      expect(cfg.border).toBeTruthy();
    });
  });
});

describe("FOOD_TYPES_CONFIG", () => {
  it("has 5 food types", () => {
    expect(FOOD_TYPES_CONFIG.length).toBe(5);
  });
  it("each has type, unit, icon, label", () => {
    FOOD_TYPES_CONFIG.forEach((f) => {
      expect(f.type).toBeTruthy();
      expect(f.unit).toBeTruthy();
      expect(f.icon).toBeTruthy();
      expect(f.label).toBeTruthy();
    });
  });
});

describe("RECEIVER_TYPES", () => {
  it("has 6 receiver types", () => {
    expect(RECEIVER_TYPES.length).toBe(6);
  });
});
