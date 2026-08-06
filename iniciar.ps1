Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  Iniciando o Backend - NestJS e Frontend - React..." -ForegroundColor Green
Write-Host "========================================================" -ForegroundColor Cyan
& .\node_modules\.bin\concurrently.ps1 -n "BACKEND,FRONTEND" -c "blue,green" "npm run dev --prefix backend" "npm run dev --prefix frontend"
