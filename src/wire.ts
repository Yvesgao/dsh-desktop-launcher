/**
 * Minimal JSON wire helpers for the plugin's HTTP API, mirroring the shapes
 * the official plugins use: `{ ok: true, value }` on success and
 * `{ ok: false, error: { code, message } }` on failure.
 *
 * Typed against the structural request/response faces from context-types.ts
 * (host-only file, but keeping one type language avoids casts at the route
 * boundary).
 */
import type { HttpRequest, HttpResponse } from './context-types.ts'

/**
 * Loopback fence for the plugin API: creating a shortcut on the host is a
 * privileged action, so only requests whose Host header resolves to the
 * local machine are served. The web app is normally opened at
 * http://127.0.0.1:3080, so its own requests pass.
 */
export function isLoopbackRequest(req: HttpRequest): boolean {
  const host = String(req.headers?.host ?? '').replace(/:\d+$/, '').toLowerCase()
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1'
}

export function writeJson(res: HttpResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

export function writeOk(res: HttpResponse, value: unknown): void {
  writeJson(res, 200, { ok: true, value })
}

export function writeError(res: HttpResponse, error: { code?: string; message: string }, status = 400): void {
  writeJson(res, status, { ok: false, error: { code: error.code ?? 'error', message: error.message } })
}

export async function readJsonBody(req: HttpRequest): Promise<unknown> {
  let data = ''
  const decoder = new TextDecoder()
  for await (const chunk of req) data += typeof chunk === 'string' ? chunk : decoder.decode(chunk)
  if (data === '') return {}
  return JSON.parse(data) as unknown
}
