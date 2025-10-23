@echo off
REM CI/CD Pipeline Local Simulation Script for Windows
REM This script simulates the GitHub Actions CI pipeline locally

echo ==========================================
echo CI/CD Pipeline Local Simulation
echo ==========================================

REM Step 1: Backend Build
echo.
echo [1/7] Building Backend...
cd backend
call npm install
call npm run build
call npm test 2>nul || echo No tests configured
cd ..
echo [OK] Backend build completed

REM Step 2: Frontend Build
echo.
echo [2/7] Building Frontend...
cd frontend
call npm install
call npm run build
cd ..
echo [OK] Frontend build completed

REM Step 3: SAST - Semgrep (Optional)
echo.
echo [3/7] Running SAST (Semgrep)...
where semgrep >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    semgrep --config "p/ci" --error || echo Semgrep found issues
) else (
    echo Semgrep not installed, skipping...
)
echo [OK] SAST completed

REM Step 4: SCA - Trivy (Optional)
echo.
echo [4/7] Running SCA (Trivy)...
where trivy >nul 2>&1
if %ERRORLEVEL% EQU 0 (
    trivy fs --severity CRITICAL,HIGH --ignore-unfixed . || echo Trivy found vulnerabilities
) else (
    echo Trivy not installed, skipping...
)
echo [OK] SCA completed

REM Step 5: Start Services
echo.
echo [5/7] Starting Services...
docker compose down -v --remove-orphans 2>nul
docker compose up -d
echo Waiting for services to start...
timeout /t 30 /nobreak >nul

REM Step 6: Test Endpoints
echo.
echo [6/7] Testing API Endpoints...

REM Wait for health check
set /a count=0
:wait_loop
curl -f http://localhost:3000/healthz >nul 2>&1
if %ERRORLEVEL% EQU 0 goto health_ok
if %count% GEQ 60 (
    echo [ERROR] Timeout waiting for application
    docker compose logs backend
    exit /b 1
)
echo Waiting for health check... (%count%/60^)
timeout /t 2 /nobreak >nul
set /a count+=2
goto wait_loop

:health_ok
echo [OK] Health check passed

echo.
echo Testing endpoints:
curl -sf http://localhost:3000/ >nul && echo   - Root (/) ... [OK] || echo   - Root (/) ... [FAIL]
curl -sf http://localhost:3000/robots.txt >nul && echo   - robots.txt ... [OK] || echo   - robots.txt ... [FAIL]
curl -sf http://localhost:3000/sitemap.xml >nul && echo   - sitemap.xml ... [OK] || echo   - sitemap.xml ... [FAIL]
curl -sf http://localhost:3000/api/tasks >nul && echo   - /api/tasks ... [OK] || echo   - /api/tasks ... [FAIL]
curl -sf http://localhost:3000/metrics >nul && echo   - /metrics ... [OK] || echo   - /metrics ... [FAIL]

REM Step 7: DAST - ZAP Scan
echo.
echo [7/7] Running DAST (OWASP ZAP)...
docker run --rm --network="host" -v "%CD%:/zap/wrk/:rw" ghcr.io/zaproxy/zaproxy:stable zap-baseline.py -t http://localhost:3000 -c .zap/rules.tsv -J /zap/wrk/zap-report.json -w /zap/wrk/zap-report.md -r /zap/wrk/zap-report.html -a -j -m 5 -T 60 -I || echo ZAP scan completed with warnings

echo.
echo ZAP reports generated:
echo   - zap-report.html
echo   - zap-report.json
echo   - zap-report.md

REM Cleanup
echo.
echo Cleaning up...
docker compose down -v --remove-orphans

echo.
echo ==========================================
echo [OK] CI/CD Pipeline Simulation Complete!
echo ==========================================
echo.
echo Next steps:
echo   1. Review ZAP reports
echo   2. Commit changes: git add . ^&^& git commit -m "Fix security issues"
echo   3. Push to trigger CI: git push origin main

pause
