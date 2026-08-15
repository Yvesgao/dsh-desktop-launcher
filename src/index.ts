/**
 * dsh-desktop-shortcut host half.
 *
 * Serves a small JSON API under `/plugins/desktop-shortcut/api`:
 *
 * - POST .../install  { name, command, url, workDir } -> runs the bundled
 *   New-DesktopShortcut.ps1 PowerShell engine and returns its output.
 * - POST .../status   -> { platform, desktop } for the Settings UI.
 *
 * The heavy lifting lives in `assets/New-DesktopShortcut.ps1` (a
 * self-contained, verified helper: generates a .cmd launcher, creates the
 * desktop .lnk, attempts a taskbar pin and prints manual fallback steps).
 */
import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { join } from 'node:path'
import { homedir } from 'node:os'
import type { Context } from './context-types.ts'
import { isLoopbackRequest, readJsonBody, writeError, writeJson, writeOk } from './wire.ts'

/** Plugin identity for cordis.yml rows / the bundle stack. */
export const name = 'dsh-desktop-shortcut'

/** Services required before mounting. */
export const inject = ['webServer']

/** Route prefix of the JSON API. */
export const API_BASE = '/plugins/desktop-shortcut/api'

/** The bundled PowerShell engine (shipped in assets/, included in "files"). */
const PS1_PATH = fileURLToPath(new URL('../assets/New-DesktopShortcut.ps1', import.meta.url))

/** One install/status result payload. */
export interface ShortcutResult {
  ok: boolean
  output: string
}

/** Run the PowerShell helper with the given parameter list. */
function runPs1(args: string[]): Promise<ShortcutResult> {
  return new Promise((resolve) => {
    execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', PS1_PATH, ...args], {
      timeout: 180_000,
      maxBuffer: 4 * 1024 * 1024,
      windowsHide: false,
    }, (error, stdout, stderr) => {
      const output = [String(stdout ?? ''), String(stderr ?? '')].filter(Boolean).join('\n').trim()
      resolve({
        ok: error === null,
        output: output.length > 0 ? output : (error !== null ? String(error.message) : '(no output)'),
      })
    })
  })
}

export function apply(ctx: Context): void {
  ctx.effect(() => ctx.webServer.register({
    kind: 'prefix',
    path: API_BASE,
    handler: async (req, res) => {
      if (!isLoopbackRequest(req)) {
        writeError(res, { code: 'forbidden', message: 'only loopback clients may create shortcuts' }, 403)
        return
      }
      if (req.method !== 'POST') {
        writeError(res, { code: 'method-error', message: 'POST only' }, 405)
        return
      }
      const pathname = new URL(req.url ?? '/', 'http://dsh.internal').pathname
      const method = pathname.startsWith(`${API_BASE}/`) ? pathname.slice(API_BASE.length + 1) : undefined
      if (method === undefined || method.includes('/')) {
        writeError(res, { code: 'not-found', message: 'unknown method' }, 404)
        return
      }
      try {
        switch (method) {
          case 'install': {
            if (process.platform !== 'win32') {
              writeOk(res, {
                ok: false,
                output: `this plugin creates Windows desktop shortcuts; current platform is ${process.platform}`,
              })
              return
            }
            const payload = (await readJsonBody(req)) as Record<string, unknown>
            const args: string[] = []
            if (typeof payload.name === 'string' && payload.name !== '') args.push('-Name', payload.name)
            if (typeof payload.command === 'string' && payload.command !== '') args.push('-Command', payload.command)
            if (typeof payload.url === 'string' && payload.url !== '') args.push('-Url', payload.url)
            if (typeof payload.workDir === 'string' && payload.workDir !== '') args.push('-WorkDir', payload.workDir)
            if (args.length === 0) {
              writeError(res, { code: 'bad-request', message: 'at least one of name/command/url/workDir is required' })
              return
            }
            writeOk(res, await runPs1(args))
            return
          }
          case 'status': {
            writeOk(res, {
              platform: process.platform,
              desktop: process.platform === 'win32' ? join(homedir(), 'Desktop') : null,
            })
            return
          }
          default:
            writeError(res, { code: 'not-found', message: `unknown method "${method}"` }, 404)
        }
      } catch (error) {
        writeError(res, {
          code: 'internal',
          message: error instanceof Error ? error.message : String(error),
        }, 500)
      }
    },
  }), 'dsh-desktop-shortcut: json api')
}
