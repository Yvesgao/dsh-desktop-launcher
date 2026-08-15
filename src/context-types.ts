/**
 * Structural types for the cordis services this plugin consumes, plus the
 * Context augmentation both halves share.
 *
 * A third-party plugin resolves outside the DSH monorepo's single cordis
 * instance, so the upstream `declare module` augmentations do not reach this
 * Context. The members below mirror the actual runtime shapes this plugin
 * touches:
 *
 * - webServer: @deepseek-ai/dsh-host-webserver (the WebServer route registry)
 * - slots: the client runtime SlotRegistry (settings.section registration)
 * - effect: the DSH-vendored cordis lifecycle helper (already present on the
 *   vendored Context; declared here only for the plain-cordis scope)
 *
 * This file must stay FREE of Node.js types (`node:http`, `node:stream`,
 * `Buffer`): it is part of the CLIENT-reachable declaration graph, so the
 * request/response faces below are structural mirrors with plain interfaces.
 */
import type { Context as CordisContext } from '@deepseek-ai/cordis'

/** Request face route handlers see (structural subset of node's IncomingMessage). */
export interface HttpRequest {
  url?: string
  method?: string
  headers: Record<string, string | string[] | undefined>
  [Symbol.asyncIterator](): AsyncIterator<string | Uint8Array>
}

/** Response face route handlers write to (structural subset of node's ServerResponse). */
export interface HttpResponse {
  statusCode: number
  writeHead(status: number, headers?: Record<string, string>): void
  end(body?: string | Uint8Array): void
}

/** One named webServer route (mirror of the host-webserver WebRoute). */
export interface WebServerRoute {
  kind: 'exact' | 'prefix'
  path: string
  handler: (req: HttpRequest, res: HttpResponse) => unknown
}

/** The webServer service face this plugin uses. */
export interface WebServerService {
  register(route: WebServerRoute): () => void
}

/** Registration options passed to `ctx.slots.register` (subset of the real options). */
export interface SlotRegisterOptions {
  name: string
  key?: string
  id?: string
  order?: number
  label?: string | (() => string)
  /** Chain routing selector (returns the matched value, or null to pass on). */
  select?: (owner: unknown) => unknown
  priority?: number
  locale?: string
  registrant?: string
  /** Business-face factory; args depend on the slot scope. */
  inject?: (...args: any[]) => Record<string, unknown>
  children?: Record<string, unknown>
}

/** The client slots service face (register returns the disposer). */
export interface SlotsService {
  register(options: SlotRegisterOptions, component: unknown): () => void
  /**
   * Run a callback for each declaration lifetime of a slot (the runtime
   * SlotRegistry.inject): a no-op while the slot is undeclared, so the
   * settings section registration waits for the settings shell.
   */
  inject(key: string, callback: () => () => void): () => void
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Host web server route registry (provided by the web runtime). */
    webServer: WebServerService
    /** Client slot registry (provided by the client runtime). */
    slots: SlotsService
  }
}

export type Context = CordisContext
