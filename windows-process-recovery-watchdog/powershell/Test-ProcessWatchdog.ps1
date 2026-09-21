$ErrorActionPreference='Stop'
$watch=Join-Path $PSScriptRoot 'Invoke-ProcessWatchdog.ps1'
$log=Join-Path $PSScriptRoot 'watchdog-test.log'
$exe="$env:WINDIR\System32\WindowsPowerShell\v1.0\powershell.exe"
$token='ProcessRecoveryDemoFixture'
$args='-NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 120 # ProcessRecoveryDemoFixture"'
function Find-Fixture { @(Get-CimInstance Win32_Process | Where-Object { $_.ExecutablePath -eq $exe -and $_.CommandLine -like "*$token*" }) }
@(Find-Fixture) | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
Remove-Item $log -Force -ErrorAction SilentlyContinue
& $watch -TargetPath $exe -TargetArguments $args -MatchToken $token -LogPath $log -Once
$p1=@(Find-Fixture); $a1=($p1.Count -eq 1)
& $watch -TargetPath $exe -TargetArguments $args -MatchToken $token -LogPath $log -Once
$p2=@(Find-Fixture); $a2=($p2.Count -eq 1 -and $p2[0].ProcessId -eq $p1[0].ProcessId)
$old=[int]$p1[0].ProcessId; Stop-Process -Id $old -Force; Start-Sleep -Milliseconds 400
& $watch -TargetPath $exe -TargetArguments $args -MatchToken $token -LogPath $log -Once
$p3=@(Find-Fixture); $a3=($p3.Count -eq 1 -and $p3[0].ProcessId -ne $old)
$lines=@(Get-Content $log)
$a4=(@($lines | Where-Object {$_ -match '\| started \|'}).Count -eq 2)
$a5=(@($lines | Where-Object {$_ -match '\| healthy \|'}).Count -eq 1)
@(Find-Fixture) | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
$result=[ordered]@{state=if($a1-and$a2-and$a3-and$a4-and$a5){'PASS'}else{'FAIL'};assertions=[ordered]@{starts_when_absent=$a1;avoids_duplicate=$a2;restarts_after_crash=$a3;two_start_receipts=$a4;healthy_receipt=$a5}}
$result | ConvertTo-Json -Depth 5
Remove-Item $log -Force -ErrorAction SilentlyContinue
if($result.state -ne 'PASS'){exit 1}