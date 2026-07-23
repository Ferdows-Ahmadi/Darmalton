$ErrorActionPreference = "Stop"

$repo = Split-Path -Parent $PSScriptRoot
$tmp = Join-Path $repo "tmp\dev"

function Stop-RecordedProcessTree {
    param(
        [Parameter(Mandatory)]
        [string]$Name
    )

    $statePath = Join-Path $tmp "$Name.process.json"
    $legacyPidPath = Join-Path $tmp "$Name.pid"
    if (Test-Path -LiteralPath $statePath) {
        $state = Get-Content -LiteralPath $statePath -Raw | ConvertFrom-Json
        $processId = [int]$state.process_id
        $expectedStart = [DateTime]::Parse(
            $state.started_at,
            [Globalization.CultureInfo]::InvariantCulture,
            [Globalization.DateTimeStyles]::RoundtripKind
        )
    } elseif (Test-Path -LiteralPath $legacyPidPath) {
        $processId = [int](Get-Content -LiteralPath $legacyPidPath)
        $expectedStart = $null
    } else {
        return
    }

    $rootProcess = Get-Process -Id $processId -ErrorAction SilentlyContinue
    if ($rootProcess -and $expectedStart) {
        $actualStart = $rootProcess.StartTime.ToUniversalTime()
        if ([Math]::Abs(($actualStart - $expectedStart.ToUniversalTime()).TotalSeconds) -gt 1) {
            throw "Refusing to stop $Name because recorded PID $processId was reused."
        }
    }

    if ($rootProcess) {
        $processes = @(Get-CimInstance Win32_Process)
        $tree = [Collections.Generic.List[int]]::new()
        function Add-Descendants {
            param([int]$ParentId)
            foreach ($child in $processes | Where-Object ParentProcessId -eq $ParentId) {
                Add-Descendants -ParentId $child.ProcessId
                $tree.Add([int]$child.ProcessId)
            }
        }

        Add-Descendants -ParentId $processId
        foreach ($childId in $tree) {
            Stop-Process -Id $childId -Force -ErrorAction SilentlyContinue
        }
        Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
        Write-Host "Stopped $Name process tree rooted at $processId."
    }

    foreach ($path in @($statePath, $legacyPidPath)) {
        if (Test-Path -LiteralPath $path) {
            Remove-Item -LiteralPath $path
        }
    }
}

foreach ($name in @("backend", "website")) {
    Stop-RecordedProcessTree -Name $name
}
