param([switch]$SkipInstall)
$ErrorActionPreference = 'Stop'
Set-Location -LiteralPath $PSScriptRoot
function Assert-Exit([string]$Step) { if ($LASTEXITCODE -ne 0) { throw "$Step failed with exit code $LASTEXITCODE. See the message above." } }
function Test-LocalPort([int]$Port) {
    $client = New-Object System.Net.Sockets.TcpClient
    try { return $client.ConnectAsync('127.0.0.1', $Port).Wait(500) -and $client.Connected } catch { return $false } finally { $client.Dispose() }
}
if (Test-LocalPort 5173) { throw 'Port 5173 is already in use. Close the existing frontend terminal, or open http://127.0.0.1:5173 if the app is already running.' }
if (Test-LocalPort 8000) { throw 'Port 8000 is already in use. Stop the existing API before starting another copy.' }
if (-not (Get-Command python -ErrorAction SilentlyContinue)) { throw 'Python is missing. Install Python 3.10 or newer and enable Add Python to PATH.' }
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) { throw 'Node.js/npm is missing. Install Node.js 22 or newer, then reopen this launcher.' }
if (-not (Test-Path -LiteralPath '.venv/Scripts/python.exe')) {
    if ($SkipInstall) { throw 'The project environment has not been installed. Run start.ps1 without -SkipInstall first.' }
    python -m venv .venv
    Assert-Exit 'Python environment creation'
}
if (-not (Test-Path -LiteralPath '.env')) { Copy-Item -LiteralPath '.env.example' -Destination '.env' }
if (-not $SkipInstall) {
    & ./.venv/Scripts/python.exe -m pip install -r backend/requirements-ai.txt
    Assert-Exit 'Python dependencies'
    npm.cmd --prefix frontend ci
    Assert-Exit 'Frontend dependencies'
}
Get-Content -LiteralPath '.env' | ForEach-Object {
    if ($_ -match '^([A-Za-z_][A-Za-z0-9_]*)=(.*)$' -and -not $_.StartsWith('#')) {
        if ($Matches[2]) { [Environment]::SetEnvironmentVariable($Matches[1], $Matches[2], 'Process') }
    }
}
Push-Location backend
try {
    & ../.venv/Scripts/python.exe -m alembic upgrade head
    Assert-Exit 'Database migrations'
    & ../.venv/Scripts/python.exe -m app.seed
    Assert-Exit 'Demo data and semantic model'
} finally { Pop-Location }
$apiJob = Start-Job -ArgumentList $PSScriptRoot -ScriptBlock {
    param($root)
    Set-Location -LiteralPath (Join-Path $root 'backend')
    & ../.venv/Scripts/python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --env-file ../.env
}
try {
    $ready = $false
    for ($attempt = 0; $attempt -lt 30; $attempt++) {
        if ($apiJob.State -in @('Failed','Completed','Stopped')) { break }
        try {
            $status = Invoke-RestMethod -Uri 'http://127.0.0.1:8000/api/health' -TimeoutSec 1
            if ($status.status -eq 'ok') { $ready = $true; break }
        } catch { Start-Sleep -Milliseconds 500 }
    }
    if (-not $ready) { Receive-Job -Job $apiJob; throw 'The API did not start. Read its error above. Check Python network permissions, your environment settings, and whether port 8000 is available.' }
    Write-Host 'AI Idea Merger is ready at http://127.0.0.1:5173'
    Write-Host 'Demo: alex@ideamerger.demo / BuildTogether!2026 (or your DEMO_PASSWORD)'
    Write-Host 'Open Merge ideas to combine GrowSense and HarvestLink.'
    Write-Host 'Keep this terminal open. Press Ctrl+C to stop both servers.'
    npm.cmd --prefix frontend run dev -- --port 5173 --strictPort
    Assert-Exit 'Website server'
} finally {
    Stop-Job -Job $apiJob -ErrorAction SilentlyContinue
    Receive-Job -Job $apiJob
    Remove-Job -Job $apiJob -Force
}
