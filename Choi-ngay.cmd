@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 set "PATH=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;%PATH%"
where node >nul 2>nul
if errorlevel 1 (
  echo Can cai Node.js LTS tu https://nodejs.org truoc khi mo app tren may nay.
  pause
  exit /b 1
)
if not exist "dist\index.html" (
  echo Chua co ban build. Mo README.md de xem huong dan hoac nhan Codex chay build.
  pause
  exit /b 1
)
powershell -NoProfile -Command "Start-Process -FilePath 'node' -ArgumentList 'scripts/serve.mjs' -WorkingDirectory (Get-Location).Path -WindowStyle Hidden"
timeout /t 2 /nobreak >nul
start "" "http://127.0.0.1:4173/"
