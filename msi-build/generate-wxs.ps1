# Generates Product.wxs + Bundle.wxs for the DeepSeek Harness MSI.
# GUIDs are generated once and persisted (stable across rebuilds).
$ErrorActionPreference = 'Stop'
$root = 'E:\My Documents\DskHarness-PC\msi-build'
$payload = Join-Path $root 'payload'
$guidFile = Join-Path $root 'guids.txt'

# ---- persistent GUIDs ----
$guids = @{}
if (Test-Path $guidFile) {
  Get-Content $guidFile | ForEach-Object {
    $p = $_ -split '='
    if ($p.Count -eq 2) { $guids[$p[0]] = $p[1] }
  }
}
function Get-Guid([string]$key) {
  if (-not $guids.ContainsKey($key)) { $guids[$key] = [guid]::NewGuid().ToString().ToUpper() }
  return $guids[$key]
}

# ---- walk payload -> directories with files ----
$dirs = @{}
function Collect-Dir([string]$abs, [string]$rel) {
  foreach ($item in Get-ChildItem $abs) {
    if ($item.PSIsContainer) { Collect-Dir $item.FullName "$rel\$($item.Name)" }
    else {
      if (-not $dirs.ContainsKey($rel)) { $dirs[$rel] = @() }
      $dirs[$rel] += $item.FullName
    }
  }
}
Collect-Dir $payload ''

function Comp-Id([string]$rel) { 'C_' + ($rel -replace '[^A-Za-z0-9]', '_') }
function Dir-Id([string]$rel) { 'D_' + ($rel -replace '[^A-Za-z0-9]', '_') }

$lines = New-Object System.Collections.Generic.List[string]
$lines.Add('<?xml version="1.0" encoding="UTF-8"?>')
$lines.Add('<Wix xmlns="http://wixtoolset.org/schemas/v4/wxs">')
$lines.Add('  <Package Name="DeepSeek Harness" Manufacturer="dsh-desktop-launcher" Version="0.1.0" UpgradeCode="' + (Get-Guid 'UpgradeCode') + '" Scope="perMachine" Language="1033">')
$lines.Add('    <MajorUpgrade DowngradeErrorMessage="A newer version of DeepSeek Harness is already installed." />')
$lines.Add('    <MediaTemplate EmbedCab="yes" />')
$lines.Add('    <StandardDirectory Id="ProgramFiles64Folder">')
$lines.Add('      <Directory Id="INSTALLDIR" Name="DeepSeek Harness">')
foreach ($rel in ($dirs.Keys | Sort-Object)) {
  if ($rel -eq '') { continue }
  $lines.Add('        <Directory Id="' + (Dir-Id $rel) + '" Name="' + (Split-Path $rel -Leaf) + '" />')
}
$lines.Add('      </Directory>')
$lines.Add('    </StandardDirectory>')
$lines.Add('    <StandardDirectory Id="ProgramMenuFolder">')
$lines.Add('      <Directory Id="ProgramMenuDir" Name="DeepSeek Harness" />')
$lines.Add('    </StandardDirectory>')
$lines.Add('    <StandardDirectory Id="DesktopFolder" />')

$lines.Add('    <Feature Id="Main" Title="DeepSeek Harness" Level="1">')
$lines.Add('      <ComponentGroupRef Id="PayloadFiles" />')
$lines.Add('      <ComponentGroupRef Id="StartMenuFiles" />')
$lines.Add('      <ComponentGroupRef Id="DesktopFiles" />')
$lines.Add('    </Feature>')
$lines.Add('    <ComponentGroup Id="PayloadFiles">')
foreach ($rel in ($dirs.Keys | Sort-Object)) {
  $lines.Add('      <ComponentRef Id="' + (Comp-Id $rel) + '" />')
}
$lines.Add('    </ComponentGroup>')
$lines.Add('    <ComponentGroup Id="StartMenuFiles">')
$lines.Add('      <ComponentRef Id="StartMenuShortcut" />')
$lines.Add('    </ComponentGroup>')
$lines.Add('    <ComponentGroup Id="DesktopFiles">')
$lines.Add('      <ComponentRef Id="DesktopShortcut" />')
$lines.Add('    </ComponentGroup>')

$i = 0
foreach ($rel in ($dirs.Keys | Sort-Object)) {
  $refId = if ($rel -eq '') { 'INSTALLDIR' } else { Dir-Id $rel }
  $lines.Add('    <DirectoryRef Id="' + $refId + '">')
  $lines.Add('      <Component Id="' + (Comp-Id $rel) + '" Guid="' + (Get-Guid ('c' + $i)) + '">')
  $first = $true
  foreach ($f in $dirs[$rel]) {
    $kp = if ($first) { ' KeyPath="yes"' } else { '' }
    $relPath = $f.Substring($payload.Length + 1)
    $lines.Add('        <File Id="F_' + $i + '" Source="payload\' + $relPath + '"' + $kp + ' />')
    $first = $false
    $i++
  }
  $lines.Add('      </Component>')
  $lines.Add('    </DirectoryRef>')
}
$lines.Add('    <DirectoryRef Id="ProgramMenuDir">')
$lines.Add('      <Component Id="StartMenuShortcut" Guid="' + (Get-Guid 'cStartMenu') + '">')
$lines.Add('        <Shortcut Id="StartMenuShortcutLnk" Name="DeepSeek Harness" Description="Launch DeepSeek Harness web UI" Target="[INSTALLDIR]DeepSeek Harness.cmd" WorkingDirectory="INSTALLDIR" />')
$lines.Add('        <RemoveFolder Id="RemoveProgramMenuDir" On="uninstall" />')
$lines.Add('        <RegistryValue Root="HKCU" Key="Software\DeepSeekHarness" Name="installed" Type="integer" Value="1" KeyPath="yes" />')
$lines.Add('      </Component>')
$lines.Add('    </DirectoryRef>')
$lines.Add('    <StandardDirectory Id="DesktopFolder">')
$lines.Add('      <Component Id="DesktopShortcut" Guid="' + (Get-Guid 'cDesktop') + '">')
$lines.Add('        <Shortcut Id="DesktopShortcutLnk" Name="DeepSeek Harness" Description="Launch DeepSeek Harness web UI" Target="[INSTALLDIR]DeepSeek Harness.cmd" WorkingDirectory="INSTALLDIR" />')
$lines.Add('        <RegistryValue Root="HKCU" Key="Software\DeepSeekHarness" Name="desktop" Type="integer" Value="1" KeyPath="yes" />')
$lines.Add('      </Component>')
$lines.Add('    </StandardDirectory>')

$lines.Add('  </Package>')
$lines.Add('</Wix>')
[System.IO.File]::WriteAllLines((Join-Path $root 'Product.wxs'), $lines, (New-Object System.Text.UTF8Encoding $true))

$lines2 = New-Object System.Collections.Generic.List[string]
$lines2.Add('<?xml version="1.0" encoding="UTF-8"?>')
$lines2.Add('<Wix xmlns="http://wixtoolset.org/schemas/v4/wxs" xmlns:bal="http://wixtoolset.org/schemas/v4/wxs/bal" xmlns:util="http://wixtoolset.org/schemas/v4/wxs/util">')
$lines2.Add('  <Bundle Name="DeepSeek Harness Setup" Version="0.1.0" Manufacturer="dsh-desktop-launcher" UpgradeCode="' + (Get-Guid 'BundleUpgradeCode') + '">')
$lines2.Add('    <BootstrapperApplication>')
$lines2.Add('      <bal:WixStandardBootstrapperApplication Theme="rtfLicense" LicenseFile="license.rtf" />')
$lines2.Add('    </BootstrapperApplication>')
$lines2.Add('    <util:RegistrySearch Id="NodeDetect" Root="HKLM" Key="SOFTWARE\Node.js" Variable="NodeDetected" />')
$lines2.Add('    <Chain>')
$lines2.Add('      <MsiPackage SourceFile="downloads\node-v24.19.0-x64.msi" Vital="yes" Permanent="yes" />')
$lines2.Add('      <MsiPackage SourceFile="DeepSeekHarnessSetup.msi" Vital="yes" />')
$lines2.Add('    </Chain>')
$lines2.Add('  </Bundle>')
$lines2.Add('</Wix>')
[System.IO.File]::WriteAllLines((Join-Path $root 'Bundle.wxs'), $lines2, (New-Object System.Text.UTF8Encoding $true))

$guids.GetEnumerator() | Sort-Object Name | ForEach-Object { "$($_.Name)=$($_.Value)" } | Set-Content $guidFile
Write-Host ('Product.wxs: ' + (Get-Item (Join-Path $root 'Product.wxs')).Length + ' bytes, dirs=' + $dirs.Count + ', files=' + $i)
Write-Host ('Bundle.wxs: ' + (Get-Item (Join-Path $root 'Bundle.wxs')).Length + ' bytes')
