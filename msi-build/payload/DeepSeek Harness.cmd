@echo off
rem ============================================================
rem  DeepSeek Harness launcher (installed by the MSI)
rem  First run: installs dsh CLI, registers the bundled plugin,
rem  creates the desktop shortcut, then starts the server.
rem ============================================================
title DeepSeek Harness
setlocal EnableExtensions
cd /d "%USERPROFILE%"

set "APP_DIR=%~dp0"
set "SETUP_FLAG=%LOCALAPPDATA%\DeepSeekHarness\.setup-done"

if not exist "%SETUP_FLAG%" (
    echo.
    echo  [首次运行] 正在配置 DeepSeek Harness，需要联网，请稍候...
    echo.
    where npx >nul 2>nul
    if errorlevel 1 (
        echo  [错误] 未找到 Node.js/npx。请先安装 Node.js 后再运行。
        pause
        exit /b 1
    )
    rem --- 1. 全局安装 dsh CLI（best effort，便于后续使用）---
    call npm.cmd install -g @deepseek-ai/dsh --no-audit --no-fund --loglevel=error

    rem --- 2. 注册内置插件到 web profile（best effort）---
    if exist "%APP_DIR%plugin\package.json" (
        call npx.cmd --yes @deepseek-ai/dsh plugin --profile web add "%APP_DIR%plugin"
    )

    rem --- 3. 生成桌面快捷方式（核心功能）---
    if exist "%APP_DIR%engine\New-DesktopShortcut.ps1" (
        powershell -NoProfile -ExecutionPolicy Bypass -File "%APP_DIR%engine\New-DesktopShortcut.ps1" -Name "DeepSeek Harness" -Url "http://127.0.0.1:3080"
    )

    mkdir "%LOCALAPPDATA%\DeepSeekHarness" 2>nul
    echo done> "%SETUP_FLAG%"
    echo.
    echo  [配置完成] 桌面上已生成「DeepSeek Harness」图标，正在启动...
    echo.
)

rem --- 启动：优先用生成的智能启动器，否则直接 npx ---
if exist "%LOCALAPPDATA%\Launchers\DeepSeek Harness-launcher.cmd" (
    call "%LOCALAPPDATA%\Launchers\DeepSeek Harness-launcher.cmd"
    exit /b 0
)

where npx >nul 2>nul
if errorlevel 1 (
    echo  [错误] 未找到 Node.js/npx。
    pause
    exit /b 1
)

echo.
echo  正在启动 DeepSeek Harness ...
echo  首次启动可能需要下载组件，请稍候。保持此窗口打开。
echo.

start "DeepSeek Harness - browser" /min powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddMinutes(6); $ok=$false; while((Get-Date) -lt $deadline -and -not $ok){ try{ $r=Invoke-WebRequest -Uri 'http://127.0.0.1:3080' -UseBasicParsing -TimeoutSec 2; if($r.StatusCode -lt 500){$ok=$true} }catch{}; if(-not $ok){Start-Sleep -Seconds 2} }; if($ok){ Start-Process 'http://127.0.0.1:3080' }"

npx --yes @deepseek-ai/dsh web

echo.
echo  服务已停止，可以关闭此窗口。
pause
exit /b 0
