@echo off
echo ==================================================
echo  Starting Luna Full-Stack App
echo  (Backend and Frontend)
echo ==================================================

echo Starting Next.js Development Server...
start "Next.js Frontend & API" cmd /c "npm run dev"

echo All services are starting up in separate windows!
echo You can safely close this main window.
