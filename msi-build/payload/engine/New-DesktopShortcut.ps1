#requires -Version 5.1
<#
.SYNOPSIS
    Creates a Windows desktop shortcut that launches a CLI/server command and
    auto-opens a browser URL once the server is ready.

.DESCRIPTION
    Generates a small .cmd launcher (starts the command in a console window,
    waits for the URL to respond, opens the default browser, keeps the window
    open; if the server is already running it just opens the browser) and a
    desktop .lnk shortcut pointing at it. Attempts to pin the shortcut to the
    taskbar and prints manual fallback instructions when the target type cannot
    be pinned programmatically.

    Defaults target DeepSeek Harness (`dsh web`): the npx-cached dsh.cmd is
    auto-detected when present, otherwise `npx --yes @deepseek-ai/dsh web` runs.

.PARAMETER Name
    Display name of the shortcut and console window title.
    Default: "DeepSeek Harness".

.PARAMETER Command
    Command line to run (the server). Empty = DeepSeek Harness defaults above.
    cmd metacharacters (& | < > ^) are not supported in the generated launcher;
    "%" is escaped automatically.

.PARAMETER Url
    Browser URL opened once the server responds. Default: http://127.0.0.1:3080
    The port is parsed from the URL for the readiness poll and the
    "already running" check.

.PARAMETER WorkDir
    Working directory for the server. Default: current directory.

.PARAMETER LauncherDir
    Folder for the generated .cmd launcher. Default: %LOCALAPPDATA%\Launchers.

.PARAMETER Icon
    Optional icon for the shortcut, e.g. "C:\Program Files\nodejs\node.exe,0".

.PARAMETER NoDesktop
    Write the launcher only; skip the desktop shortcut.

.EXAMPLE
    .\New-DesktopShortcut.ps1
    # DeepSeek Harness, default URL http://127.0.0.1:3080

.EXAMPLE
    .\New-DesktopShortcut.ps1 -Name "My Server" -Command "node server.js" -Url "http://127.0.0.1:9000" -WorkDir "C:\apps\server"
#>
[CmdletBinding()]
param(
    [string]$Name = 'DeepSeek Harness',
    [string]$Command = '',
    [string]$Url = 'http://127.0.0.1:3080',
    [string]$WorkDir = '',
    [string]$LauncherDir = '',
    [string]$Icon = '',
    [switch]$NoDesktop
)

$ErrorActionPreference = 'Stop'

if ([string]::IsNullOrWhiteSpace($WorkDir)) { $WorkDir = (Get-Location).Path }
if ([string]::IsNullOrWhiteSpace($LauncherDir)) { $LauncherDir = Join-Path $env:LOCALAPPDATA 'Launchers' }
if (-not (Test-Path $LauncherDir)) { New-Item -ItemType Directory -Path $LauncherDir -Force | Out-Null }

# --- default command: detect the npx-cached DeepSeek Harness CLI ------------
if ([string]::IsNullOrWhiteSpace($Command)) {
    $cached = Get-ChildItem "$env:LOCALAPPDATA\npm-cache\_npx\*\node_modules\.bin\dsh.cmd" -ErrorAction SilentlyContinue |
        Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($null -ne $cached) {
        $Command = '"' + $cached.FullName + '" web'
        if ([string]::IsNullOrWhiteSpace($Icon)) {
            $node = Get-Command node.exe -ErrorAction SilentlyContinue
            if ($null -ne $node) { $Icon = $node.Source + ',0' }
        }
    } else {
        $Command = 'npx --yes @deepseek-ai/dsh web'
    }
}

# --- parse the port from the URL -------------------------------------------
$port = ''
$m = [regex]::Match($Url, ':(\d+)')
if ($m.Success) { $port = $m.Groups[1].Value }

# --- launcher template (single-quoted here-string: no interpolation) -------
$template = @'
@echo off
setlocal EnableExtensions
title __TITLE__

set "WORKDIR=__WORKDIR__"
cd /d "%WORKDIR%"

__NPXCHECK__

__PORTCHECK__

echo.
echo  Starting __TITLE__ ...
echo  URL: __URL__
echo  Keep this window open while you use it; closing it stops the server.
echo.

start "__TITLE__ - browser" /min powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddMinutes(6); $ok=$false; while((Get-Date) -lt $deadline -and -not $ok){ try{ $r=Invoke-WebRequest -Uri '__URL__' -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -lt 500){$ok=$true} }catch{}; if(-not $ok){Start-Sleep -Seconds 2} }; if($ok){ Start-Process '__URL__' }"

call __COMMAND__

:stopped
echo.
echo  Server stopped. You can close this window.
echo.
pause
exit /b 0

:alreadyrunning
echo.
echo  __TITLE__ is already running at __URL__
start "" __URL__
pause
exit /b 0
'@

$npxCheck = ''
if ($Command -match '\bnpx\b') {
    $npxCheck = @'
where npx >nul 2>nul
if errorlevel 1 (
    echo [ERROR] npx was not found in PATH.
    echo Install Node.js from https://nodejs.org and try again.
    echo.
    pause
    exit /b 1
)
'@
}

$portCheck = ''
if ($port) {
    $portCheck = @'
powershell -NoProfile -ExecutionPolicy Bypass -Command "$c=New-Object Net.Sockets.TcpClient; try{$c.Connect('127.0.0.1',__PORT__); exit 0}catch{exit 1}"
if not errorlevel 1 goto :alreadyrunning
'@
    $portCheck = $portCheck.Replace('__PORT__', $port)
}

$cmdEscaped = $Command -replace '%', '%%'

$content = $template.Replace('__TITLE__', $Name).Replace('__WORKDIR__', $WorkDir).Replace('__URL__', $Url).Replace('__COMMAND__', $cmdEscaped).Replace('__NPXCHECK__', $npxCheck).Replace('__PORTCHECK__', $portCheck)

# normalize to CRLF so cmd.exe parses labels/goto reliably
$content = $content -replace "`r`n", "`n" -replace "`n", "`r`n"

$launcherPath = Join-Path $LauncherDir ($Name + '-launcher.cmd')
[System.IO.File]::WriteAllText($launcherPath, $content)
Write-Host ('Launcher written: ' + $launcherPath)

if ($NoDesktop) {
    Write-Host 'NoDesktop set - desktop shortcut skipped.'
    return
}

# --- create the desktop shortcut -------------------------------------------
$desktop = [Environment]::GetFolderPath('Desktop')
$lnkPath = Join-Path $desktop ($Name + '.lnk')
$ws = New-Object -ComObject WScript.Shell
$lnk = $ws.CreateShortcut($lnkPath)
$lnk.TargetPath = "$env:SystemRoot\System32\cmd.exe"
$lnk.Arguments = '/c ""' + $launcherPath + '""'
$lnk.WorkingDirectory = $WorkDir
if ($Icon) { $lnk.IconLocation = $Icon }
$lnk.Description = 'Start ' + $Name + ' (opens ' + $Url + ')'
$lnk.Save()
Write-Host ('Shortcut created : ' + $lnkPath)
Write-Host ('Target           : ' + $lnk.TargetPath + ' ' + $lnk.Arguments)

# --- try to pin to the taskbar (may be unavailable for console targets) -----
$pinned = $false
try {
    $shell = New-Object -ComObject Shell.Application
    $folder = $shell.Namespace([System.IO.Path]::GetDirectoryName($lnkPath))
    $item = $folder.ParseName([System.IO.Path]::GetFileName($lnkPath))
    $verbs = @($item.Verbs() | ForEach-Object { $_.Name })
    $pinVerb = $verbs | Where-Object { $_ -match 'pin to .?taskbar|固定到任务栏' } | Select-Object -First 1
    if ($pinVerb) {
        $item.InvokeVerb($pinVerb)
        Start-Sleep -Seconds 1
        $pinned = $true
        Write-Host ('Taskbar pin        : OK (verb "' + $pinVerb + '")')
    } else {
        Write-Host 'Taskbar pin        : not available for this shortcut (cmd/console targets cannot be pinned programmatically on Windows 10/11)'
    }
} catch {
    Write-Host ('Taskbar pin        : failed - ' + $_.Exception.Message)
}

if (-not $pinned) {
    Write-Host ''
    Write-Host 'Manual pin (always works):'
    Write-Host '  1. Double-click the shortcut once and wait for the server window.'
    Write-Host '  2. Right-click its taskbar button -> Pin to taskbar (固定到任务栏).'
    Write-Host '  The pinned button relaunches the launcher from now on.'
}

Write-Host ''
Write-Host ('Done. Double-click "' + $Name + '" on the desktop to start.')
Write-Host 'Note: keep the launcher console window open while using the app; closing it stops the server.'
