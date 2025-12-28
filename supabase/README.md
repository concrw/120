# Supabase SQL Migration Guide

이 폴더에는 프로젝트의 데이터베이스 스키마와 마이그레이션 스크립트가 포함되어 있습니다.

## ⚠️ 중요: 기존 테이블이 있는 경우

**에러 발생 시 (relation already exists):**

기존에 테이블이 생성되어 있다면 `migration_safe.sql`을 사용하세요.

```sql
-- migration_safe.sql 실행
-- 기존 테이블에 누락된 컬럼과 정책만 안전하게 추가
```

이 스크립트는:
- ✅ 이미 존재하는 테이블/컬럼은 건드리지 않음
- ✅ 누락된 컬럼만 추가 (`IF NOT EXISTS` 사용)
- ✅ 누락된 RLS 정책만 추가 (중복 체크)
- ✅ 실행 후 자동으로 확인 쿼리 실행

## 실행 순서

Supabase Dashboard (https://supabase.com)의 SQL Editor에서 아래 순서대로 실행하세요:

### 방법 1: 안전한 마이그레이션 (권장)

**기존 테이블이 있거나 확실하지 않은 경우:**

```sql
-- 1. migration_safe.sql 실행
-- 모든 누락된 컬럼과 정책 추가
```

```sql
-- 2. supabase-setup.sql 실행
-- products 버킷 생성 (이미 있으면 무시됨)
```

### 방법 2: 새 프로젝트 초기 설정

**완전히 새로운 Supabase 프로젝트인 경우:**

```sql
-- 1. schema.sql 전체 실행
-- 모든 테이블, 인덱스, RLS 정책, 트리거 생성
```

```sql
-- 2. supabase-setup.sql 실행
-- products 버킷 생성 및 RLS 정책 설정
```

```sql
-- 3. migration_safe.sql 실행
-- 누락된 컬럼 추가 (video_size, image_urls 등)
```

## 주요 테이블

### user_profiles
- 사용자 프로필 및 크레딧 관리
- 신규 가입 시 자동으로 10 크레딧 지급

### avatars
- AI 모델(아바타) 정보
- MVP: preset 스타일만 지원
- 4개의 preview_images 생성 → 사용자가 1개 선택 (image_urls)

### products
- 제품 이미지 및 메타데이터
- Supabase Storage에 저장

### jobs
- 영상 생성 작업 관리
- status: pending → processing → completed/failed
- 재시도 기능 지원

### credit_transactions
- 크레딧 사용/충전 내역

## RLS (Row Level Security)

모든 테이블에 RLS가 활성화되어 있으며, 사용자는 자신의 데이터만 접근 가능합니다.

## 확인 사항

실행 후 Supabase Dashboard의 Table Editor에서 확인:

1. ✅ 모든 테이블이 생성되었는지
2. ✅ avatars 테이블에 image_urls, completed_at, metadata 컬럼이 있는지
3. ✅ jobs 테이블에 video_size 컬럼이 있는지
4. ✅ Storage에 products 버킷이 생성되었는지
5. ✅ RLS 정책이 모두 활성화되었는지
