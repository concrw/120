#!/bin/bash

# Supabase 자동 설정 스크립트

echo "================================"
echo "Supabase 자동 설정 시작"
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
echo "Supabase URL: $SUPABASE_URL"
echo ""

# 1. 테이블 생성 확인
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. 데이터베이스 테이블 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "📝 다음 테이블들을 확인합니다:"
echo "  - hybrid_avatars (Phase 1.5)"
echo "  - transfer_jobs (Phase 1.5)"
echo ""

# PostgreSQL REST API를 통한 테이블 확인
TABLES_TO_CHECK=("hybrid_avatars" "transfer_jobs")
MISSING_TABLES=()

for table in "${TABLES_TO_CHECK[@]}"; do
    RESPONSE=$(curl -s \
        -H "Authorization: Bearer $SUPABASE_KEY" \
        -H "apikey: $SUPABASE_KEY" \
        "${SUPABASE_URL}/rest/v1/${table}?limit=0")

    if echo "$RESPONSE" | grep -q "relation.*does not exist"; then
        echo "❌ '$table' 테이블이 없습니다"
        MISSING_TABLES+=("$table")
    else
        echo "✅ '$table' 테이블 존재 확인"
    fi
done

echo ""

if [ ${#MISSING_TABLES[@]} -gt 0 ]; then
    echo "⚠️  누락된 테이블 발견!"
    echo ""
    echo "📝 다음 단계를 수행하세요:"
    echo "1. Supabase Dashboard 접속: ${SUPABASE_URL/https:\/\//https://app.supabase.com/project/}"
    echo "2. 왼쪽 메뉴에서 'SQL Editor' 클릭"
    echo "3. 'New Query' 버튼 클릭"
    echo "4. supabase/schema.sql 파일 내용을 복사해서 붙여넣기"
    echo "5. 'Run' 버튼 클릭"
    echo ""
fi

# 2. 스토리지 버킷 확인
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. 스토리지 버킷 확인"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

STORAGE_API="${SUPABASE_URL}/storage/v1/bucket"
RESPONSE=$(curl -s \
    -H "Authorization: Bearer $SUPABASE_KEY" \
    -H "apikey: $SUPABASE_KEY" \
    "$STORAGE_API")

BUCKETS=("products" "backgrounds" "generated-videos" "avatar-training" "transfer-videos")
MISSING_BUCKETS=()

for bucket in "${BUCKETS[@]}"; do
    if echo "$RESPONSE" | grep -q "\"id\":\"$bucket\""; then
        echo "✅ '$bucket' 버킷 존재 확인"
    else
        echo "❌ '$bucket' 버킷이 없습니다"
        MISSING_BUCKETS+=("$bucket")
    fi
done

echo ""

if [ ${#MISSING_BUCKETS[@]} -gt 0 ]; then
    echo "⚠️  누락된 버킷 발견!"
    echo ""
    echo "📝 다음 단계를 수행하세요:"
    echo "1. Supabase Dashboard 접속: ${SUPABASE_URL/https:\/\//https://app.supabase.com/project/}"
    echo "2. 왼쪽 메뉴에서 'SQL Editor' 클릭"
    echo "3. 'New Query' 버튼 클릭"
    echo "4. supabase/storage.sql 파일 내용을 복사해서 붙여넣기"
    echo "5. 'Run' 버튼 클릭"
    echo ""
    echo "또는 Storage 메뉴에서 수동으로 생성:"
    for bucket in "${MISSING_BUCKETS[@]}"; do
        echo "  - $bucket $([ "$bucket" == "avatar-training" ] && echo "(비공개)" || echo "(공개)")"
    done
    echo ""
fi

# 요약
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "설정 확인 완료"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

if [ ${#MISSING_TABLES[@]} -eq 0 ] && [ ${#MISSING_BUCKETS[@]} -eq 0 ]; then
    echo "✅ 모든 설정이 완료되었습니다!"
    echo ""
    echo "다음 단계:"
    echo "1. .env.local에 FAL_KEY 추가"
    echo "2. .env.local에 RESEND_API_KEY 추가"
    echo "3. npm run dev로 서버 시작"
else
    echo "⚠️  설정이 완료되지 않았습니다."
    echo ""
    echo "누락된 항목:"
    [ ${#MISSING_TABLES[@]} -gt 0 ] && echo "  - 테이블: ${MISSING_TABLES[*]}"
    [ ${#MISSING_BUCKETS[@]} -gt 0 ] && echo "  - 버킷: ${MISSING_BUCKETS[*]}"
    echo ""
    echo "위의 안내를 따라 설정을 완료해주세요."
fi

echo ""
