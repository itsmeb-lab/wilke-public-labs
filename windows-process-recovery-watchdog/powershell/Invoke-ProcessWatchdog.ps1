param(
  [Parameter(Mandatory=$true)][string]$TargetPath,
  [Parameter(Mandatory=$true)][string]$TargetArguments,
  [Parameter(Mandatory=$true)][string]$MatchToken,
  [string]$LogPath = "$PSScriptRoot\watchdog.log",
  [int]$CheckIntervalSeconds = 5,
  [switch]$Once
)
$ErrorActionPreference = 'Stop'
function Write-WatchdogLog([string]$Event,[string]$Detail) {
  $row = "{0} | {1} | {2}" -f (Get-Date).ToUniversalTime().ToString('o'),$Event,$Detail
  Add-Content -LiteralPath $LogPath -Value $row -Encoding UTF8
}
function Get-WatchedProcess {
  @(Get-CimInstance Win32_Process | Where-Object {
    $_.ExecutablePath -eq $TargetPath -and $_.CommandLine -like "*$MatchToken*"
  })
}
function Invoke-WatchdogCycle {
  $existing = @(Get-WatchedProcess)
  if ($existing.Count -gt 0) { Write-WatchdogLog 'healthy' "pid=$($existing[0].ProcessId)"; return }
  $p = Start-Process -FilePath $TargetPath -ArgumentList $TargetArguments -PassThru
  Start-Sleep -Milliseconds 750
  if ($p.HasExited) { Write-WatchdogLog 'start_failed' "exit=$($p.ExitCode)"; throw 'Target exited during startup verification.' }
  Write-WatchdogLog 'started' "pid=$($p.Id)"
}
do { Invoke-WatchdogCycle; if (-not $Once) { Start-Sleep -Seconds $CheckIntervalSeconds } } while (-not $Once)
