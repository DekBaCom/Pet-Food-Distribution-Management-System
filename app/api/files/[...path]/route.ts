import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  const { path } = await context.params;
  const key = path.map((p) => decodeURIComponent(p)).join("/");

  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const bucket = ctx?.env?.UPLOADS;
    if (bucket) {
      const object = await bucket.get(key);
      if (!object) return new Response("Not Found", { status: 404 });
      const headers = new Headers();
      object.writeHttpMetadata(headers);
      headers.set("etag", object.httpEtag);
      headers.set("cache-control", "public, max-age=31536000, immutable");
      return new Response(object.body as ReadableStream, { headers });
    }
  } catch {
  }

  const { readFile } = await import("fs/promises");
  const { join } = await import("path");
  try {
    const buffer = await readFile(join(process.cwd(), "public", key));
    const ext = key.slice(key.lastIndexOf(".") + 1).toLowerCase();
    const mime =
      ext === "jpg" || ext === "jpeg" ? "image/jpeg" :
      ext === "png" ? "image/png" :
      ext === "webp" ? "image/webp" :
      ext === "pdf" ? "application/pdf" : "application/octet-stream";
    return new Response(buffer, { headers: { "content-type": mime } });
  } catch {
    return new Response("Not Found", { status: 404 });
  }
}
