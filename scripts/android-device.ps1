param(
    [ValidateSet("usb", "lan")]
    [string]$Mode = "usb",
    [switch]$Build,
    [switch]$Install,
    [switch]$Launch
)

$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$flutter = "C:\src\flutter\bin\flutter.bat"
$adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
$apk = Join-Path $repo "mobile\build\app\outputs\flutter-apk\app-debug.apk"

if (-not (Test-Path -LiteralPath $flutter)) {
    throw "Flutter was not found at $flutter. Set up Flutter before using this script."
}
if (-not (Test-Path -LiteralPath $adb)) {
    throw "adb was not found at $adb. Install Android SDK platform-tools first."
}

$deviceLines = & $adb devices | Select-Object -Skip 1 | Where-Object { $_ -match "\sdevice$" }
if (-not $deviceLines) {
    throw "No authorized Android device is connected. Unlock the phone and approve USB debugging."
}

if ($Mode -eq "usb") {
    & $adb reverse tcp:8000 tcp:8000
    if ($LASTEXITCODE -ne 0) {
        throw "adb reverse failed with exit code $LASTEXITCODE."
    }
    $apiBaseUrl = "http://127.0.0.1:8000/api/v1"
} else {
    $activeLan = Get-NetIPConfiguration |
        Where-Object {
            $_.IPv4DefaultGateway -and
            $_.NetAdapter.Status -eq "Up" -and
            $_.InterfaceAlias -notmatch "Radmin|VPN|Virtual|Loopback"
        } |
        ForEach-Object { $_.IPv4Address.IPAddress } |
        Where-Object { $_ -match "^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\." } |
        Select-Object -First 1

    if (-not $activeLan) {
        throw "No active private-LAN IPv4 address was found."
    }
    $apiBaseUrl = "http://${activeLan}:8000/api/v1"
    Write-Host "LAN API: $apiBaseUrl"
    Write-Host "Ensure DJANGO_ALLOWED_HOSTS contains $activeLan and the Private-profile firewall rule allows TCP 8000."
}

if ($Build) {
    $dartDefines = @("--dart-define=API_BASE_URL=$apiBaseUrl")
    if ($env:GOOGLE_CLIENT_ID) {
        $dartDefines += "--dart-define=GOOGLE_CLIENT_ID=$($env:GOOGLE_CLIENT_ID)"
    } else {
        Write-Warning "GOOGLE_CLIENT_ID is not set; the Google sign-in button will be disabled."
    }
    Push-Location (Join-Path $repo "mobile")
    try {
        & $flutter build apk --debug @dartDefines
        if ($LASTEXITCODE -ne 0) {
            throw "Flutter APK build failed with exit code $LASTEXITCODE."
        }
    } finally {
        Pop-Location
    }
}

if ($Install) {
    if (-not (Test-Path -LiteralPath $apk)) {
        throw "APK not found at $apk. Run again with -Build."
    }
    & $adb install -r $apk
    if ($LASTEXITCODE -ne 0) {
        throw "APK installation failed with exit code $LASTEXITCODE."
    }
}

if ($Launch) {
    & $adb shell am force-stop com.darmalton.pharmacy
    & $adb shell am start -n com.darmalton.pharmacy/.MainActivity
    if ($LASTEXITCODE -ne 0) {
        throw "Application launch failed with exit code $LASTEXITCODE."
    }
}

Write-Host "Device mode: $Mode"
Write-Host "API_BASE_URL: $apiBaseUrl"
