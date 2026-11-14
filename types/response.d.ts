// Narrow Body.json() back to `Promise<any>` so request/response handlers can
// destructure JSON payloads without casting at every call site. API routes still
// type their outgoing responses via NextResponse.json<T> and Zod validates inputs.
export {};

declare global {
  interface Body {
    json(): Promise<any>;
  }
  interface Response {
    json(): Promise<any>;
  }
  interface Request {
    json(): Promise<any>;
  }
}
