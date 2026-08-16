/**
 * tsdown build for dsh-desktop-launcher.
 *
 * - Host half: compiled by `tsc -p tsconfig.build.json` into `lib/`.
 * - Client half: this config bundles `src/client/index.ts` into
 *   `lib/client.js` as a CJS closure factory registered through the web
 *   shell's module loader, replicating the official DSH client-bundle
 *   preset (packages/client/tsdown.client.ts):
 *
 *     window.__ModuleLoader__.load({
 *       id: "dsh-desktop-launcher",
 *       factory: (require) => { ... return module.exports; }
 *     });
 *
 *   The registered id MUST equal the package.json `name` (client-modules
 *   compose keys on the package name). Module-table entries (react, cordis,
 *   slots) stay external and resolve through the loader at runtime; the
 *   bundle uses `createElement` only (no JSX), so no jsx-runtime external
 *   is needed.
 */
export default [
  {
    entry: { client: 'src/client/index.ts' },
    outDir: 'lib',
    format: 'cjs',
    platform: 'browser',
    dts: false,
    sourcemap: true,
    clean: false,
    deps: {
      neverBundle: [
        'react',
        'react-dom',
        'react-dom/client',
        'cordis',
        '@deepseek-ai/dsh-client-ui-slots',
        '@deepseek-ai/dsh-client-runtime/client',
      ],
    },
    inputOptions: {
      resolve: {
        conditionNames: ['browser', 'import', 'require', 'default'],
      },
    },
    outputOptions: {
      entryFileNames: 'client.js',
      banner: 'window.__ModuleLoader__.load({ id: "dsh-desktop-launcher", factory: (require) => {',
      intro: 'var module = { exports: {} }; var exports = module.exports;',
      footer: 'return module.exports; } });',
      codeSplitting: false,
    },
  },
]
