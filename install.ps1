# ================================================================
#  install.ps1 -- North Star Fiber - Dependency Installer
#
#  Usage:
#    .\install.ps1          # install / update packages
#    .\install.ps1 -Clean   # delete node_modules then reinstall
# ================================================================
param(
    [switch]$Clean
)

$ErrorActionPreference = "Stop"

Write-Host ""
Write-Host "  * NORTH STAR FIBER -- Dependency Installer" -ForegroundColor Cyan
Write-Host "  -----------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# ----------------------------------------------------------------
# Step 1: Verify Node.js
# ----------------------------------------------------------------
Write-Host "  [1/5] Checking Node.js..." -ForegroundColor Yellow
try {
    $nodeVer = node --version
    Write-Host "        Node.js $nodeVer detected." -ForegroundColor Green
} catch {
    Write-Host "  FAIL: Node.js not found." -ForegroundColor Red
    Write-Host "        Install from: https://nodejs.org  (v18 minimum, v22 recommended)" -ForegroundColor Red
    exit 1
}

$nodeMajor = [int](($nodeVer -replace "v", "") -split "\.")[0]
if ($nodeMajor -lt 18) {
    Write-Host "  FAIL: Node.js $nodeVer is too old. Minimum required: v18. Recommended: v22." -ForegroundColor Red
    exit 1
}

# ----------------------------------------------------------------
# Step 2: Verify npm
# ----------------------------------------------------------------
Write-Host "  [2/5] Checking npm..." -ForegroundColor Yellow
$npmVer = npm --version
Write-Host "        npm $npmVer detected." -ForegroundColor Green

# ----------------------------------------------------------------
# Step 3: Optional clean
# ----------------------------------------------------------------
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

if ($Clean) {
    Write-Host "  [3/5] -Clean flag set -- removing node_modules and package-lock.json..." -ForegroundColor Yellow
    if (Test-Path "node_modules") {
        Write-Host "        Deleting node_modules (this may take 30-60 seconds)..." -ForegroundColor DarkYellow
        Remove-Item -Recurse -Force "node_modules"
        Write-Host "        node_modules removed." -ForegroundColor Green
    }
    if (Test-Path "package-lock.json") {
        Remove-Item -Force "package-lock.json"
        Write-Host "        package-lock.json removed." -ForegroundColor DarkGray
    }
} else {
    Write-Host "  [3/5] Skipping clean (use -Clean for a completely fresh install)." -ForegroundColor DarkGray
}

# ----------------------------------------------------------------
# Step 4: npm install
# ----------------------------------------------------------------
Write-Host "  [4/5] Running npm install..." -ForegroundColor Yellow
Write-Host ""

npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host ""
    Write-Host "  FAIL: npm install failed. See errors above." -ForegroundColor Red
    Write-Host "  TIP:  Try .\install.ps1 -Clean for a clean reinstall." -ForegroundColor Yellow
    exit 1
}

# ----------------------------------------------------------------
# Step 5: Verify key packages installed
# ----------------------------------------------------------------
Write-Host ""
Write-Host "  [5/5] Verifying installed packages..." -ForegroundColor Yellow
Write-Host ""

$packages = @(
    "react",
    "@xyflow/react",
    "d3",
    "recharts",
    "react-leaflet",
    "leaflet",
    "@tanstack/react-table",
    "html-to-image",
    "gifshot",
    "xlsx",
    "lucide-react",
    "vite"
)

$allOk = $true
foreach ($pkg in $packages) {
    $pkgJsonPath = Join-Path (Join-Path $scriptDir "node_modules") $pkg
    $pkgJsonPath = Join-Path $pkgJsonPath "package.json"
    if (Test-Path $pkgJsonPath) {
        $pkgData = Get-Content $pkgJsonPath -Raw | ConvertFrom-Json
        $ver = $pkgData.version
        Write-Host ("        OK   " + $pkg.PadRight(32) + " v$ver") -ForegroundColor Green
    } else {
        Write-Host ("        MISS " + $pkg) -ForegroundColor Red
        $allOk = $false
    }
}

Write-Host ""
Write-Host "  -----------------------------------------" -ForegroundColor DarkGray

if ($allOk) {
    Write-Host "  All dependencies installed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "  Next step -- start the app:" -ForegroundColor Cyan
    Write-Host "    .\start.ps1" -ForegroundColor White
} else {
    Write-Host "  WARNING: Some packages are missing." -ForegroundColor Yellow
    Write-Host "  Try a clean reinstall:  .\install.ps1 -Clean" -ForegroundColor Yellow
}
Write-Host ""
