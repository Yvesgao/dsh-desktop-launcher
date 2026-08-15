/**
 * The Settings section UI: a small form that creates a Windows desktop
 * shortcut through the host API. Written with `createElement` (no JSX) and
 * inline styles only — host global CSS may override injected stylesheets, so
 * everything visual stays inline (see the make-dsh-plugin gotchas).
 */
import { createElement, useState, type ChangeEvent, type CSSProperties, type ReactElement } from 'react'

const API_BASE = '/plugins/desktop-shortcut/api'

interface InstallResult {
  ok: boolean
  output: string
}

const labelStyle: CSSProperties = {
  display: 'block',
  fontSize: '12px',
  color: 'var(--dsh-text-secondary, #8a8f98)',
  margin: '10px 0 4px',
}
const inputStyle: CSSProperties = {
  display: 'block',
  width: '100%',
  boxSizing: 'border-box',
  padding: '6px 10px',
  borderRadius: '6px',
  border: '1px solid var(--dsh-border, #3a3f4a)',
  background: 'var(--dsh-input-bg, #17181d)',
  color: 'var(--dsh-text, #e6e8ec)',
  fontSize: '13px',
  fontFamily: 'inherit',
}
const buttonStyle: CSSProperties = {
  marginTop: '14px',
  padding: '8px 18px',
  borderRadius: '8px',
  border: 'none',
  background: 'var(--dsh-accent, #4f7cff)',
  color: '#fff',
  fontSize: '13px',
  fontWeight: 600,
  cursor: 'pointer',
}
const preStyle: CSSProperties = {
  marginTop: '14px',
  padding: '10px 12px',
  borderRadius: '8px',
  background: 'var(--dsh-code-bg, #101116)',
  border: '1px solid var(--dsh-border, #3a3f4a)',
  color: 'var(--dsh-text, #e6e8ec)',
  fontSize: '12px',
  lineHeight: 1.5,
  whiteSpace: 'pre-wrap',
  wordBreak: 'break-word',
  maxHeight: '240px',
  overflow: 'auto',
}

function field(label: string, value: string, onChange: (v: string) => void, placeholder = ''): ReactElement {
  return createElement('div', null,
    createElement('label', { style: labelStyle }, label),
    createElement('input', {
      style: inputStyle,
      value,
      placeholder,
      onChange: (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
    }),
  )
}

export function ShortcutSection(): ReactElement {
  const [name, setName] = useState('DeepSeek Harness')
  const [command, setCommand] = useState('')
  const [url, setUrl] = useState('http://127.0.0.1:3080')
  const [workDir, setWorkDir] = useState('')
  const [busy, setBusy] = useState(false)
  const [result, setResult] = useState<InstallResult | null>(null)

  async function submit(): Promise<void> {
    setBusy(true)
    setResult(null)
    try {
      const response = await fetch(`${API_BASE}/install`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ name, command, url, workDir }),
      })
      const parsed = (await response.json()) as {
        ok?: boolean
        value?: InstallResult
        error?: { message?: string }
      }
      if (parsed.ok === true && parsed.value !== undefined) {
        setResult({ ok: parsed.value.ok !== false, output: parsed.value.output ?? '' })
      } else {
        setResult({ ok: false, output: parsed.error?.message ?? `HTTP ${response.status}` })
      }
    } catch (error) {
      setResult({ ok: false, output: error instanceof Error ? error.message : String(error) })
    } finally {
      setBusy(false)
    }
  }

  const intro = 'Create a one-click Windows desktop shortcut: the launcher starts the command, waits for the URL, opens your browser, and keeps the console window alive. Leave Command empty to auto-detect the npx-cached DeepSeek Harness CLI.'

  const resultBlock = result === null
    ? null
    : createElement('pre', { style: { ...preStyle, color: result.ok ? 'var(--dsh-text, #e6e8ec)' : '#f2a1a1' } }, result.output)

  return createElement('div', { style: { padding: '4px 0', maxWidth: '560px' } },
    createElement('p', { style: { fontSize: '13px', lineHeight: 1.6, margin: '0 0 6px' } }, intro),
    field('Shortcut / window name', name, setName),
    field('Command (server to run)', command, setCommand, 'e.g. npx --yes @deepseek-ai/dsh web'),
    field('Browser URL when ready', url, setUrl, 'http://127.0.0.1:3080'),
    field('Working directory (optional)', workDir, setWorkDir, 'e.g. C:\\my\\project'),
    createElement('button', {
      style: buttonStyle,
      disabled: busy,
      onClick: () => void submit(),
    }, busy ? 'Creating…' : 'Create desktop shortcut'),
    resultBlock,
  )
}
