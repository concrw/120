#!/bin/bash

# Supabase Storage 버킷 확인 스크립트

echo "================================"
echo "Supabase Storage 버킷 확인"
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
    echo "NEXT_PUBLIC_SUPABASE_URL: $SUPABASE_URL"
    echo "SUPABASE_SERVICE_ROLE_KEY: [설정됨: $([ -n "$SUPABASE_KEY" ] && echo "Yes" || echo "No")]"
    echo ""
    echo "📝 .env.local 파일을 확인하세요."
    exit 1
fi

echo "✅ 환경 변수 로드 완료"
echo "Supabase URL: $SUPABASE_URL"
echo ""

# Storage API 엔드포인트
STORAGE_API="${SUPABASE_URL}/storage/v1/bucket"

echo "🔍 버킷 목록 조회 중..."
echo ""

# 버킷 목록 조회
RESPONSE=$(curl -s \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY" \
    "$STORAGE_API")

# 필수 버킷 확인
BUCKETS=("products" "backgrounds" "generated-videos" "avatar-training" "transfer-videos")

for bucket in "${BUCKETS[@]}"; do
    if echo "$RESPONSE" | grep -q "\"id\":\"$bucket\""; then
        echo "✅ '$bucket' 버킷 존재 확인"
    else
        echo "❌ '$bucket' 버킷이 없습니다!"
        echo ""
        echo "📝 다음 단계로 버킷을 생성하세요:"
        echo "1. Supabase Dashboard 접속: $SUPABASE_URL"
        echo "2. Storage 메뉴 클릭"
        echo "3. 'New Bucket' 버튼 클릭"
        echo "4. 버킷 정보 입력:"
        echo "   - Name: $bucket"
        if [ "$bucket" == "avatar-training" ]; then
            echo "   - Public bucket: ❌ (비공개)"
        else
            echo "   - Public bucket: ✅ (공개)"
        fi
        echo "5. 'Create bucket' 클릭"
        echo ""
    fi
done

echo ""
echo "================================"
echo "전체 버킷 목록:"
echo "================================"
echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
echo ""

echo "================================"
echo "버킷 확인 완료"
echo "================================"
