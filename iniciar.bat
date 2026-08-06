@echo off
title Sistema de Gerenciamento de Custos - NestJS e React
echo ========================================================
echo   Iniciando o Backend - NestJS e Frontend - React...
echo ========================================================
call .\node_modules\.bin\concurrently.cmd -n "BACKEND,FRONTEND" -c "blue,green" "npm run dev --prefix backend" "npm run dev --prefix frontend"
pause
