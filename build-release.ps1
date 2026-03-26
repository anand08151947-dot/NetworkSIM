#Requires -Version 5.1
<#
.SYNOPSIS
    Builds NorthStar Fiber Simulator Electron app for a given version.

.DESCRIPTION
    Updates package.json version, runs the Electron build, and reports output artifacts.

.PARAMETER Version
    Semantic version to build (e.g. 3.0.0, 4.0.0). Major.Minor only (e.g. 3.0) is also accepted.

.EXAMPLE
    .\build-release.ps1 -Version 3.0.0
    .\build-release.ps1 3.0
#>
param(
    [Parameter(Mandatory = $true, Position = 0)]
    [ValidatePattern('^\d+\.\d+(\.\d+)?$')]
    [string]$Version
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Normalise to Major.Minor.Patch
if ($Version -match '^\d+\.\d+$') { $Version = "$Version.0" }

$Root      = $PSScriptRoot
$PkgFile   = Join-Path $Root 'package.json'
$OutDir    = Join-Path $Root 'dist-electron'

Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  NorthStar Fiber Simulator — Release Build" -ForegroundColor Cyan
Write-Host "  Version : $Version" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Bump version in package.json ─────────────────────────────────────
Write-Host "[1/3] Updating package.json version..." -ForegroundColor Yellow
$pkg = Get-Content $PkgFile -Raw | ConvertFrom-Json
$oldVersion = $pkg.version
if ($oldVersion -eq $Version) {
    Write-Warning "package.json is already at $Version — continuing anyway."
} else {
    (Get-Content $PkgFile -Raw) -replace `
        '"version"\s*:\s*"[^"]*"', `
        "`"version`": `"$Version`"" |
        Set-Content $PkgFile -Encoding UTF8
    Write-Host "    $oldVersion  →  $Version" -ForegroundColor Green
}

# ── Step 2: Run electron build ────────────────────────────────────────────────
Write-Host ""
Write-Host "[2/3] Building (vite + electron-builder --win)..." -ForegroundColor Yellow
Push-Location $Root
try {
    npm run electron:build
    if ($LASTEXITCODE -ne 0) { throw "electron:build failed with exit code $LASTEXITCODE" }
} finally {
    Pop-Location
}

# ── Step 3: Report artifacts ──────────────────────────────────────────────────
Write-Host ""
Write-Host "[3/3] Build artifacts:" -ForegroundColor Yellow
$artifacts = Get-ChildItem $OutDir -Filter "*.exe" |
    Where-Object { $_.Name -like "*$Version*" } |
    Select-Object Name, @{N='Size (MB)'; E={ [math]::Round($_.Length / 1MB, 1) }}, LastWriteTime

if ($artifacts) {
    $artifacts | Format-Table -AutoSize
} else {
    Write-Warning "No .exe files matching version $Version found in $OutDir"
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "  ✅  Done!  Artifacts in: $OutDir" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
