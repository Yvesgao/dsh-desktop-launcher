/**
 * dsh-desktop-shortcut client half.
 *
 * Contributes the "Desktop Shortcut" section to the DSH Settings shell and
 * talks to the host JSON API (`/plugins/desktop-shortcut/api`) with plain
 * fetch — no typert codegen needed.
 *
 * The bundle registers through `window.__ModuleLoader__.load({ id, factory })`
 * (built by tsdown); the registered id equals the package name.
 */
import { createElement } from 'react'
import type { Context } from '../context-types.ts'
import { ShortcutSection } from './section.ts'

/** Services required before mounting (client runtime provides slots). */
export const inject = ['slots']

/** Client plugin body: register the Settings section once the shell declares it. */
export function apply(ctx: Context): void {
  ctx.slots.inject('settings.section', () => ctx.slots.register({
    name: 'settings.section',
    id: 'desktop-shortcut',
    order: 200,
    label: () => 'Desktop Shortcut',
    inject: () => ({}),
  }, ShortcutSection))
}
