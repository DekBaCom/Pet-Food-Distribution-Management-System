// Cloudflare bindings available via getCloudflareContext()
interface CloudflareEnv {
  DB: D1Database;
  UPLOADS: R2Bucket;
  ASSETS: Fetcher;
  NEXTAUTH_URL?: string;
  NEXTAUTH_SECRET?: string;
}
