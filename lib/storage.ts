import { nanoid } from "nanoid";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

export interface UploadResult {
  url: string;
  key: string;
  size: number;
  contentType: string;
}

export async function uploadFile(
  file: File | Blob,
  options: { folder?: string; filename?: string } = {}
): Promise<UploadResult> {
  const folder = options.folder ?? "uploads";
  const ext = extractExt(file, options.filename);
  const key = `${folder}/${new Date().toISOString().slice(0, 10)}/${nanoid(16)}${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const contentType = file.type || "application/octet-stream";

  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const ctx = await getCloudflareContext({ async: true });
    const bucket = ctx?.env?.UPLOADS;
    if (bucket) {
      await bucket.put(key, buffer, { httpMetadata: { contentType } });
      return {
        url: `/api/files/${encodeURIComponent(key)}`,
        key,
        size: buffer.length,
        contentType,
      };
    }
  } catch {
  }

  const localDir = join(process.cwd(), "public", folder, new Date().toISOString().slice(0, 10));
  await mkdir(localDir, { recursive: true });
  const localName = `${nanoid(16)}${ext}`;
  await writeFile(join(localDir, localName), buffer);
  const localKey = `${folder}/${new Date().toISOString().slice(0, 10)}/${localName}`;
  return {
    url: `/${localKey}`,
    key: localKey,
    size: buffer.length,
    contentType,
  };
}

function extractExt(file: File | Blob, filename?: string): string {
  const name = filename ?? (file as File).name ?? "";
  const dot = name.lastIndexOf(".");
  if (dot > -1) return name.slice(dot);
  const type = file.type || "";
  if (type.includes("jpeg")) return ".jpg";
  if (type.includes("png")) return ".png";
  if (type.includes("webp")) return ".webp";
  if (type.includes("pdf")) return ".pdf";
  return "";
}
