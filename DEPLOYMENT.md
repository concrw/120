# 120 프로젝트 배포 가이드

## 완료된 기능

### ✅ MVP 핵심 기능
1. **아바타 생성 및 관리**
   - 프리셋 스타일 기반 아바타 생성 (realistic, fashion, beauty, editorial, casual)
   - 4개의 preview 이미지 생성 후 사용자 선택 기능
   - 실시간 생성 상태 업데이트 (폴링)

2. **제품 업로드 및 관리**
   - 제품 이미지 업로드 (Supabase Storage)
   - 자동 배경 제거 (rembg)
   - 제품 타입별 분류 (top, bottom, dress, shoes, accessories, beauty)

3. **영상 생성**
   - 세로/가로 영상 선택 (9:16, 16:9)
   - 배경 선택 (urban street, beach, studio, cafe, park)
   - 동작 선택 (walk, stand pose, turn, casual movement)
   - 크레딧 시스템 (영상당 5 크레딧 소비)

4. **라이브러리**
   - 생성된 영상 목록 및 필터링 (all, completed, processing, failed)
   - 모달 기반 영상 재생
   - 영상 다운로드
   - 실패한 작업 재시도 기능
   - 실시간 진행 상황 업데이트 (폴링)

5. **크레딧 시스템**
   - 신규 가입 시 10 크레딧 무료 제공
   - Stripe 결제 연동 (크레딧 구매)
   - 크레딧 거래 내역 추적

6. **인증 및 보안**
   - Supabase Auth 기반 회원가입/로그인
   - Row Level Security (RLS) 적용
   - 사용자별 데이터 격리

## 배포 전 필수 작업

### 1. Supabase 설정

#### 1.1 데이터베이스 마이그레이션
Supabase Dashboard (https://supabase.com)의 SQL Editor에서 순서대로 실행:

```sql
-- 1. supabase/schema.sql 전체 실행
-- 2. supabase/supabase-setup.sql 실행
-- 3. supabase/add_video_size.sql 실행
-- 4. supabase/add_avatar_columns.sql 실행
-- 5. supabase/add_jobs_update_policy.sql 실행
```

자세한 내용은 [supabase/README.md](supabase/README.md) 참조

#### 1.2 Storage 버킷 확인
Supabase Dashboard > Storage에서 `products` 버킷이 생성되었는지 확인

### 2. 환경 변수 설정

`.env.local` 파일에 다음 변수들이 설정되어 있는지 확인:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Services
REPLICATE_API_TOKEN=your-replicate-token
OPENAI_API_KEY=your-openai-key
FAL_KEY=your-fal-api-key  # ✅ Phase 1.5에서 추가 (필수)

# Inngest
INNGEST_EVENT_KEY=your-inngest-key
INNGEST_SIGNING_KEY=your-signing-key
NEXT_PUBLIC_APP_URL=https://your-domain.com

# Email (Phase 1.5)
RESEND_API_KEY=your-resend-api-key  # ✅ Phase 1.5에서 추가 (필수)

# Stripe
STRIPE_SECRET_KEY=your-stripe-secret-key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key
STRIPE_WEBHOOK_SECRET=your-webhook-secret
```

**새로 추가된 필수 환경 변수:**
- `FAL_KEY`: LoRA 학습, 이미지/영상 생성 (https://fal.ai/dashboard)
- `RESEND_API_KEY`: 이메일 알림 발송 (https://resend.com/api-keys)

### 3. Vercel 배포

#### 3.1 Vercel 프로젝트 생성
```bash
# Vercel CLI로 로그인 (이미 실행 중)
# vercel login

# 프로젝트 배포
vercel --prod
```

#### 3.2 Vercel 환경 변수 설정
Vercel Dashboard에서 `.env.local`의 모든 변수를 Production Environment에 추가

#### 3.3 Inngest 설정
1. Inngest Dashboard (https://www.inngest.com)에서 프로젝트 생성
2. Vercel 배포 URL을 Inngest에 등록: `https://your-domain.com/api/inngest`
3. Event Key와 Signing Key를 Vercel 환경 변수에 추가

### 4. Stripe Webhook 설정

1. Stripe Dashboard (https://dashboard.stripe.com)에서 Webhook 엔드포인트 추가:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`

2. Webhook Signing Secret을 Vercel 환경 변수에 추가

## 로컬 테스트

배포 전 로컬 환경에서 먼저 테스트:

### 시스템 헬스 체크
```bash
# 자동 테스트 스크립트 실행
./scripts/test-e2e-flow.sh

# 또는 브라우저에서 테스트 대시보드 접속
open http://localhost:3001/test
```

**테스트 대시보드에서 확인:**
- ✅ 데이터베이스 연결 및 모든 테이블 존재
- ✅ RLS 정책 검증 (인증 필요)
- ✅ AI 서비스 통합 (Replicate, OpenAI)
- ✅ Stripe 결제 시스템
- ✅ Inngest 백그라운드 작업 (http://localhost:8288)

### Supabase Storage 버킷 생성

로컬 및 프로덕션 모두에서 다음 버킷 필요:

```bash
# Supabase Dashboard > Storage > New Bucket
```

1. **products** (Public)
   - 용도: 제품 이미지 원본 및 처리된 이미지
   - Public access: ✅

2. **avatars** (Public) - 선택사항
   - 용도: 아바타 이미지 (현재는 Replicate URL 직접 사용)
   - Public access: ✅

3. **videos** (Public) - 선택사항
   - 용도: 생성된 비디오 (현재는 Replicate URL 직접 사용)
   - Public access: ✅

## 테스트 체크리스트

배포 후 다음 기능들을 순서대로 테스트:

### ✅ 시스템 인프라
- [ ] 헬스 체크 API: `/api/health`
- [ ] Replicate API 연결 확인
- [ ] OpenAI API 연결 확인
- [ ] Stripe API 연결 확인
- [ ] Inngest 함수 등록 확인

### ✅ 인증
- [ ] 회원가입 (10 크레딧 자동 지급 확인)
- [ ] 로그인
- [ ] 로그아웃
- [ ] RLS 정책 작동 (다른 사용자 데이터 접근 불가)

### ✅ 아바타 생성 (10 크레딧)
- [ ] 아바타 이름 입력
- [ ] 스타일 선택 (realistic, fashion, beauty, editorial, casual)
- [ ] 크레딧 차감 확인 (10 크레딧)
- [ ] Inngest 작업 트리거 확인
- [ ] 아바타 생성 진행 상황 실시간 업데이트
- [ ] SDXL로 4개 이미지 생성 확인
- [ ] 완성된 아바타 목록에서 확인
- [ ] 크레딧 트랜잭션 기록 확인

### ✅ 제품 업로드
- [ ] 제품 이름 입력
- [ ] 제품 타입 선택
- [ ] 이미지 업로드 (최대 10MB)
- [ ] Supabase Storage에 원본 이미지 저장 확인
- [ ] Replicate rembg로 배경 자동 제거 확인
- [ ] 처리된 이미지 표시 확인
- [ ] 제품 목록에서 확인

### ✅ 비디오 생성 (20 크레딧)
- [ ] 아바타 선택
- [ ] 제품 선택
- [ ] 배경 선택 (urban street, beach, studio, cafe, park)
- [ ] 동작 선택 (walk, stand pose, turn, casual movement)
- [ ] 비디오 사이즈 선택 (9:16, 1:1, 16:9)
- [ ] 크레딧 차감 확인 (20 크레딧)
- [ ] Inngest 작업 트리거 확인
- [ ] 단계별 진행 상황:
  - [ ] 1단계: GPT-4 프롬프트 생성
  - [ ] 2단계: SDXL 씬 이미지 생성
  - [ ] 3단계: GPT-4o 품질 체크 (90점 이상)
  - [ ] 4단계: Stable Video Diffusion 비디오 생성
  - [ ] 5단계: 완료 및 저장
- [ ] 완성된 비디오 재생 확인
- [ ] 크레딧 트랜잭션 기록 확인

### ✅ 라이브러리
- [ ] 비디오 목록 조회
- [ ] 필터링 (all, completed, processing, failed)
- [ ] 진행 상황 실시간 업데이트 (폴링)
- [ ] 비디오 재생 (모달)
- [ ] 비디오 다운로드
- [ ] 실패한 작업 재시도 기능

### ✅ 크레딧 시스템
- [ ] 현재 크레딧 잔액 확인
- [ ] 크레딧 패키지 선택 (Starter/Popular/Pro)
- [ ] Stripe Checkout 세션 생성
- [ ] 결제 완료
- [ ] Webhook으로 크레딧 자동 충전 확인
- [ ] 크레딧 거래 내역 확인

## 알려진 이슈

### 개발 서버 경고
- `routes-manifest.json` 파일 없음 경고 → 무시 가능 (빌드 시 자동 생성됨)
- Webpack serialization 경고 → 성능 영향 미미, 무시 가능

### Replicate API 사용량
- SDXL 이미지 생성: 아바타당 약 $0.10
- Stable Video Diffusion: 영상당 약 $4.35
- 사용량 모니터링 필수

## 모니터링

배포 후 다음 항목들을 모니터링:

1. **Vercel Analytics**
   - 페이지 로딩 속도
   - 에러 발생률

2. **Supabase Dashboard**
   - Database 용량
   - Storage 용량
   - API 요청 수

3. **Replicate Dashboard**
   - API 사용량
   - 비용 추적

4. **Inngest Dashboard**
   - Function 실행 성공률
   - 재시도 횟수
   - 실행 시간

5. **Stripe Dashboard**
   - 결제 성공률
   - 환불 요청

## ✅ Phase 1.5 완료 기능

**Phase 1.5의 모든 기능이 구현 완료되었습니다:**

1. **✅ 커스텀 아바타**
   - 사용자 사진 업로드 (10-20장)
   - FAL AI LoRA 학습 파이프라인
   - ZIP 파일 자동 생성 및 업로드
   - 학습 완료 후 이메일 알림

2. **✅ Hybrid 아바타**
   - 다중 레퍼런스 이미지 합성
   - 부위별 가중치 조절 (얼굴, 몸, 헤어, 피부톤)
   - 4개 프리뷰 이미지 생성
   - 완료 알림 이메일

3. **✅ Real Model Video Transfer**
   - 실제 모델 영상 업로드
   - DWPose 추출 및 포즈 분석
   - FFmpeg 영상 처리 (프레임 추출/합성)
   - 아바타 + 제품 적용
   - 영상 생성 및 다운로드

4. **✅ 이메일 알림 시스템**
   - Resend 통합
   - 다국어 지원 (한국어/영어)
   - 아바타 생성 완료
   - 영상 생성 완료
   - 실패 알림 (자동 환불)

5. **✅ 향상된 에러 핸들링**
   - 커스텀 에러 클래스
   - 자동 재시도 로직
   - 크레딧 자동 환불
   - 상세한 에러 로깅

## 다음 단계 (Phase 2)

1. **다중 아바타 합성** (1-3명)
2. **고급 동작 제어** (커스텀 동작 샘플)
3. **커스텀 배경** (이미지/영상)
4. **영상 공유** (SNS, 임베드)
5. **협업 기능**
6. **API 제공**

## 지원

문제 발생 시:
1. [프로젝트 기획서](./%ED%94%84%EB%A1%9C%EC%A0%9D%ED%8A%B8_%EA%B8%B0%ED%9A%8D%EC%84%9C.md) 확인
2. [개발 규칙](.clauderules) 확인
3. 로그 확인:
   - Vercel: Function Logs
   - Inngest: Run Logs
   - Supabase: API Logs
