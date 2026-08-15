<h1 align="center">dsh-desktop-shortcut</h1>

<p align="center">Create a one-click Windows desktop shortcut from the DSH Settings page — launch any local server (DeepSeek Harness, dev servers, npx tools) with a double-click, auto-open the browser, and pin it to the taskbar.</p>

## What it does

Turns "open PowerShell, type a command, then open the browser" into a double-click. From **Settings → Desktop Shortcut** you fill in a small form and the plugin:

1. Generates a `.cmd` launcher — starts the command in a console window, waits for the URL to respond, opens your default browser, and keeps the window open (closing it stops the server). If the server is already running it just opens the browser.
2. Creates a desktop `.lnk` shortcut pointing at the launcher (Node.js icon for DeepSeek Harness).
3. Attempts to pin the shortcut to the taskbar and prints manual fallback steps when the target type cannot be pinned programmatically.

The heavy lifting is done by the bundled, self-contained `assets/New-DesktopShortcut.ps1` (no external dependencies, works standalone too).

## Capabilities

| Capability | Description |
| --- | --- |
| Settings UI | `settings.section` "Desktop Shortcut" with a name / command / URL / workdir form |
| Host JSON API | `POST /plugins/desktop-shortcut/api/install` runs the PowerShell engine, `.../status` reports platform |
| Launcher generation | Port-checked `.cmd` that auto-opens the browser and handles the already-running case |
| Taskbar pin | Best-effort programmatic pin with the always-works "pin the running window" fallback instructions |

## Install (bundle, requires web restart)

```sh
# from a git repo (lib/ committed)
dsh plugin --profile web add github:Yvesgao/dsh-desktop-shortcut#main

# or from npm
dsh plugin --profile web add dsh-desktop-shortcut
```

Restart the web UI (`dsh web`). Then open **Settings → Desktop Shortcut**, fill the form and click **Create desktop shortcut**.

> Windows only — the PowerShell engine is a Windows component. The Settings section appears on all platforms but reports an error when run elsewhere.

## Development

```sh
pnpm install
pnpm build        # tsc (host lib) + tsdown (client bundle lib/client.js)
pnpm typecheck
```

Reference contracts (official plugin development guide + a working community plugin) are collected under [`docs/references/`](docs/references/).

## Plugin management

Manage installed plugins with the plugin-registry **thin console** (browser panel): bundle layer stack + insert rows + enable/disable, no manual config edits.

```sh
dsh plugin --profile web add <plugin-registry>/packages/plugin/console
```

## Screenshot

_Add a screenshot of the Settings section here (`docs/preview/settings.png`) before publishing._

## License

MIT
