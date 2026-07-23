param([switch]$ConfirmReset)

$ErrorActionPreference = "Stop"
if (-not $ConfirmReset) {
    throw "This deletes only the ignored local SQLite database. Re-run with -ConfirmReset."
}

$repo = Split-Path -Parent $PSScriptRoot
$database = Join-Path $repo "backend\db.sqlite3"
$resolvedBackend = (Resolve-Path -LiteralPath (Join-Path $repo "backend")).Path
if (Test-Path -LiteralPath $database) {
    $resolvedDatabase = (Resolve-Path -LiteralPath $database).Path
    if (-not $resolvedDatabase.StartsWith($resolvedBackend, [StringComparison]::OrdinalIgnoreCase)) {
        throw "Refusing to remove a database outside the backend directory."
    }
    Remove-Item -LiteralPath $resolvedDatabase
}

$python = Join-Path $repo ".venv\Scripts\python.exe"
if (-not (Test-Path -LiteralPath $python)) {
    throw "Python environment not found. Run scripts\setup-local.ps1 first."
}
$env:DJANGO_USE_SQLITE = "true"
& $python (Join-Path $repo "backend\manage.py") migrate
if ($LASTEXITCODE -ne 0) {
    throw "Django migrate failed with exit code $LASTEXITCODE."
}
& $python (Join-Path $repo "backend\manage.py") seed_demo
if ($LASTEXITCODE -ne 0) {
    throw "Demo seeding failed with exit code $LASTEXITCODE."
}
Write-Host "Local development data was reset."
