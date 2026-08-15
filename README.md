<h1 align="center">dsh-desktop-shortcut</h1>

<p align="center">在 DSH 设置页一键创建 Windows 桌面快捷方式 —— 把任意本地服务（DeepSeek Harness、开发服务器、npx 工具）变成双击启动的桌面图标，自动打开浏览器，还能固定到任务栏。</p>

## 功能

把「打开 PowerShell → 敲命令 → 再开浏览器」变成双击一下。在 **设置 → Desktop Shortcut** 里填一个小表单，插件自动完成：

1. **生成 `.cmd` 启动器** —— 在控制台窗口里启动命令、等 URL 就绪后自动打开默认浏览器、保持窗口存活（关窗即停服）；服务已在运行则直接打开浏览器。
2. **创建桌面 `.lnk` 快捷方式** —— 指向启动器（DeepSeek Harness 用 Node.js 图标）。
3. **尝试固定到任务栏** —— 目标类型无法程序化固定时，打印「固定运行中窗口」的兜底指引（永远有效）。

核心逻辑由打包内置的、自包含的 `assets/New-DesktopShortcut.ps1` 完成（零外部依赖，也可独立运行）。

## 能力清单

| 能力 | 说明 |
| --- | --- |
| 设置页 UI | `settings.section`「Desktop Shortcut」：名称 / 命令 / URL / 工作目录表单 |
| Host JSON API | `POST /plugins/desktop-shortcut/api/install` 执行 PowerShell 引擎；`.../status` 上报平台 |
| 启动器生成 | 带端口检查的 `.cmd`，自动开浏览器，兼容「已在运行」场景 |
| 任务栏固定 | 尽力程序化固定 + 「固定运行中窗口」兜底指引 |

## 安装（bundle 形态，需重启 web）

```sh
# git 源（lib/ 已入库）
dsh plugin --profile web add github:Yvesgao/dsh-desktop-shortcut#main

# 或 npm
dsh plugin --profile web add dsh-desktop-shortcut
```

重启 web（`dsh web`）后，打开 **设置 → Desktop Shortcut**，填好表单点 **Create desktop shortcut** 即可。

> 仅支持 Windows —— PowerShell 引擎是 Windows 组件。设置页在所有平台都会出现，但在非 Windows 平台会报错提示。

## 开发

```sh
pnpm install
pnpm build        # tsc（host lib）+ tsdown（client bundle lib/client.js）
pnpm typecheck
```

官方插件开发契约与可参考的社区插件源码已收集在 [`docs/references/`](docs/references/)。

## 插件管理

已装插件推荐用 plugin-registry 的**薄控制台**管理（浏览器面板）：bundle 层栈 + insert 行 + 启停，无需手改配置。

```sh
dsh plugin --profile web add <plugin-registry>/packages/plugin/console
```

## 截图

_发布前在此补充设置页截图（`docs/preview/settings.png`）。_

## License

MIT

---

# English

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
