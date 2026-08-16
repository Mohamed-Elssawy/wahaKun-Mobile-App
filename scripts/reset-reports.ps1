<#
    Deletes every report on the demo account, so My Issues starts a demo empty.

    Goes through the API rather than SQL on purpose: DeleteReport also removes the
    photo from MinIO, which a DELETE against the Reports table would orphan.

    Needs AuthService (5090), ReportService (5173), MediaStorage (5230) and MinIO
    (9000) up — run start-demo.ps1 first.

        .\scripts\reset-reports.ps1
        .\scripts\reset-reports.ps1 -WhatIf        # list them, delete nothing
#>

[CmdletBinding(SupportsShouldProcess)]
param(
    [string]$Email    = 'mohamedelsawymh06@gmail.com',
    [string]$Password = 'P@ssw0rd2026',
    [string]$AuthUrl   = 'http://localhost:5090/api',
    [string]$ReportUrl = 'http://localhost:5173/api'
)

$ErrorActionPreference = 'Stop'

Write-Host "`nWAHA KUN - clearing reports for $Email`n" -ForegroundColor Cyan

# The token field is accessToken, not token.
$login = Invoke-RestMethod -Method Post -Uri "$AuthUrl/Auth/LoginWithEmail" `
    -ContentType 'application/json' `
    -Body (@{ email = $Email; password = $Password } | ConvertTo-Json)

$headers = @{ Authorization = "Bearer $($login.accessToken)" }

# Piped, not just wrapped in @(): Windows PowerShell hands the whole JSON array back
# as one object, and @() around that gives a one-element array holding the array.
$reports = @(Invoke-RestMethod -Method Get -Uri "$ReportUrl/Report/GetMyReports" -Headers $headers | ForEach-Object { $_ })
Write-Host "  $($reports.Count) report(s) on the account" -ForegroundColor DarkGray

if ($reports.Count -eq 0) {
    Write-Host "`nNothing to do.`n" -ForegroundColor Green
    return
}

$deleted = 0
$failed  = 0
foreach ($report in $reports) {
    # Short reference, matching what the app prints on the card.
    $ref = "#$($report.id.Substring(0, 4).ToUpper())"

    if (-not $PSCmdlet.ShouldProcess("$ref ($($report.status))", 'DeleteReport')) {
        continue
    }

    try {
        Invoke-RestMethod -Method Delete -Headers $headers `
            -Uri "$ReportUrl/Report/DeleteReport?id=$($report.id)" | Out-Null
        $deleted++
    }
    catch {
        # One bad row must not strand the rest — MinIO 404s on an object deleted twice.
        Write-Host "  $ref FAILED: $($_.Exception.Message)" -ForegroundColor Yellow
        $failed++
    }
}

$left = @(Invoke-RestMethod -Method Get -Uri "$ReportUrl/Report/GetMyReports" -Headers $headers | ForEach-Object { $_ })

Write-Host "`n  deleted $deleted, failed $failed, $($left.Count) left on the account"
if ($left.Count -eq 0) {
    Write-Host "`nMy Issues is empty. Open the tab to see it.`n" -ForegroundColor Green
}
else {
    Write-Host "`nRe-run to retry the ones that failed.`n" -ForegroundColor Yellow
}
