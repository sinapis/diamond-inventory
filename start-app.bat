@echo off
echo Starting Diamond Inventory Application...

:: Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Desktop is not running. Please start it and try again.
    pause
    exit /b
)

:: Build and start containers
echo [INFO] Building and starting containers...
docker-compose up -d --build

:: Check if started successfully
if %errorlevel% equ 0 (
    echo.
    echo [SUCCESS] Application is up and running!
    echo.
    echo Open http://localhost in your browser to view your inventory.
    echo.
    pause
) else (
    echo.
    echo [ERROR] Failed to start containers. Please check the logs.
    pause
)
