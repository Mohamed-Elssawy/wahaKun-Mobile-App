<#
    Proves the demo actually works, rather than just that the ports are open.

    Runs the whole farmer flow against the live services the way the app does:
    log in, file a report with a real photo, analyse it, read it back, and
    fetch the photo. Prints PASS/FAIL per step.

    Run it after start-demo.ps1. It creates one real report in ReportDb.
#>

$Vision = 'C:\Grad-Project\vision-service'
$Photo  = "$Vision\test_image\image22pipe.jpg"

$Email    = 'mohamedelsawymh06@gmail.com'
$Password = 'P@ssw0rd2026'

$script:Failures = 0

function Report-Step {
    param([string]$Name, [bool]$Ok, [string]$Detail = '')
    if ($Ok) {
        Write-Host ("  PASS  " + $Name) -ForegroundColor Green
    }
    else {
        Write-Host ("  FAIL  " + $Name) -ForegroundColor Red
        if ($Detail) { Write-Host ("        " + $Detail) -ForegroundColor DarkGray }
        $script:Failures++
    }
}

Write-Host "`nWAHA KUN demo check`n" -ForegroundColor Cyan

# --- Ports ------------------------------------------------------------------
Write-Host "Services" -ForegroundColor White
$ports = [ordered]@{
    'MinIO'        = 9000
    'Auth'         = 5090
    'Report'       = 5173
    'MediaStorage' = 5230
    'Vision'       = 8001
    'Metro'        = 8081
}
foreach ($name in $ports.Keys) {
    $up = Test-NetConnection -ComputerName localhost -Port $ports[$name] `
            -InformationLevel Quiet -WarningAction SilentlyContinue
    Report-Step -Name ("{0} on {1}" -f $name, $ports[$name]) -Ok $up
}

if ($script:Failures -gt 0) {
    Write-Host "`nSome services are down. Run start-demo.ps1 first.`n" -ForegroundColor Red
    exit 1
}

# --- The farmer flow --------------------------------------------------------
Write-Host "`nFarmer flow" -ForegroundColor White

# 1. Log in - this is the .NET AuthService, no Firebase involved.
$token = $null
try {
    $body = @{ email = $Email; password = $Password } | ConvertTo-Json
    $login = Invoke-RestMethod -Uri 'http://localhost:5090/api/Auth/LoginWithEmail' `
        -Method Post -ContentType 'application/json' -Body $body -TimeoutSec 30
    $token = $login.accessToken
    Report-Step -Name "log in as $Email" -Ok ([bool]$token)
}
catch {
    Report-Step -Name "log in as $Email" -Ok $false -Detail $_.Exception.Message
}
if (-not $token) {
    Write-Host "`nCannot continue without a token.`n" -ForegroundColor Red
    exit 1
}

# 2. File a report. Multipart, so curl.exe rather than Invoke-RestMethod.
$created = $null
try {
    $raw = curl.exe -s -X POST 'http://localhost:5173/api/Report/create' `
        -H "Authorization: Bearer $token" `
        -F "photo=@$Photo" `
        -F 'Description=check-demo smoke test'
    $created = $raw | ConvertFrom-Json
    Report-Step -Name 'file a report with a photo' -Ok ([bool]$created.id) -Detail $raw
}
catch {
    Report-Step -Name 'file a report with a photo' -Ok $false -Detail $raw
}
if (-not $created.id) {
    Write-Host "`nReport creation failed - see the detail above.`n" -ForegroundColor Red
    exit 1
}

# 3. Analyse it. This is the call that reaches the AI vision service.
$analyzed = $null
try {
    $raw = curl.exe -s -X POST "http://localhost:5173/api/Report/AnalyzeReport?id=$($created.id)" `
        -H "Authorization: Bearer $token"
    $analyzed = $raw | ConvertFrom-Json
    $ok = $analyzed.status -eq 'Analyzed' -and $null -ne $analyzed.analysis
    Report-Step -Name 'AI analysis returns a diagnosis' -Ok $ok -Detail $raw
}
catch {
    Report-Step -Name 'AI analysis returns a diagnosis' -Ok $false -Detail $raw
}

if ($analyzed.analysis) {
    Write-Host ("        problem    : " + $analyzed.analysis.problemArabic) -ForegroundColor DarkGray
    Write-Host ("        confidence : " + $analyzed.analysis.confidence + "%") -ForegroundColor DarkGray
    Write-Host ("        severity   : " + $analyzed.analysis.severity) -ForegroundColor DarkGray
}

# 4. Read it back the way My Issues does.
try {
    $mine = curl.exe -s -X GET 'http://localhost:5173/api/Report/GetMyReports' `
        -H "Authorization: Bearer $token" | ConvertFrom-Json
    Report-Step -Name "list my reports (found $($mine.Count))" -Ok ($mine.Count -gt 0)
}
catch {
    Report-Step -Name 'list my reports' -Ok $false -Detail $_.Exception.Message
}

# 5. Fetch the photo. The app rewrites whatever URL the server sends into this
#    call, so this is the request the <Image> on screen actually makes.
try {
    $url = $analyzed.attachments[0].url
    $key = $url.Substring($url.LastIndexOf('reportimage/'))
    $img = Invoke-WebRequest -Uri "http://localhost:5230/api/storage?objectName=$key" `
        -UseBasicParsing -TimeoutSec 30
    $expected = (Get-Item $Photo).Length
    Report-Step -Name "download the photo ($($img.RawContentLength) bytes)" `
        -Ok ($img.RawContentLength -eq $expected) `
        -Detail "expected $expected bytes"
}
catch {
    Report-Step -Name 'download the photo' -Ok $false -Detail $_.Exception.Message
}

# --- Verdict ----------------------------------------------------------------
if ($script:Failures -eq 0) {
    Write-Host "`nEverything works. The demo is ready.`n" -ForegroundColor Green
    exit 0
}
Write-Host "`n$($script:Failures) step(s) failed - see the detail above.`n" -ForegroundColor Red
exit 1
