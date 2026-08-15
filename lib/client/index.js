import { ShortcutSection } from "./section.js";
/** Services required before mounting (client runtime provides slots). */
export const inject = ['slots'];
/** Client plugin body: register the Settings section once the shell declares it. */
export function apply(ctx) {
    ctx.slots.inject('settings.section', () => ctx.slots.register({
        name: 'settings.section',
        id: 'desktop-shortcut',
        order: 200,
        label: () => 'Desktop Shortcut',
        inject: () => ({}),
    }, ShortcutSection));
}
//# sourceMappingURL=index.js.map