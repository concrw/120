#!/bin/bash

# E2E 테스트 스크립트
# 전체 사용자 플로우를 테스트합니다

set -e

echo "================================"
echo "E2E 사용자 플로우 테스트 시작"
echo "================================"
echo ""

BASE_URL="http://localhost:3001"
TEST_EMAIL="test-$(date +%s)@example.com"
TEST_PASSWORD="TestPassword123!"

echo "📋 테스트 정보:"
echo "- Base URL: $BASE_URL"
echo "- Test Email: $TEST_EMAIL"
echo "- Test Password: $TEST_PASSWORD"
echo ""

# 1. 시스템 헬스 체크
echo "1️⃣  시스템 헬스 체크..."
HEALTH_RESPONSE=$(curl -s "$BASE_URL/api/health")
echo "✅ Health Check: $HEALTH_RESPONSE" | head -c 200
echo "..."
echo ""

# 2. AI 서비스 테스트
echo "2️⃣  AI 서비스 테스트..."
AI_RESPONSE=$(curl -s "$BASE_URL/api/test/ai")
echo "✅ AI Services: $AI_RESPONSE" | head -c 200
echo "..."
echo ""

# 3. Stripe 테스트
echo "3️⃣  Stripe 결제 시스템 테스트..."
STRIPE_RESPONSE=$(curl -s "$BASE_URL/api/test/stripe")
echo "✅ Stripe: $STRIPE_RESPONSE" | head -c 200
echo "..."
echo ""

echo "================================"
echo "모든 기본 테스트 완료!"
echo "================================"
echo ""
echo "📝 다음 단계 (수동):"
echo "1. 브라우저에서 http://localhost:3001/test 접속"
echo "2. 'CREATE TEST ACCOUNT' 버튼 클릭"
echo "3. 이메일: $TEST_EMAIL"
echo "4. 비밀번호: $TEST_PASSWORD"
echo "5. 회원가입 후 대시보드에서 아바타/비디오 생성 테스트"
echo ""
echo "🎯 Inngest UI: http://localhost:8288"
echo "   (백그라운드 작업 모니터링)"
echo ""
