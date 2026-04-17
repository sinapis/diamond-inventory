@echo off
set PROJECT_NAME=diamond-inventory
echo [1/6] Cleaning up local host artifacts...
if exist "frontend\dist" (
    echo [INFO] Removing local frontend\dist folder...
    cmd /c "rmdir /s /q frontend\dist"
)

echo [2/6] Checking Sinapis Infrastructure (Nginx)...
docker ps --format "{{.Names}}" | findstr "sinapis-infra-nginx-1" >nul
if %errorlevel% neq 0 (
    echo [INFO] Nginx infrastructure is not running.
) else (
    echo [INFO] Nginx is running. Force-removing it to release volume locks...
    docker rm -f sinapis-infra-nginx-1
)

echo [3/6] Stopping current %PROJECT_NAME% containers...
docker-compose down

echo [4/6] Removing stale frontend distribution volumes...
docker volume rm %PROJECT_NAME%_frontend_dist 2>nul
docker volume rm multi-app_%PROJECT_NAME%_frontend_dist 2>nul

echo [5/6] Rebuilding and starting containers (forcing no-cache)...
docker-compose build --no-cache
docker-compose up -d

echo [6/6] Restarting Nginx Infrastructure...
pushd ..\sinapis-infra
docker-compose up -d
popd

echo.
echo [DONE] Rebuild complete! Everything is fresh.
echo Please do a hard refresh (Ctrl+Shift+R) in your browser.
pause
