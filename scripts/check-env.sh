#!/bin/bash

# 환경 변수 검증 스크립트

echo "================================"
echo "환경 변수 검증"
echo "================================"
echo ""

# .env.local 파일 확인
if [ ! -f .env.local ]; then
    echo "❌ .env.local 파일이 없습니다!"
    exit 1
fi

# 환경 변수 로드
export $(cat .env.local | grep -v '^#' | xargs)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "필수 환경 변수 (Phase 1 - MVP)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Supabase
if [ -n "$NEXT_PUBLIC_SUPABASE_URL" ]; then
    echo "✅ NEXT_PUBLIC_SUPABASE_URL"
else
    echo "❌ NEXT_PUBLIC_SUPABASE_URL"
fi

if [ -n "$NEXT_PUBLIC_SUPABASE_ANON_KEY" ]; then
    echo "✅ NEXT_PUBLIC_SUPABASE_ANON_KEY"
else
    echo "❌ NEXT_PUBLIC_SUPABASE_ANON_KEY"
fi

if [ -n "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "✅ SUPABASE_SERVICE_ROLE_KEY"
else
    echo "❌ SUPABASE_SERVICE_ROLE_KEY"
fi

# AI Services (Phase 1)
if [ -n "$REPLICATE_API_TOKEN" ]; then
    echo "✅ REPLICATE_API_TOKEN"
else
    echo "❌ REPLICATE_API_TOKEN"
fi

if [ -n "$OPENAI_API_KEY" ]; then
    echo "✅ OPENAI_API_KEY"
else
    echo "❌ OPENAI_API_KEY"
fi

# Stripe
if [ -n "$STRIPE_SECRET_KEY" ]; then
    echo "✅ STRIPE_SECRET_KEY"
else
    echo "❌ STRIPE_SECRET_KEY"
fi

if [ -n "$NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY" ]; then
    echo "✅ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
else
    echo "❌ NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY"
fi

if [ -n "$STRIPE_WEBHOOK_SECRET" ]; then
    echo "✅ STRIPE_WEBHOOK_SECRET"
else
    echo "❌ STRIPE_WEBHOOK_SECRET"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "필수 환경 변수 (Phase 1.5)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# FAL AI (Phase 1.5 필수)
if [ -n "$FAL_KEY" ]; then
    echo "✅ FAL_KEY"
else
    echo "❌ FAL_KEY - Phase 1.5 기능에 필수!"
    echo "   발급: https://fal.ai/dashboard"
fi

# Resend (Phase 1.5 필수)
if [ -n "$RESEND_API_KEY" ]; then
    echo "✅ RESEND_API_KEY"
else
    echo "❌ RESEND_API_KEY - Phase 1.5 기능에 필수!"
    echo "   발급: https://resend.com/api-keys"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "선택적 환경 변수"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Inngest (백그라운드 작업)
if [ -n "$INNGEST_EVENT_KEY" ] && [ -n "$INNGEST_SIGNING_KEY" ]; then
    echo "✅ Inngest 설정됨"
else
    echo "⚠️  Inngest 미설정 (백그라운드 작업 제한됨)"
    echo "   로컬: npx inngest-cli@latest dev"
    echo "   프로덕션: https://inngest.com"
fi

# Cloudflare R2 (대용량 파일)
if [ -n "$CLOUDFLARE_ACCOUNT_ID" ]; then
    echo "✅ Cloudflare R2 설정됨"
else
    echo "⚠️  Cloudflare R2 미설정 (Supabase Storage 사용)"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "검증 완료"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 결과 요약
MISSING_COUNT=0

[ -z "$FAL_KEY" ] && ((MISSING_COUNT++))
[ -z "$RESEND_API_KEY" ] && ((MISSING_COUNT++))

if [ $MISSING_COUNT -eq 0 ]; then
    echo "✅ 모든 필수 환경 변수가 설정되었습니다!"
    echo ""
    echo "다음 단계:"
    echo "1. npm run dev - 개발 서버 시작"
    echo "2. http://localhost:3001 - 브라우저 접속"
    echo "3. Phase 1.5 기능 테스트"
else
    echo "⚠️  $MISSING_COUNT개의 필수 환경 변수가 누락되었습니다."
    echo ""
    echo "누락된 키:"
    [ -z "$FAL_KEY" ] && echo "  - FAL_KEY (https://fal.ai/dashboard)"
    [ -z "$RESEND_API_KEY" ] && echo "  - RESEND_API_KEY (https://resend.com/api-keys)"
    echo ""
    echo ".env.local 파일에 추가 후 서버를 재시작하세요."
fi

echo ""
