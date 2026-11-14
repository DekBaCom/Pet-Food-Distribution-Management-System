import { PrismaClient } from "@prisma/client";
import { writeFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

function sqlValue(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return String(v);
  if (typeof v === "boolean") return v ? "1" : "0";
  if (v instanceof Date) return `'${v.toISOString()}'`;
  return `'${String(v).replace(/'/g, "''")}'`;
}

function insertStmt(table: string, rows: Record<string, unknown>[]): string[] {
  if (rows.length === 0) return [];
  const cols = Object.keys(rows[0]);
  return rows.map(
    (row) =>
      `INSERT INTO "${table}" (${cols.map((c) => `"${c}"`).join(", ")}) VALUES (${cols.map((c) => sqlValue(row[c])).join(", ")});`
  );
}

async function main() {
  const lines: string[] = ["-- Generated seed data for D1", ""];

  const users = await prisma.user.findMany();
  const events = await prisma.event.findMany();
  const registrations = await prisma.registration.findMany();
  const animals = await prisma.animal.findMany();
  const foodRequests = await prisma.foodRequest.findMany();
  const qrCodes = await prisma.qRCode.findMany();
  const checkins = await prisma.checkin.findMany();
  const distributions = await prisma.distribution.findMany();
  const inventory = await prisma.inventory.findMany();
  const inventoryTxns = await prisma.inventoryTransaction.findMany();

  lines.push(...insertStmt("User", users as Record<string, unknown>[]));
  lines.push(...insertStmt("Event", events as Record<string, unknown>[]));
  lines.push(...insertStmt("Registration", registrations as Record<string, unknown>[]));
  lines.push(...insertStmt("Animal", animals as Record<string, unknown>[]));
  lines.push(...insertStmt("FoodRequest", foodRequests as Record<string, unknown>[]));
  lines.push(...insertStmt("QRCode", qrCodes as Record<string, unknown>[]));
  lines.push(...insertStmt("Checkin", checkins as Record<string, unknown>[]));
  lines.push(...insertStmt("Distribution", distributions as Record<string, unknown>[]));
  lines.push(...insertStmt("Inventory", inventory as Record<string, unknown>[]));
  lines.push(...insertStmt("InventoryTransaction", inventoryTxns as Record<string, unknown>[]));

  const outputPath = join(__dirname, "seed-data.sql");
  writeFileSync(outputPath, lines.join("\n"));
  console.log(`Wrote ${lines.length} lines to ${outputPath}`);
  console.log(`Users: ${users.length}, Events: ${events.length}, Registrations: ${registrations.length}`);
  console.log(`Animals: ${animals.length}, FoodReq: ${foodRequests.length}, Checkins: ${checkins.length}`);
  console.log(`Distributions: ${distributions.length}, Inventory: ${inventory.length}`);
}

main().finally(() => prisma.$disconnect());
