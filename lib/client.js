window.__ModuleLoader__.load({
	id: "dsh-desktop-shortcut",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		//#region src/client/section.ts
		/**
		* The Settings section UI: a small form that creates a Windows desktop
		* shortcut through the host API. Written with `createElement` (no JSX) and
		* inline styles only — host global CSS may override injected stylesheets, so
		* everything visual stays inline (see the make-dsh-plugin gotchas).
		*/
		const API_BASE = "/plugins/desktop-shortcut/api";
		const labelStyle = {
			display: "block",
			fontSize: "12px",
			color: "var(--dsh-text-secondary, #8a8f98)",
			margin: "10px 0 4px"
		};
		const inputStyle = {
			display: "block",
			width: "100%",
			boxSizing: "border-box",
			padding: "6px 10px",
			borderRadius: "6px",
			border: "1px solid var(--dsh-border, #3a3f4a)",
			background: "var(--dsh-input-bg, #17181d)",
			color: "var(--dsh-text, #e6e8ec)",
			fontSize: "13px",
			fontFamily: "inherit"
		};
		const buttonStyle = {
			marginTop: "14px",
			padding: "8px 18px",
			borderRadius: "8px",
			border: "none",
			background: "var(--dsh-accent, #4f7cff)",
			color: "#fff",
			fontSize: "13px",
			fontWeight: 600,
			cursor: "pointer"
		};
		const preStyle = {
			marginTop: "14px",
			padding: "10px 12px",
			borderRadius: "8px",
			background: "var(--dsh-code-bg, #101116)",
			border: "1px solid var(--dsh-border, #3a3f4a)",
			color: "var(--dsh-text, #e6e8ec)",
			fontSize: "12px",
			lineHeight: 1.5,
			whiteSpace: "pre-wrap",
			wordBreak: "break-word",
			maxHeight: "240px",
			overflow: "auto"
		};
		function field(label, value, onChange, placeholder = "") {
			return (0, react.createElement)("div", null, (0, react.createElement)("label", { style: labelStyle }, label), (0, react.createElement)("input", {
				style: inputStyle,
				value,
				placeholder,
				onChange: (event) => onChange(event.target.value)
			}));
		}
		function ShortcutSection() {
			const [name, setName] = (0, react.useState)("DeepSeek Harness");
			const [command, setCommand] = (0, react.useState)("");
			const [url, setUrl] = (0, react.useState)("http://127.0.0.1:3080");
			const [workDir, setWorkDir] = (0, react.useState)("");
			const [busy, setBusy] = (0, react.useState)(false);
			const [result, setResult] = (0, react.useState)(null);
			async function submit() {
				setBusy(true);
				setResult(null);
				try {
					const response = await fetch(`${API_BASE}/install`, {
						method: "POST",
						headers: { "content-type": "application/json" },
						body: JSON.stringify({
							name,
							command,
							url,
							workDir
						})
					});
					const parsed = await response.json();
					if (parsed.ok === true && parsed.value !== void 0) setResult({
						ok: parsed.value.ok !== false,
						output: parsed.value.output ?? ""
					});
					else setResult({
						ok: false,
						output: parsed.error?.message ?? `HTTP ${response.status}`
					});
				} catch (error) {
					setResult({
						ok: false,
						output: error instanceof Error ? error.message : String(error)
					});
				} finally {
					setBusy(false);
				}
			}
			const intro = "Create a one-click Windows desktop shortcut: the launcher starts the command, waits for the URL, opens your browser, and keeps the console window alive. Leave Command empty to auto-detect the npx-cached DeepSeek Harness CLI.";
			const resultBlock = result === null ? null : (0, react.createElement)("pre", { style: {
				...preStyle,
				color: result.ok ? "var(--dsh-text, #e6e8ec)" : "#f2a1a1"
			} }, result.output);
			return (0, react.createElement)("div", { style: {
				padding: "4px 0",
				maxWidth: "560px"
			} }, (0, react.createElement)("p", { style: {
				fontSize: "13px",
				lineHeight: 1.6,
				margin: "0 0 6px"
			} }, intro), field("Shortcut / window name", name, setName), field("Command (server to run)", command, setCommand, "e.g. npx --yes @deepseek-ai/dsh web"), field("Browser URL when ready", url, setUrl, "http://127.0.0.1:3080"), field("Working directory (optional)", workDir, setWorkDir, "e.g. C:\\my\\project"), (0, react.createElement)("button", {
				style: buttonStyle,
				disabled: busy,
				onClick: () => void submit()
			}, busy ? "Creating…" : "Create desktop shortcut"), resultBlock);
		}
		//#endregion
		//#region src/client/index.ts
		/** Services required before mounting (client runtime provides slots). */
		const inject = ["slots"];
		/** Client plugin body: register the Settings section once the shell declares it. */
		function apply(ctx) {
			ctx.slots.inject("settings.section", () => ctx.slots.register({
				name: "settings.section",
				id: "desktop-shortcut",
				order: 200,
				label: () => "Desktop Shortcut",
				inject: () => ({})
			}, ShortcutSection));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});

//# sourceMappingURL=client.js.map