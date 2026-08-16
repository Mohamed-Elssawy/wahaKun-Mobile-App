<#
    Starts every service the WAHA KUN demo needs, each in its own window.

    Run this after a reboot, then run check-demo.ps1 to confirm it all came up.
    Leave the windows open — closing one stops that service.

    Order matters: MediaStorageService needs MinIO listening before it will
    upload, and ReportService needs both of them plus the vision service.
#>

$Backend   = 'C:\Grad-Project\Graduation-Project'
$Vision    = 'C:\Grad-Project\vision-service'
$App       = 'C:\Grad-Project\wahaKun-Mobile-App'
$MinioData = 'C:\Grad-Project\minio-data'

function Start-Window {
    param([string]$Title, [string]$Command)
    $full = "`$Host.UI.RawUI.WindowTitle = '$Title'; $Command"
    Start-Process powershell -ArgumentList '-NoExit', '-Command', $full | Out-Null
    Write-Host "  started $Title" -ForegroundColor DarkGray
}

# A service is only usable once it accepts connections, not once its window opens.
function Wait-Port {
    param([int]$Port, [string]$Name, [int]$TimeoutSeconds = 120)
    Write-Host "  waiting for $Name on $Port ..." -NoNewline
    for ($i = 0; $i -lt $TimeoutSeconds; $i++) {
        $up = Test-NetConnection -ComputerName localhost -Port $Port `
                -InformationLevel Quiet -WarningAction SilentlyContinue
        if ($up) { Write-Host " up" -ForegroundColor Green; return $true }
        Start-Sleep -Seconds 1
    }
    Write-Host " TIMED OUT" -ForegroundColor Red
    return $false
}

Write-Host "`nWAHA KUN demo stack`n" -ForegroundColor Cyan

# --- Windows services -------------------------------------------------------
# Both are set to start automatically, so this is a check rather than a step.
foreach ($name in 'MSSQLSERVER', 'Redis') {
    $svc = Get-Service $name -ErrorAction SilentlyContinue
    if ($null -eq $svc) {
        Write-Host "  $name is NOT INSTALLED - the stack cannot run" -ForegroundColor Red
    }
    elseif ($svc.Status -ne 'Running') {
        Write-Host "  starting $name ..." -ForegroundColor Yellow
        Start-Service $name
    }
    else {
        Write-Host "  $name already running" -ForegroundColor DarkGray
    }
}

# --- 1. MinIO ---------------------------------------------------------------
# Password must match MinioSettings:SecretKey in MediaStorageService's
# appsettings.json, which is 'minioadmin' (it was 'minioadmin123' until 372b08b).
Start-Window 'MinIO' @"
`$env:MINIO_ROOT_USER='minioadmin'; `$env:MINIO_ROOT_PASSWORD='minioadmin'; minio.exe server '$MinioData' --address ':9000' --console-address ':9001'
"@
Wait-Port -Port 9000 -Name 'MinIO' | Out-Null

# --- 2. MediaStorageService -------------------------------------------------
# MinioSettings__Endpoint overrides the '0.0.0.0:9000' in appsettings.json.
# 0.0.0.0 is a listen address; nothing can connect *to* it.
Start-Window 'MediaStorage 5230' @"
`$env:ASPNETCORE_ENVIRONMENT='Development'; `$env:ASPNETCORE_URLS='http://0.0.0.0:5230'; `$env:MinioSettings__Endpoint='localhost:9000'; dotnet run --project '$Backend\MediaStorageService\MediaStorageService\MediaStorageService.csproj'
"@

# --- 3. AuthService ---------------------------------------------------------
# Applies its own migrations and seeds the demo accounts on startup.
Start-Window 'Auth 5090' @"
`$env:ConnectionStrings__SQLConnection='Server=localhost;Database=AuthDb;Trusted_Connection=True;TrustServerCertificate=True;'; dotnet run --launch-profile http --project '$Backend\AuthService\AuthService\AuthService.csproj'
"@

# --- 4. ReportService -------------------------------------------------------
# Services__Storage__BaseUrl overrides another '0.0.0.0'. Without it every
# report upload fails with "0.0.0.0 ... cannot be used as a target address".
Start-Window 'Report 5173' @"
`$env:ASPNETCORE_ENVIRONMENT='Development'; `$env:ASPNETCORE_URLS='http://0.0.0.0:5173'; `$env:Services__Storage__BaseUrl='http://localhost:5230'; `$env:ConnectionStrings__SQLConnection='Server=localhost;Database=ReportDb;Trusted_Connection=True;TrustServerCertificate=True;'; `$env:ConnectionStrings__AuthSqlConnection='Server=localhost;Database=AuthDb;Trusted_Connection=True;TrustServerCertificate=True;'; dotnet run --project '$Backend\ReportService\ReportService\ReportService.csproj'
"@

# --- 5. Vision service ------------------------------------------------------
# Slowest to start: TensorFlow loads the model for about 40 seconds.
Start-Window 'Vision 8001' @"
Set-Location '$Vision'; `$env:PYTHONPATH='$Vision'; .\venv\Scripts\python.exe -m uvicorn VisionService.API.app:app --host 0.0.0.0 --port 8001
"@

# --- 6. Metro ---------------------------------------------------------------
Start-Window 'Metro 8081' @"
Set-Location '$App'; npx react-native start
"@

Wait-Port -Port 5230 -Name 'MediaStorage'   | Out-Null
Wait-Port -Port 5090 -Name 'Auth'           | Out-Null
Wait-Port -Port 5173 -Name 'Report'         | Out-Null
Wait-Port -Port 8001 -Name 'Vision'         | Out-Null
Wait-Port -Port 8081 -Name 'Metro'          | Out-Null

Write-Host "`nAll services started. Run check-demo.ps1 to test the flow.`n" -ForegroundColor Cyan
