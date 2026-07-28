$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$tmp = Join-Path $repo "tmp\dev"
New-Item -ItemType Directory -Force -Path $tmp | Out-Null

$dotenv = Join-Path $repo ".env"
if (Test-Path -LiteralPath $dotenv) {
    Get-Content -LiteralPath $dotenv | ForEach-Object {
        if ($_ -match "^\s*([^#][^=]*)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            if ($name -and -not [Environment]::GetEnvironmentVariable($name, "Process")) {
                [Environment]::SetEnvironmentVariable($name, $value, "Process")
            }
        }
    }
}

$python = Join-Path $repo ".venv\Scripts\python.exe"
$node = "C:\Program Files\nodejs\npm.cmd"
if (-not (Test-Path -LiteralPath $python)) {
    throw "Run scripts\setup-local.ps1 first."
}
if (-not (Test-Path -LiteralPath $node)) {
    throw "Node.js/npm not found at $node."
}
foreach ($port in @(8000, 3000)) {
    if (Get-NetTCPConnection -State Listen -LocalPort $port -ErrorAction SilentlyContinue) {
        throw "Port $port is already in use. Stop the existing service before starting Darmalton."
    }
}
$env:Path = "C:\Program Files\nodejs;" + $env:Path

$backendArgs = @(
    "-NoProfile",
    "-Command",
    "`$env:DJANGO_USE_SQLITE='true'; `$env:DJANGO_DEBUG='true'; & '$python' '$repo\backend\manage.py' runserver 127.0.0.1:8000"
)
$backend = Start-Process -FilePath "powershell.exe" -ArgumentList $backendArgs `
    -WindowStyle Hidden -PassThru `
    -RedirectStandardOutput (Join-Path $tmp "backend.out.log") `
    -RedirectStandardError (Join-Path $tmp "backend.err.log")

$website = Start-Process -FilePath $node -ArgumentList @("run", "dev") `
    -WorkingDirectory (Join-Path $repo "website") `
    -WindowStyle Hidden -PassThru `
    -RedirectStandardOutput (Join-Path $tmp "website.out.log") `
    -RedirectStandardError (Join-Path $tmp "website.err.log")

foreach ($entry in @(
    @{ Name = "backend"; Process = $backend },
    @{ Name = "website"; Process = $website }
)) {
    @{
        process_id = $entry.Process.Id
        started_at = $entry.Process.StartTime.ToUniversalTime().ToString("O")
    } |
        ConvertTo-Json |
        Set-Content -LiteralPath (Join-Path $tmp "$($entry.Name).process.json")
}

Write-Host "Backend PID $($backend.Id), website PID $($website.Id)"
Write-Host "Backend: http://127.0.0.1:8000 | Swagger: http://127.0.0.1:8000/api/docs/"
Write-Host "Website: http://localhost:3000"
Write-Host "Use .\scripts\stop-local.ps1 to stop both processes."
