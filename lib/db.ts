import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

declare global {
  // eslint-disable-next-line no-var
  var __prisma: PrismaClient | undefined;
}

function createLocalClient(): PrismaClient {
  return new PrismaClient();
}

function createD1Client(d1: D1Database): PrismaClient {
  const adapter = new PrismaD1(d1);
  return new PrismaClient({ adapter });
}

async function resolveClient(): Promise<PrismaClient> {
  if (globalThis.__prisma) return globalThis.__prisma;

  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const d1 = ctx?.env?.DB;
    if (d1) {
      const client = createD1Client(d1);
      globalThis.__prisma = client;
      return client;
    }
  } catch {
  }

  const client = createLocalClient();
  if (process.env.NODE_ENV !== "production") globalThis.__prisma = client;
  return client;
}

export async function getPrisma(): Promise<PrismaClient> {
  return resolveClient();
}

export const prisma: PrismaClient = globalThis.__prisma ?? createLocalClient();
if (process.env.NODE_ENV !== "production" && !globalThis.__prisma) {
  globalThis.__prisma = prisma;
}
