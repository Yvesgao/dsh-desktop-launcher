/**
 * Context augmentation for dsh-desktop-shortcut.
 *
 * The plugin consumes the host `webServer` service (route registration) and,
 * on the client, the `slots` service (settings.section). Only the members
 * this plugin actually touches are declared; the declaration merges into the
 * cordis `Context` interface so both halves share one typed context.
 */
import type { Context as CordisContext } from '@deepseek-ai/cordis'
import type { IncomingMessage, ServerResponse } from 'node:http'

/** One `webServer.register` route (the only route kind this plugin uses). */
export interface WebServerRoute {
  kind: 'prefix'
  path: string
  handler: (req: IncomingMessage, res: ServerResponse) => unknown
}

declare module '@deepseek-ai/cordis' {
  interface Context {
    /** Host web server route registry (provided by the web runtime). */
    webServer: {
      register(route: WebServerRoute): () => void
    }
  }
}

export type Context = CordisContext
