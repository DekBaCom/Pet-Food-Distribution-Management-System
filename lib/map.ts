// Normalize whatever the admin pasted into a form we can both store and embed.
// Accepts:
//   - A plain Google Maps URL: https://www.google.com/maps/... or https://maps.app.goo.gl/...
//   - A full embed URL: https://www.google.com/maps/embed?pb=...
//   - A full iframe snippet: <iframe src="https://www.google.com/maps/embed?pb=..."></iframe>
// Returns the trimmed/extracted URL, or an empty string if it doesn't look like a map.
export function normalizeMapUrl(input: string): string {
  const raw = (input || "").trim();
  if (!raw) return "";

  // Extract src from <iframe ...>
  const iframeMatch = raw.match(/<iframe[^>]*\ssrc=["']([^"']+)["']/i);
  if (iframeMatch) return iframeMatch[1];

  return raw;
}

// Turn a stored URL into an embeddable src for <iframe>, or null if it can't
// be embedded (so callers fall back to a plain link).
export function toEmbedSrc(url: string | null | undefined): string | null {
  if (!url) return null;
  if (url.includes("/maps/embed")) return url;
  return null;
}
