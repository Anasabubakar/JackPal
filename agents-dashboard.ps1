# Agent Status Dashboard
$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function Get-Field($text, $label) {
    $m = ($text | Select-String "$label(.+)")
    if ($m -and $m.Matches.Count -gt 0) { return $m.Matches[0].Groups[1].Value.Trim() }
    return "(none)"
}

function Show-Dashboard {
    Clear-Host
    Write-Host ""
    Write-Host "  ========================================================" -ForegroundColor Cyan
    Write-Host "           AGENT COORDINATION DASHBOARD                   " -ForegroundColor Cyan
    Write-Host "  ========================================================" -ForegroundColor Cyan
    Write-Host ""

    Write-Host "  -- CLAUDE (Lead / Backend) -----------------------------" -ForegroundColor Yellow
    if (Test-Path "$root\agents\claude\status.md") {
        $claudeStatus = Get-Content "$root\agents\claude\status.md" -Raw
        Write-Host "  Task    : $(Get-Field $claudeStatus 'Current task: ')" -ForegroundColor White
        Write-Host "  Working : $(Get-Field $claudeStatus 'Working on: ')" -ForegroundColor White
        Write-Host "  Blocking: $(Get-Field $claudeStatus 'Blocking Codex: ')" -ForegroundColor White
    } else {
        Write-Host "  (no status file yet)" -ForegroundColor DarkGray
    }
    Write-Host ""

    Write-Host "  -- CODEX (Frontend / UI) --------------------------------" -ForegroundColor Magenta
    if (Test-Path "$root\agents\codex\status.md") {
        $codexStatus = Get-Content "$root\agents\codex\status.md" -Raw
        Write-Host "  Task    : $(Get-Field $codexStatus 'Current task: ')" -ForegroundColor White
        Write-Host "  Blocking: $(Get-Field $codexStatus 'Blocking Claude: ')" -ForegroundColor White
    } else {
        Write-Host "  (no status file yet)" -ForegroundColor DarkGray
    }
    Write-Host ""

    Write-Host "  -- HANDOFF QUEUE ----------------------------------------" -ForegroundColor Green
    if (Test-Path "$root\agents\shared\handoff-queue.md") {
        $queue = Get-Content "$root\agents\shared\handoff-queue.md"
        $tableLines = $queue | Where-Object { $_ -match "^\|" } | Select-Object -Skip 2
        if (-not $tableLines -or ($tableLines.Count -eq 1 -and $tableLines[0] -match "No tasks|--")) {
            Write-Host "  No active tasks" -ForegroundColor DarkGray
        } else {
            foreach ($line in $tableLines) {
                if     ($line -match "PENDING")     { Write-Host "  $line" -ForegroundColor Yellow }
                elseif ($line -match "IN PROGRESS") { Write-Host "  $line" -ForegroundColor Cyan }
                elseif ($line -match "DONE")        { Write-Host "  $line" -ForegroundColor Green }
                elseif ($line -match "BLOCKED")     { Write-Host "  $line" -ForegroundColor Red }
                else                                { Write-Host "  $line" -ForegroundColor Gray }
            }
        }
    } else {
        Write-Host "  (no queue file yet)" -ForegroundColor DarkGray
    }
    Write-Host ""
    Write-Host "  Last updated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor DarkGray
    Write-Host ""
}

Show-Dashboard
