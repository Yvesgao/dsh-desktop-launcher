# build-msi.ps1 — rebuilds DeepSeekHarnessSetup.msi + DeepSeekHarnessSetup.exe
# Uses the WiX v4.0.6 CLI extracted from nuget (already downloaded in
# msi-build\downloads + msi-build\nuget-*). Extensions are registered in the
# user cache (~/.wix/extensions). Run from the msi-build directory.
$ErrorActionPreference = 'Stop'
$root = 'E:\My Documents\DskHarness-PC\msi-build'
$wix = Join-Path $root 'nuget-wix.4.0.6\extracted\tools\net6.0\any\wix.exe'
if (-not (Test-Path $wix)) { throw 'WiX v4 CLI not found - extract nuget-wix.4.0.6.nupkg into ' + $root }

# regenerate the wxs from the payload tree (GUIDs persist in guids.txt)
& (Join-Path $root 'generate-wxs.ps1')

# build the product MSI
& $wix build -o (Join-Path $root 'DeepSeekHarnessSetup.msi') (Join-Path $root 'Product.wxs')
if ($LASTEXITCODE -ne 0) { throw "MSI build failed: $LASTEXITCODE" }

# build the Burn bundle (chains Node MSI + our MSI)
& $wix build -o (Join-Path $root 'DeepSeekHarnessSetup.exe') (Join-Path $root 'Bundle.wxs') -ext WixToolset.Bal.wixext -ext WixToolset.Util.wixext
if ($LASTEXITCODE -ne 0) { throw "Bundle build failed: $LASTEXITCODE" }

Write-Host ''
Write-Host '=== DONE ==='
Write-Host ('Bundle : ' + (Join-Path $root 'DeepSeekHarnessSetup.exe') + '  (' + [Math]::Round((Get-Item (Join-Path $root 'DeepSeekHarnessSetup.exe')).Length / 1KB, 0) + ' KB)')
Write-Host ('MSI    : ' + (Join-Path $root 'DeepSeekHarnessSetup.msi') + '  (' + [Math]::Round((Get-Item (Join-Path $root 'DeepSeekHarnessSetup.msi')).Length / 1KB, 0) + ' KB)')
