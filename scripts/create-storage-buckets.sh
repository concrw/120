#!/bin/bash

# Supabase 스토리지 버킷 자동 생성 스크립트

echo "================================"
echo "Supabase 스토리지 버킷 자동 생성"
echo "================================"
echo ""

# .env.local 파일에서 환경 변수 로드
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
fi

SUPABASE_URL="${NEXT_PUBLIC_SUPABASE_URL}"
SUPABASE_KEY="${SUPABASE_SERVICE_ROLE_KEY}"

if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ]; then
    echo "❌ 환경 변수가 설정되지 않았습니다."
    exit 1
fi

echo "✅ 환경 변수 로드 완료"
echo ""

STORAGE_API="${SUPABASE_URL}/storage/v1/bucket"

# 버킷 생성 함수
create_bucket() {
    local bucket_name=$1
    local is_public=$2

    echo "📦 '$bucket_name' 버킷 생성 중..."

    RESPONSE=$(curl -s -w "\n%{http_code}" \
        -X POST \
        -H "Authorization: Bearer $SUPABASE_KEY" \
        -H "apikey: $SUPABASE_KEY" \
        -H "Content-Type: application/json" \
        -d "{\"id\":\"$bucket_name\",\"name\":\"$bucket_name\",\"public\":$is_public}" \
        "$STORAGE_API")

    HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | head -n-1)

    if [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
        echo "✅ '$bucket_name' 버킷 생성 완료"
    elif echo "$BODY" | grep -q "already exists"; then
        echo "ℹ️  '$bucket_name' 버킷이 이미 존재합니다"
    else
        echo "❌ '$bucket_name' 버킷 생성 실패 (HTTP $HTTP_CODE)"
        echo "   응답: $BODY"
    fi
    echo ""
}

# 버킷 생성
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "버킷 생성 시작"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

create_bucket "backgrounds" "true"
create_bucket "generated-videos" "true"
create_bucket "avatar-training" "false"
create_bucket "transfer-videos" "true"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "버킷 생성 완료"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# 생성된 버킷 목록 확인
echo "📋 현재 버킷 목록:"
echo ""
curl -s \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY" \
    "$STORAGE_API" | python3 -c "import sys, json; buckets = json.load(sys.stdin); print('\n'.join([f\"  - {b['name']} ({'공개' if b['public'] else '비공개'})\" for b in buckets]))"

echo ""
echo "✅ 스토리지 버킷 설정 완료!"
