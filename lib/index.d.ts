import type { Context } from './context-types.ts';
/** Plugin identity for cordis.yml rows / the bundle stack. */
export declare const name = "dsh-desktop-shortcut";
/** Services required before mounting. */
export declare const inject: string[];
/** Route prefix of the JSON API. */
export declare const API_BASE = "/plugins/desktop-shortcut/api";
/** One install/status result payload. */
export interface ShortcutResult {
    ok: boolean;
    output: string;
}
export declare function apply(ctx: Context): void;
//# sourceMappingURL=index.d.ts.map