$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot

function Invoke-Checked {
    param(
        [Parameter(Mandatory)]
        [string]$FilePath,
        [Parameter(ValueFromRemainingArguments)]
        [string[]]$Arguments
    )

    & $FilePath @Arguments
    if ($LASTEXITCODE -ne 0) {
        throw "$FilePath failed with exit code $LASTEXITCODE."
    }
}

$pythonCandidates = @(
    (Join-Path $repo ".venv\Scripts\python.exe"),
    "C:\Users\AFerd\anaconda3\python.exe",
    "python"
)
$bootstrapPython = $pythonCandidates | Where-Object {
    if ($_ -eq "python") { return [bool](Get-Command python -ErrorAction SilentlyContinue) }
    return Test-Path -LiteralPath $_
} | Select-Object -First 1

if (-not $bootstrapPython) {
    throw "Python 3.13 is required. Install it, then rerun this script."
}

$venvPython = Join-Path $repo ".venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $venvPython)) {
    Invoke-Checked $bootstrapPython -m venv (Join-Path $repo ".venv")
}

Invoke-Checked $venvPython -m pip install --upgrade pip
Invoke-Checked $venvPython -m pip install -r (Join-Path $repo "backend\requirements-dev.txt")

$env:DJANGO_USE_SQLITE = "true"
$env:DJANGO_DEBUG = "true"
Invoke-Checked $venvPython (Join-Path $repo "backend\manage.py") migrate
Invoke-Checked $venvPython (Join-Path $repo "backend\manage.py") seed_demo

$npm = "C:\Program Files\nodejs\npm.cmd"
if (-not (Test-Path -LiteralPath $npm)) {
    throw "Node.js LTS/npm is required. Install OpenJS.NodeJS.LTS with winget."
}
Push-Location (Join-Path $repo "website")
try {
    Invoke-Checked $npm ci --no-audit --no-fund
} finally {
    Pop-Location
}

Write-Host "Local setup complete. Run .\scripts\dev-local.ps1"
