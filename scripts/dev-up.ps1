param(
    [switch]$ConfigureFirewall,
    [switch]$SkipWebsite
)

$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $repo ".env"
$adb = Join-Path $env:LOCALAPPDATA "Android\Sdk\platform-tools\adb.exe"
$backendPort = 8000
$discoveryPort = 53535

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

function Set-EnvValue([string]$Name, [string]$Value) {
    if (-not (Test-Path -LiteralPath $envFile)) {
        throw ".env was not found. Copy .env.example to .env before starting development."
    }
    $lines = [System.Collections.Generic.List[string]]::new()
    Get-Content -LiteralPath $envFile | ForEach-Object { $lines.Add($_) }
    $prefix = "${Name}="
    $updated = $false
    for ($index = 0; $index -lt $lines.Count; $index++) {
        if ($lines[$index].StartsWith($prefix, [System.StringComparison]::Ordinal)) {
            $lines[$index] = "${prefix}${Value}"
            $updated = $true
            break
        }
    }
    if (-not $updated) {
        $lines.Add("${prefix}${Value}")
    }
    [System.IO.File]::WriteAllLines($envFile, $lines, [System.Text.UTF8Encoding]::new($false))
}

function Test-IsAdministrator {
    $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = [Security.Principal.WindowsPrincipal]::new($identity)
    $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Ensure-FirewallRule(
    [string]$DisplayName,
    [string]$Protocol,
    [int]$Port
) {
    $existing = Get-NetFirewallRule -DisplayName $DisplayName -ErrorAction SilentlyContinue
    if ($existing) {
        if ($existing.Enabled -ne "True") {
            Enable-NetFirewallRule -DisplayName $DisplayName | Out-Null
        }
        return $true
    }
    if (-not $ConfigureFirewall) {
        Write-Warning "Firewall rule '$DisplayName' is missing. Re-run this script in an Administrator PowerShell with -ConfigureFirewall."
        return $false
    }
    if (-not (Test-IsAdministrator)) {
        throw "-ConfigureFirewall requires an Administrator PowerShell window."
    }
    New-NetFirewallRule `
        -DisplayName $DisplayName `
        -Direction Inbound `
        -Profile Private `
        -Protocol $Protocol `
        -LocalPort $Port `
        -Action Allow | Out-Null
    return $true
}

function Wait-BackendHealth([string]$Url) {
    $deadline = (Get-Date).AddSeconds(90)
    do {
        try {
            $response = Invoke-RestMethod -Uri $Url -TimeoutSec 4
            if ($response.status -eq "ok") { return }
        } catch {
            Start-Sleep -Seconds 2
        }
    } while ((Get-Date) -lt $deadline)
    throw "Backend health did not become ready at $Url within 90 seconds."
}

$lanAddress = Get-PrivateLanAddress
if (-not $lanAddress) {
    throw "No active private Wi-Fi/LAN IPv4 address was found."
}

$allowedHosts = "localhost,127.0.0.1,backend,$lanAddress"
Set-EnvValue -Name "DJANGO_ALLOWED_HOSTS" -Value $allowedHosts
$env:DARMALTON_DEV_API_HOST = $lanAddress

$tcpReady = Ensure-FirewallRule `
    -DisplayName "Darmalton development API" `
    -Protocol TCP `
    -Port $backendPort
$udpReady = Ensure-FirewallRule `
    -DisplayName "Darmalton development discovery" `
    -Protocol UDP `
    -Port $discoveryPort

Push-Location $repo
try {
    & docker compose up -d --wait db
    if ($LASTEXITCODE -ne 0) {
        throw "PostgreSQL startup failed with exit code $LASTEXITCODE."
    }
    & docker compose --profile dev up -d --force-recreate --no-deps backend dev-discovery
    if ($LASTEXITCODE -ne 0) {
        throw "Backend/discovery startup failed with exit code $LASTEXITCODE."
    }
    if (-not $SkipWebsite) {
        & docker compose up -d website
        if ($LASTEXITCODE -ne 0) {
            throw "Website startup failed with exit code $LASTEXITCODE."
        }
    }
} finally {
    Pop-Location
}

Wait-BackendHealth -Url "http://127.0.0.1:$backendPort/api/v1/health/"

$usbDevices = @()
if (Test-Path -LiteralPath $adb) {
    $usbDevices = & $adb devices |
        Select-Object -Skip 1 |
        Where-Object { $_ -match "\sdevice$" } |
        ForEach-Object { ($_ -split "\s+")[0] }
    foreach ($serial in $usbDevices) {
        & $adb -s $serial reverse "tcp:$backendPort" "tcp:$backendPort" | Out-Null
        if ($LASTEXITCODE -ne 0) {
            Write-Warning "ADB reverse failed for device $serial."
        }
    }
}

Write-Host ""
Write-Host "Darmalton development services are ready." -ForegroundColor Green
Write-Host "Backend health: http://127.0.0.1:$backendPort/api/v1/health/"
Write-Host "LAN API:        http://${lanAddress}:$backendPort/api/v1"
Write-Host "Discovery:      UDP $discoveryPort advertising $lanAddress"
if ($usbDevices.Count -gt 0) {
    Write-Host "USB tunnel:     configured for $($usbDevices -join ', ')"
} else {
    Write-Host "USB tunnel:     no authorized Android device detected"
}
if (-not ($tcpReady -and $udpReady)) {
    Write-Host "LAN firewall:   action required; re-run as Administrator with -ConfigureFirewall" -ForegroundColor Yellow
} else {
    Write-Host "LAN firewall:   ready (Private profile only)"
}
