@echo off
echo [1/4] Stopping Docker containers...
docker-compose down

echo [2/4] Removing stale frontend distribution volume...
docker volume rm diamond-inventory_frontend_dist 2>nul

echo [3/4] Rebuilding and starting containers...
docker-compose up --build -d

echo [4/4] Done! Rebuild complete.
echo.
echo Please do a hard refresh (Ctrl+Shift+R) in your browser.
pause
