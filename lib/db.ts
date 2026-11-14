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
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const d1 = ctx?.env?.DB;
    if (d1) return createD1Client(d1);
  } catch {
  }

  if (globalThis.__prisma) return globalThis.__prisma;
  const client = createLocalClient();
  if (process.env.NODE_ENV !== "production") globalThis.__prisma = client;
  return client;
}

export async function getPrisma(): Promise<PrismaClient> {
  return resolveClient();
}

// Lazy proxy so `import { prisma }` works unchanged. On edge it resolves to the
// D1-adapter client inside the request; in Node it uses the globalThis cache.
// Each `prisma.<model>.<op>(...args)` call becomes `resolveClient().then(c => c.<model>.<op>(...args))`.
type AnyFn = (...args: unknown[]) => unknown;

const rootMethods = new Set(["$transaction", "$queryRaw", "$executeRaw", "$connect", "$disconnect", "$queryRawUnsafe", "$executeRawUnsafe"]);

export const prisma: PrismaClient = new Proxy({} as PrismaClient, {
  get(_t, prop: string) {
    if (prop === "then") return undefined;
    if (rootMethods.has(prop)) {
      return (...args: unknown[]) =>
        resolveClient().then((c) => (c as unknown as Record<string, AnyFn>)[prop](...args));
    }
    return new Proxy({}, {
      get(_m, op: string) {
        return (...args: unknown[]) =>
          resolveClient().then((c) => {
            const model = (c as unknown as Record<string, Record<string, AnyFn>>)[prop];
            return model[op](...args);
          });
      },
    });
  },
});
