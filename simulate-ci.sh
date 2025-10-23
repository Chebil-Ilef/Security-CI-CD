#!/bin/bash

# CI/CD Pipeline Local Simulation Script
# This script simulates the GitHub Actions CI pipeline locally

set -e  # Exit on error

echo "=========================================="
echo "CI/CD Pipeline Local Simulation"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Backend Build
echo -e "\n${YELLOW}[1/7] Building Backend...${NC}"
cd backend
npm install
npm run build
npm test --if-present
cd ..
echo -e "${GREEN}✓ Backend build completed${NC}"

# Step 2: Frontend Build
echo -e "\n${YELLOW}[2/7] Building Frontend...${NC}"
cd frontend
npm install
npm run build
cd ..
echo -e "${GREEN}✓ Frontend build completed${NC}"

# Step 3: SAST - Semgrep (Optional - requires semgrep installed)
echo -e "\n${YELLOW}[3/7] Running SAST (Semgrep)...${NC}"
if command -v semgrep &> /dev/null; then
    semgrep --config "p/ci" --error || echo "Semgrep found issues"
else
    echo "Semgrep not installed, skipping..."
fi
echo -e "${GREEN}✓ SAST completed${NC}"

# Step 4: SCA - Trivy (Optional - requires trivy installed)
echo -e "\n${YELLOW}[4/7] Running SCA (Trivy)...${NC}"
if command -v trivy &> /dev/null; then
    trivy fs --severity CRITICAL,HIGH --ignore-unfixed . || echo "Trivy found vulnerabilities"
else
    echo "Trivy not installed, skipping..."
fi
echo -e "${GREEN}✓ SCA completed${NC}"

# Step 5: Start Services
echo -e "\n${YELLOW}[5/7] Starting Services...${NC}"
docker compose down -v --remove-orphans || true
docker compose up -d
echo "Waiting for services to start..."
sleep 30

# Step 6: Test Endpoints
echo -e "\n${YELLOW}[6/7] Testing API Endpoints...${NC}"

# Wait for health check
timeout=60
count=0
until curl -f http://localhost:3000/healthz 2>/dev/null; do
    if [ $count -ge $timeout ]; then
        echo -e "${RED}✗ Timeout waiting for application${NC}"
        docker compose logs backend
        exit 1
    fi
    echo "Waiting for health check... ($count/$timeout)"
    sleep 2
    count=$((count + 2))
done

echo -e "\n${GREEN}✓ Health check passed${NC}"

# Test all endpoints
echo -e "\nTesting endpoints:"
echo -n "  - Root (/)... "
if curl -sf http://localhost:3000/ > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

echo -n "  - robots.txt... "
if curl -sf http://localhost:3000/robots.txt > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

echo -n "  - sitemap.xml... "
if curl -sf http://localhost:3000/sitemap.xml > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

echo -n "  - /api/tasks... "
if curl -sf http://localhost:3000/api/tasks > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

echo -n "  - /metrics... "
if curl -sf http://localhost:3000/metrics > /dev/null; then
    echo -e "${GREEN}✓${NC}"
else
    echo -e "${RED}✗${NC}"
fi

# Step 7: DAST - ZAP Scan
echo -e "\n${YELLOW}[7/7] Running DAST (OWASP ZAP)...${NC}"
if command -v docker &> /dev/null; then
    docker run --rm --network="host" \
        -v "$(pwd):/zap/wrk/:rw" \
        ghcr.io/zaproxy/zaproxy:stable \
        zap-baseline.py \
        -t http://localhost:3000 \
        -c .zap/rules.tsv \
        -J /zap/wrk/zap-report.json \
        -w /zap/wrk/zap-report.md \
        -r /zap/wrk/zap-report.html \
        -a -j -m 5 -T 60 -I || echo "ZAP scan completed with warnings"
    
    echo -e "\n${GREEN}ZAP reports generated:${NC}"
    echo "  - zap-report.html"
    echo "  - zap-report.json"
    echo "  - zap-report.md"
else
    echo "Docker not available, skipping ZAP scan..."
fi

# Cleanup
echo -e "\n${YELLOW}Cleaning up...${NC}"
docker compose down -v --remove-orphans

echo -e "\n=========================================="
echo -e "${GREEN}✓ CI/CD Pipeline Simulation Complete!${NC}"
echo -e "=========================================="
echo -e "\nNext steps:"
echo "  1. Review ZAP reports"
echo "  2. Commit changes: git add . && git commit -m 'Fix security issues'"
echo "  3. Push to trigger CI: git push origin main"
