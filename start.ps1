# ================================================================
#  start.ps1 -- North Star Fiber - Clean Start Script
#
#  Usage:
#    .\start.ps1              # start on default port 5173
#    .\start.ps1 -Port 3000  # start on a custom port
# ================================================================
param(
    [int]$Port = 5173
)

$ErrorActionPreference = "SilentlyContinue"

Write-Host ""
Write-Host "  * NORTH STAR FIBER -- Network Simulation Dashboard" -ForegroundColor Cyan
Write-Host "  -------------------------------------------------" -ForegroundColor DarkGray
Write-Host ""

# ----------------------------------------------------------------
# Step 1: Kill any running Node / Vite processes
# ----------------------------------------------------------------
Write-Host "  [1/4] Stopping any running Node processes..." -ForegroundColor Yellow

$nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue
if ($nodeProcs) {
    foreach ($proc in $nodeProcs) {
        $procId = $proc.Id
        Write-Host "        Killing node PID $procId" -ForegroundColor DarkYellow
        Stop-Process -Id $procId -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Milliseconds 800
} else {
    Write-Host "        No node processes found." -ForegroundColor DarkGray
}

# ----------------------------------------------------------------
# Step 2: Free the port
# ----------------------------------------------------------------
Write-Host "  [2/4] Checking port $Port..." -ForegroundColor Yellow

$netLines = netstat -ano 2>$null | Select-String ":$Port\s"
if ($netLines) {
    $pidList = $netLines | ForEach-Object {
        ($_ -split "\s+") | Select-Object -Last 1
    } | Sort-Object -Unique | Where-Object { $_ -match "^\d+$" }

    foreach ($pidStr in $pidList) {
        $pidInt = [int]$pidStr
        if ($pidInt -gt 0) {
            Write-Host "        Port $Port in use by PID $pidInt -- killing..." -ForegroundColor DarkYellow
            Stop-Process -Id $pidInt -Force -ErrorAction SilentlyContinue
        }
    }
    Start-Sleep -Milliseconds 600
    Write-Host "        Port $Port freed." -ForegroundColor Green
} else {
    Write-Host "        Port $Port is already free." -ForegroundColor DarkGray
}

# ----------------------------------------------------------------
# Step 3: Verify node_modules
# ----------------------------------------------------------------
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "  [3/4] Checking dependencies..." -ForegroundColor Yellow

if (-not (Test-Path "node_modules")) {
    Write-Host "        node_modules not found -- running npm install first..." -ForegroundColor Red
    Write-Host ""
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host ""
        Write-Host "  FAIL: npm install failed. Run .\install.ps1 to diagnose." -ForegroundColor Red
        exit 1
    }
} else {
    $modCount = (Get-ChildItem "node_modules" -Directory | Measure-Object).Count
    Write-Host "        node_modules OK ($modCount packages installed)." -ForegroundColor DarkGray
}

# ----------------------------------------------------------------
# Step 4: Start Vite
# ----------------------------------------------------------------
Write-Host "  [4/4] Starting Vite dev server on port $Port..." -ForegroundColor Yellow
Write-Host ""
Write-Host "  -------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  --> http://localhost:$Port" -ForegroundColor Cyan
Write-Host "  -------------------------------------------------" -ForegroundColor DarkGray
Write-Host "  Press Ctrl+C to stop the server." -ForegroundColor DarkGray
Write-Host ""

npm run dev
