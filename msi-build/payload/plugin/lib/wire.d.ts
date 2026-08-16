/**
 * Minimal JSON wire helpers for the plugin's HTTP API, mirroring the shapes
 * the official plugins use: `{ ok: true, value }` on success and
 * `{ ok: false, error: { code, message } }` on failure.
 *
 * Typed against the structural request/response faces from context-types.ts
 * (host-only file, but keeping one type language avoids casts at the route
 * boundary).
 */
import type { HttpRequest, HttpResponse } from './context-types.ts';
/**
 * Loopback fence for the plugin API: creating a shortcut on the host is a
 * privileged action, so only requests whose Host header resolves to the
 * local machine are served. The web app is normally opened at
 * http://127.0.0.1:3080, so its own requests pass.
 */
export declare function isLoopbackRequest(req: HttpRequest): boolean;
export declare function writeJson(res: HttpResponse, status: number, body: unknown): void;
export declare function writeOk(res: HttpResponse, value: unknown): void;
export declare function writeError(res: HttpResponse, error: {
    code?: string;
    message: string;
}, status?: number): void;
export declare function readJsonBody(req: HttpRequest): Promise<unknown>;
//# sourceMappingURL=wire.d.ts.map