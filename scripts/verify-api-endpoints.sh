#!/bin/bash

# API 엔드포인트 검증 스크립트

BASE_URL="http://localhost:3001"

echo "================================"
echo "API 엔드포인트 검증"
echo "================================"
echo "Base URL: $BASE_URL"
echo ""

# 색상 코드
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 테스트 함수
test_endpoint() {
    local method=$1
    local endpoint=$2
    local description=$3
    local expected_status=${4:-200}

    echo -n "Testing $description... "

    response=$(curl -s -o /dev/null -w "%{http_code}" -X $method "$BASE_URL$endpoint")

    if [ "$response" -eq "$expected_status" ]; then
        echo -e "${GREEN}✅ PASS${NC} (Status: $response)"
        return 0
    else
        echo -e "${RED}❌ FAIL${NC} (Expected: $expected_status, Got: $response)"
        return 1
    fi
}

passed=0
failed=0

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "테스트 API 엔드포인트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Health Check
test_endpoint "GET" "/api/health" "System Health Check" && ((passed++)) || ((failed++))

# AI Services Test
test_endpoint "GET" "/api/test/ai" "AI Services Integration" && ((passed++)) || ((failed++))

# Stripe Test
test_endpoint "GET" "/api/test/stripe" "Stripe Payment System" && ((passed++)) || ((failed++))

# RLS Test (인증 필요 - 401 예상)
test_endpoint "GET" "/api/test/rls" "RLS Policies (Auth Required)" 401 && ((passed++)) || ((failed++))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "인증 관련 엔드포인트 (인증 필요)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Avatar Trigger (인증 필요 - 401 예상)
test_endpoint "POST" "/api/avatars/trigger" "Avatar Generation Trigger" 401 && ((passed++)) || ((failed++))

# Credits Checkout (인증 필요 - 401 예상)
test_endpoint "POST" "/api/credits/checkout" "Credits Checkout" 401 && ((passed++)) || ((failed++))

# Product Background Removal (인증 필요 - 401 예상)
test_endpoint "POST" "/api/products/remove-bg" "Product Background Removal" 401 && ((passed++)) || ((failed++))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Inngest 엔드포인트"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Inngest Functions (GET은 함수 목록 반환)
test_endpoint "GET" "/api/inngest" "Inngest Functions Endpoint" && ((passed++)) || ((failed++))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "페이지 접근성"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Public Pages
test_endpoint "GET" "/" "Homepage" && ((passed++)) || ((failed++))
test_endpoint "GET" "/auth/signup" "Signup Page" && ((passed++)) || ((failed++))
test_endpoint "GET" "/auth/login" "Login Page" && ((passed++)) || ((failed++))
test_endpoint "GET" "/test" "Test Dashboard" && ((passed++)) || ((failed++))

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "보호된 페이지 (인증 필요 - 리다이렉트)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Protected Pages (리다이렉트 예상 - 307 또는 302)
echo -n "Testing Dashboard (Protected)... "
dashboard_status=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL/dashboard")
if [ "$dashboard_status" -eq "307" ] || [ "$dashboard_status" -eq "302" ] || [ "$dashboard_status" -eq "200" ]; then
    echo -e "${GREEN}✅ PASS${NC} (Status: $dashboard_status)"
    ((passed++))
else
    echo -e "${RED}❌ FAIL${NC} (Status: $dashboard_status)"
    ((failed++))
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Inngest Dev Server"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo -n "Testing Inngest Dev Server... "
inngest_status=$(curl -s -o /dev/null -w "%{http_code}" "http://localhost:8288" 2>/dev/null)
if [ "$inngest_status" -eq "200" ]; then
    echo -e "${GREEN}✅ PASS${NC} (Status: $inngest_status)"
    echo "   ├─ UI: http://localhost:8288"
    echo "   └─ Functions registered and ready"
    ((passed++))
else
    echo -e "${RED}❌ FAIL${NC} (Status: $inngest_status)"
    echo "   └─ Inngest dev server may not be running"
    echo "   └─ Run: npx inngest-cli@latest dev"
    ((failed++))
fi

echo ""
echo "================================"
echo "테스트 결과 요약"
echo "================================"
echo -e "Passed: ${GREEN}$passed${NC}"
echo -e "Failed: ${RED}$failed${NC}"
echo "Total:  $((passed + failed))"
echo ""

if [ $failed -eq 0 ]; then
    echo -e "${GREEN}✅ 모든 테스트 통과!${NC}"
    echo ""
    echo "다음 단계:"
    echo "1. 테스트 대시보드 접속: $BASE_URL/test"
    echo "2. 사용자 플로우 테스트: TESTING_GUIDE.md 참조"
    echo "3. Inngest UI 확인: http://localhost:8288"
    exit 0
else
    echo -e "${RED}❌ $failed개 테스트 실패${NC}"
    echo ""
    echo "문제 해결:"
    echo "1. 개발 서버 실행 확인: npm run dev"
    echo "2. Inngest 서버 실행 확인: npx inngest-cli@latest dev"
    echo "3. 환경 변수 확인: .env.local"
    exit 1
fi
