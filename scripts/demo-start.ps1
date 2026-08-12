param(
    [ValidateSet("usb", "lan")]
    [string]$Mode = "usb",
    [switch]$ForceBuild,
    [switch]$SkipInstall,
    [switch]$SkipLaunch,
    [switch]$ConfigureFirewall
)

$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$mobile = Join-Path $repo "mobile"
$apk = Join-Path $mobile "build\app\outputs\flutter-apk\app-debug.apk"
$flutter = "C:\src\flutter\bin\flutter.bat"
$adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
$package = "com.darmalton.pharmacy"
$backendHealth = "http://127.0.0.1:8000/api/v1/health/"
$websiteHealth = "http://127.0.0.1:3000/"

function Get-PrivateLanAddress {
    Get-NetIPConfiguration |
        Where-Object {
            $_.IPv4DefaultGateway -and
            $_.NetAdapter.Status -eq "Up" -and
            $_.InterfaceAlias -notmatch "Radmin|VPN|Virtual|Loopback"
        } |
        ForEach-Object { $_.IPv4Address.IPAddress } |
        Where-Object { $_ -match "^192\.168\.|^10\.|^172\.(1[6-9]|2\d|3[01])\." } |
        Select-Object -First 1
}

function Wait-Http([string]$Name, [string]$Url, [int]$Seconds = 120) {
    $deadline = (Get-Date).AddSeconds($Seconds)
    do {
        try {
            $response = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 5
            if ($response.StatusCode -ge 200 -and $response.StatusCode -lt 400) {
                Write-Host "$Name ready: $Url" -ForegroundColor Green
                return
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    } while ((Get-Date) -lt $deadline)
    throw "$Name did not become ready at $Url within $Seconds seconds. Run 'docker compose ps' and 'docker compose logs backend website --tail 100'."
}

function Test-MobileSourcesNewerThanApk {
    if (-not (Test-Path -LiteralPath $apk)) { return $true }
    $apkTime = (Get-Item -LiteralPath $apk).LastWriteTimeUtc
    $sourceRoots = @(
        (Join-Path $mobile "lib"),
        (Join-Path $mobile "assets"),
        (Join-Path $mobile "android\app\src"),
        (Join-Path $mobile "android\app\build.gradle.kts"),
        (Join-Path $mobile "android\build.gradle.kts"),
        (Join-Path $mobile "android\settings.gradle.kts"),
        (Join-Path $mobile "android\gradle.properties"),
        (Join-Path $mobile "pubspec.yaml"),
        (Join-Path $mobile "pubspec.lock")
    )
    foreach ($root in $sourceRoots) {
        if (-not (Test-Path -LiteralPath $root)) { continue }
        $item = Get-Item -LiteralPath $root
        if (-not $item.PSIsContainer) {
            if ($item.LastWriteTimeUtc -gt $apkTime) { return $true }
            continue
        }
        $newer = Get-ChildItem -LiteralPath $root -Recurse -File |
            Where-Object { $_.LastWriteTimeUtc -gt $apkTime } |
            Select-Object -First 1
        if ($newer) { return $true }
    }
    return $false
}

function Get-InstalledPackageUpdateTime([string]$Serial) {
    $line = & $adb -s $Serial shell dumpsys package $package 2>$null |
        Select-String -Pattern "^\s*lastUpdateTime=" |
        Select-Object -First 1
    if (-not $line) { return $null }
    $value = ($line.ToString() -split "=", 2)[1].Trim()
    $parsed = [datetime]::MinValue
    if ([datetime]::TryParse($value, [ref]$parsed)) { return $parsed }
    return $null
}

if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
    throw "Docker was not found. Start Docker Desktop, wait until its engine is ready, and run this script again."
}
& docker info *> $null
if ($LASTEXITCODE -ne 0) {
    throw "Docker Desktop is installed but its engine is not ready. Start Docker Desktop and retry."
}
if (-not (Test-Path -LiteralPath $adb)) {
    throw "ADB was not found at $adb. Install Android SDK platform-tools or correct the SDK path."
}
if (-not (Test-Path -LiteralPath $flutter)) {
    throw "Flutter was not found at $flutter. Correct the Flutter SDK path before rebuilding the app."
}

$lanAddress = Get-PrivateLanAddress
if (-not $lanAddress) {
    throw "No active private Wi-Fi/LAN IPv4 address was found. Connect the laptop to the meeting network and retry."
}

Write-Host "Starting the existing Darmalton stack without resetting data..." -ForegroundColor Cyan
$devUpArguments = @()
if ($ConfigureFirewall) { $devUpArguments += "-ConfigureFirewall" }
& (Join-Path $PSScriptRoot "dev-up.ps1") @devUpArguments
if ($LASTEXITCODE -ne 0) {
    throw "Darmalton service startup failed. Inspect Docker Desktop and run 'docker compose logs --tail 100'."
}

Wait-Http -Name "Backend" -Url $backendHealth
Wait-Http -Name "Website/staff portal" -Url $websiteHealth

$deviceLines = & $adb devices | Select-Object -Skip 1 | Where-Object { $_ -match "\sdevice$" }
if (-not $deviceLines) {
    throw "No authorized Pixel was found. Unlock it, enable USB debugging, reconnect USB, approve the RSA prompt, then run 'adb devices'."
}
$serial = (($deviceLines | Select-Object -First 1) -split "\s+")[0]

if ($Mode -eq "usb") {
    & $adb -s $serial reverse tcp:8000 tcp:8000
    if ($LASTEXITCODE -ne 0) {
        throw "ADB reverse failed. Reconnect USB, confirm 'adb devices' reports device (not unauthorized), and retry."
    }
    $apiBaseUrl = "http://127.0.0.1:8000/api/v1"
} else {
    $apiBaseUrl = "http://${lanAddress}:8000/api/v1"
    try {
        Invoke-WebRequest -Uri "http://${lanAddress}:8000/api/v1/health/" -UseBasicParsing -TimeoutSec 5 | Out-Null
    } catch {
        throw "The LAN API is not reachable at $apiBaseUrl. Confirm both devices use the same Wi-Fi and allow Private-profile TCP 8000 through Windows Firewall."
    }
}

$needsBuild = $ForceBuild -or (Test-MobileSourcesNewerThanApk)
if ($needsBuild) {
    Write-Host "Mobile sources changed; building one fresh debug APK..." -ForegroundColor Cyan
    Push-Location $mobile
    try {
        & $flutter pub get
        if ($LASTEXITCODE -ne 0) { throw "flutter pub get failed." }
        & $flutter build apk --debug "--dart-define=API_BASE_URL=$apiBaseUrl"
        if ($LASTEXITCODE -ne 0) { throw "Flutter debug APK build failed." }
    } finally {
        Pop-Location
    }
} else {
    Write-Host "Existing debug APK is current; build skipped." -ForegroundColor Green
}

if (-not $SkipInstall) {
    if (-not (Test-Path -LiteralPath $apk)) {
        throw "Debug APK is missing at $apk. Re-run with -ForceBuild."
    }
    $installed = (& $adb -s $serial shell pm path $package 2>$null) -match "package:"
    $installedAt = Get-InstalledPackageUpdateTime -Serial $serial
    $apkIsNewer = $installedAt -and (Get-Item -LiteralPath $apk).LastWriteTime -gt $installedAt
    $installNeeded = $needsBuild -or -not $installed -or $apkIsNewer
    if ($installNeeded) {
        & $adb -s $serial install -r $apk
        if ($LASTEXITCODE -ne 0) {
            throw "APK install failed. Unlock the Pixel, allow USB installation if prompted, and retry."
        }
    } else {
        Write-Host "The current APK is already installed; install skipped." -ForegroundColor Green
    }
}

if (-not $SkipLaunch) {
    & $adb -s $serial shell am force-stop $package
    & $adb -s $serial shell am start -n "$package/.MainActivity"
    if ($LASTEXITCODE -ne 0) {
        throw "The Android app could not be launched. Open Darmalton manually on the Pixel and inspect 'adb logcat'."
    }
}

Write-Host ""
Write-Host "Darmalton demo is ready." -ForegroundColor Green
Write-Host "Pixel:             $serial ($Mode, API $apiBaseUrl)"
Write-Host "Public website:    http://${lanAddress}:3000/"
Write-Host "Customer shop:     http://${lanAddress}:3000/shop"
Write-Host "Staff portal:      http://${lanAddress}:3000/staff"
Write-Host "Staff login:       http://${lanAddress}:3000/staff/login"
Write-Host "CMS management:    http://${lanAddress}:3000/staff/cms"
Write-Host "Django Admin:      http://${lanAddress}:8000/admin/"
Write-Host "API documentation: http://${lanAddress}:8000/api/docs/"
Write-Host "Backend health:    http://${lanAddress}:8000/api/v1/health/"
Write-Host ""
Write-Host "If USB is disconnected, reconnect it and rerun this script. For same-Wi-Fi fallback, rerun with -Mode lan."
