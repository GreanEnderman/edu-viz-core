@echo off
chcp 65001 >nul
setlocal enabledelayedexpansion

echo ========================================
echo AhaTutor v2.0 Deployment Package Builder
echo ========================================
echo.

REM Check Docker
docker info >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Docker is not running. Please start Docker Desktop first.
    pause
    exit /b 1
)

REM Setup directories
set BUILD_DIR=build-release
set RELEASE_DIR=aha-tutor-release
if exist "%BUILD_DIR%" rmdir /s /q "%BUILD_DIR%"
mkdir "%BUILD_DIR%\%RELEASE_DIR%"

echo [1/6] Building Docker images...
docker compose build --no-cache
if errorlevel 1 (
    echo [ERROR] Failed to build images
    pause
    exit /b 1
)

echo.
echo [2/6] Exporting Docker images...
docker save -o "%BUILD_DIR%\%RELEASE_DIR%\backend-image.tar" ahatutor-v20-backend
docker save -o "%BUILD_DIR%\%RELEASE_DIR%\frontend-image.tar" ahatutor-v20-frontend

echo.
echo [3/6] Copying configuration files...
call :create_docker_compose
copy .env.docker.example "%BUILD_DIR%\%RELEASE_DIR%\.env.example" >nul
if exist docker xcopy /E /I /Y docker "%BUILD_DIR%\%RELEASE_DIR%\docker" >nul

mkdir "%BUILD_DIR%\%RELEASE_DIR%\data" 2>nul
if exist "data\aha_tutor.db" copy "data\aha_tutor.db" "%BUILD_DIR%\%RELEASE_DIR%\data\" >nul

echo.
echo [4/6] Creating deployment scripts...
call :create_deploy_bat
call :create_deploy_sh
call :create_readme

echo.
echo [5/6] Packaging...
cd "%BUILD_DIR%"
tar -czf ..\aha-tutor-release.tar.gz "%RELEASE_DIR%"
cd ..

echo.
echo [6/6] Cleanup...
rmdir /s /q "%BUILD_DIR%"

echo.
echo ========================================
echo Build Complete!
echo ========================================
echo.
echo Package: aha-tutor-release.tar.gz
for %%A in (aha-tutor-release.tar.gz) do echo Size: %%~zA bytes
echo.
echo Deployment Instructions:
echo   1. Upload aha-tutor-release.tar.gz to server
echo   2. Extract: tar -xzf aha-tutor-release.tar.gz
echo   3. Configure: cd aha-tutor-release ^&^& cp .env.example .env
echo   4. Deploy: ./deploy.sh (Linux/Mac) or deploy.bat (Windows)
echo.
pause
exit /b 0

:create_docker_compose
(
echo services:
echo   backend:
echo     image: ahatutor-v20-backend
echo     env_file:
echo       - .env
echo     environment:
echo       PORT: 8000
echo       DATABASE_PATH: /app/data/aha_tutor.db
echo       PLUGINS_DIR: /app/plugins
echo       ALLOWED_ORIGINS: ${ALLOWED_ORIGINS:-http://localhost}
echo     volumes:
echo       - ./data:/app/data
echo     restart: unless-stopped
echo     healthcheck:
echo       test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:8000/health', timeout=3^).read(^)"]
echo       interval: 30s
echo       timeout: 5s
echo       retries: 3
echo       start_period: 20s
echo.
echo   frontend:
echo     image: ahatutor-v20-frontend
echo     depends_on:
echo       backend:
echo         condition: service_healthy
echo     ports:
echo       - "${WEB_PORT:-80}:80"
echo     restart: unless-stopped
) > "%BUILD_DIR%\%RELEASE_DIR%\docker-compose.yml"
exit /b 0

:create_deploy_bat
(
echo @echo off
echo chcp 65001 ^>nul
echo echo ========================================
echo echo AhaTutor v2.0 Deployment Script
echo echo ========================================
echo echo.
echo.
echo docker info ^>nul 2^>^&1
echo if errorlevel 1 ^(
echo     echo [ERROR] Docker is not running
echo     pause
echo     exit /b 1
echo ^)
echo.
echo if not exist ".env" ^(
echo     if exist ".env.example" ^(
echo         copy .env.example .env ^>nul
echo         echo [WARNING] Created .env from template
echo         echo Please edit .env and configure:
echo         echo   - LLM_API_KEY
echo         echo   - ALLOWED_ORIGINS
echo         echo.
echo         pause
echo     ^) else ^(
echo         echo [ERROR] Missing .env.example
echo         pause
echo         exit /b 1
echo     ^)
echo ^)
echo.
echo echo [1/2] Loading Docker images...
echo docker load -i backend-image.tar
echo docker load -i frontend-image.tar
echo.
echo echo [2/2] Starting services...
echo docker compose up -d
echo.
echo echo ========================================
echo echo Deployment Complete!
echo echo ========================================
echo docker compose ps
echo echo.
echo echo Access: http://localhost
echo pause
) > "%BUILD_DIR%\%RELEASE_DIR%\deploy.bat"
exit /b 0

:create_deploy_sh
(
echo #!/bin/bash
echo set -e
echo echo "========================================"
echo echo "AhaTutor v2.0 Deployment Script"
echo echo "========================================"
echo echo ""
echo.
echo if ! command -v docker ^&^> /dev/null; then
echo     echo "[ERROR] Docker not found"
echo     exit 1
echo fi
echo.
echo if [ ! -f ".env" ]; then
echo     if [ -f ".env.example" ]; then
echo         cp .env.example .env
echo         echo "[WARNING] Created .env from template"
echo         echo "Please edit .env and configure:"
echo         echo "  - LLM_API_KEY"
echo         echo "  - ALLOWED_ORIGINS"
echo         read -p "Press Enter to continue..."
echo     else
echo         echo "[ERROR] Missing .env.example"
echo         exit 1
echo     fi
echo fi
echo.
echo echo "[1/2] Loading Docker images..."
echo docker load -i backend-image.tar
echo docker load -i frontend-image.tar
echo.
echo echo "[2/2] Starting services..."
echo docker compose up -d
echo.
echo echo "========================================"
echo echo "Deployment Complete!"
echo echo "========================================"
echo docker compose ps
) > "%BUILD_DIR%\%RELEASE_DIR%\deploy.sh"
exit /b 0

:create_readme
(
echo # AhaTutor v2.0 Deployment Package
echo.
echo ## Quick Start
echo.
echo ### Windows
echo 1. Extract the package
echo 2. Edit .env file
echo 3. Run deploy.bat
echo.
echo ### Linux/Mac
echo 1. tar -xzf aha-tutor-release.tar.gz
echo 2. cd aha-tutor-release
echo 3. cp .env.example .env ^&^& nano .env
echo 4. chmod +x deploy.sh ^&^& ./deploy.sh
echo.
echo ## Required Configuration
echo.
echo Edit .env:
echo - LLM_API_KEY=your-api-key
echo - LLM_BASE_URL=https://yunwu.ai/v1
echo - ALLOWED_ORIGINS=http://localhost
echo.
echo ## Access
echo - Frontend: http://localhost
echo - Backend: http://localhost:8000
echo.
echo ## Commands
echo - Status: docker compose ps
echo - Logs: docker compose logs -f
echo - Stop: docker compose down
) > "%BUILD_DIR%\%RELEASE_DIR%\README.md"
exit /b 0
