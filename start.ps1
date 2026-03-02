# Ambulance QR — start server and client in separate windows
# Run from project root: .\start.ps1

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $root

Write-Host "Starting API server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\server'; npm run dev"

Start-Sleep -Seconds 2

Write-Host "Starting client..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\client'; npm run dev"

Write-Host ""
Write-Host "Server: http://localhost:5000" -ForegroundColor Green
Write-Host "Client: http://localhost:5173" -ForegroundColor Green
Write-Host "Close the two PowerShell windows to stop." -ForegroundColor Gray
