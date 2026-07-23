$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$python = Join-Path $repo ".venv\Scripts\python.exe"
$npm = "C:\Program Files\nodejs\npm.cmd"
$tmp = Join-Path $repo "tmp"

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

if (-not (Test-Path -LiteralPath $python)) {
    throw "Python environment not found. Run scripts\setup-local.ps1 first."
}
if (-not (Test-Path -LiteralPath $npm)) {
    throw "Node.js/npm not found at $npm."
}
New-Item -ItemType Directory -Force -Path $tmp | Out-Null

$env:DJANGO_USE_SQLITE = "true"
$env:DJANGO_DEBUG = "true"

Push-Location (Join-Path $repo "backend")
try {
    Invoke-Checked $python -m ruff format --check .
    Invoke-Checked $python -m ruff check .
    Invoke-Checked $python manage.py collectstatic --noinput
    Invoke-Checked $python -m pytest -q
    Invoke-Checked $python manage.py check
    Invoke-Checked $python manage.py makemigrations --check --dry-run
    Invoke-Checked $python manage.py spectacular --file (Join-Path $tmp "openapi.yaml") --validate
} finally {
    Pop-Location
}

$env:Path = "C:\Program Files\nodejs;" + $env:Path
$previousDistDir = $env:NEXT_DIST_DIR
$env:NEXT_DIST_DIR = ".next-build"
$nextEnvPath = Join-Path $repo "website\next-env.d.ts"
$nextEnvContents = [IO.File]::ReadAllBytes($nextEnvPath)
Push-Location (Join-Path $repo "website")
try {
    Invoke-Checked $npm run typecheck
    Invoke-Checked $npm run lint
    Invoke-Checked $npm run build
} finally {
    Pop-Location
    [IO.File]::WriteAllBytes($nextEnvPath, $nextEnvContents)
    $env:NEXT_DIST_DIR = $previousDistDir
}

if (Get-Command flutter -ErrorAction SilentlyContinue) {
    Push-Location (Join-Path $repo "mobile")
    try {
        Invoke-Checked "flutter" pub get
        Invoke-Checked "flutter" analyze
        Invoke-Checked "flutter" test
        Invoke-Checked "flutter" build apk --debug --dart-define=API_BASE_URL=http://10.0.2.2:8000/api/v1
    } finally {
        Pop-Location
    }
} else {
    Write-Warning "Flutter is not installed; mobile verification was not run."
}
