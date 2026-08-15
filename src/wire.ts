/**
 * Minimal JSON wire helpers for the plugin's HTTP API, mirroring the shapes
 * the official plugins use: `{ ok: true, value }` on success and
 * `{ ok: false, error: { code, message } }` on failure.
 */
import type { IncomingMessage, ServerResponse } from 'node:http'

/**
 * Loopback fence for the plugin API: creating a shortcut on the host is a
 * privileged action, so only requests whose Host header resolves to the
 * local machine are served. The web app is normally opened at
 * http://127.0.0.1:3080, so its own requests pass.
 */
export function isLoopbackRequest(req: IncomingMessage): boolean {
  const host = (req.headers.host ?? '').replace(/:\d+$/, '').toLowerCase()
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host === '::1'
}

export function writeJson(res: ServerResponse, status: number, body: unknown): void {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(body))
}

export function writeOk(res: ServerResponse, value: unknown): void {
  writeJson(res, 200, { ok: true, value })
}

export function writeError(res: ServerResponse, error: { code?: string; message: string }, status = 400): void {
  writeJson(res, status, { ok: false, error: { code: error.code ?? 'error', message: error.message } })
}

export async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  let data = ''
  for await (const chunk of req) data += chunk
  if (data === '') return {}
  return JSON.parse(data) as unknown
}
