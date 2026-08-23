# DeepSeek API Proxy 管理脚本
# 用法: powershell -ExecutionPolicy Bypass -File utils/start-proxy.ps1
param(
    [switch]$Stop,
    [switch]$Status
)

$PROXY_PORT = 9090
$PROXY_SCRIPT = Join-Path $PSScriptRoot "api-proxy.js"

if ($Stop) {
    $conn = netstat -ano | Select-String "127.0.0.1:$PROXY_PORT.*LISTENING"
    if ($conn) {
        $pid = ($conn -split '\s+')[-1]
        Stop-Process -Id $pid -Force
        Write-Host "[proxy] Stopped (PID $pid)" -ForegroundColor Yellow
    } else {
        Write-Host "[proxy] Not running" -ForegroundColor Gray
    }
    exit
}

if ($Status) {
    $conn = netstat -ano | Select-String "127.0.0.1:$PROXY_PORT.*LISTENING"
    if ($conn) {
        $pid = ($conn -split '\s+')[-1]
        Write-Host "[proxy] Running (PID $pid, port $PROXY_PORT)" -ForegroundColor Green
    } else {
        Write-Host "[proxy] Not running" -ForegroundColor Red
    }
    exit
}

# 默认：启动 proxy（如果已在运行则跳过）
$conn = netstat -ano | Select-String "127.0.0.1:$PROXY_PORT.*LISTENING"
if ($conn) {
    $pid = ($conn -split '\s+')[-1]
    Write-Host "[proxy] Already running (PID $pid)" -ForegroundColor Green
    exit
}

Write-Host "[proxy] Starting..." -ForegroundColor Cyan
$process = Start-Process -FilePath "node" -ArgumentList "`"$PROXY_SCRIPT`"" -WindowStyle Hidden -PassThru
Start-Sleep -Seconds 1

if (-not $process.HasExited) {
    Write-Host "[proxy] Started (PID $($process.Id), port $PROXY_PORT)" -ForegroundColor Green
} else {
    Write-Host "[proxy] Failed to start" -ForegroundColor Red
}
