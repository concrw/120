# 프로덕션 배포 준비 체크리스트

## 📋 프로젝트 현황

### ✅ 완료된 기능 (MVP)

**핵심 기능:**
- [x] 사용자 인증 (회원가입/로그인)
- [x] 아바타 생성 (SDXL, 10 크레딧)
- [x] 제품 업로드 및 배경 제거 (Replicate rembg)
- [x] 비디오 생성 (Stable Video Diffusion, 20 크레딧)
- [x] 크레딧 시스템 (Stripe 통합)
- [x] 다국어 지원 (7개 언어)
- [x] 실시간 진행 상황 폴링
- [x] 재시도 기능

**인프라:**
- [x] Supabase (Database + Auth + Storage)
- [x] Inngest (백그라운드 작업)
- [x] Replicate (AI 서비스)
- [x] OpenAI (프롬프트/품질 체크)
- [x] Stripe (결제)
- [x] Next.js 15 (App Router)

**테스트:**
- [x] 시스템 헬스 체크
- [x] API 엔드포인트 검증
- [x] 테스트 대시보드
- [x] E2E 테스트 스크립트

---

## 🚀 배포 전 최종 확인

### 1. 환경 변수 확인

#### 로컬 환경
```bash
# .env.local 파일 확인
cat .env.local | grep -v "^#" | sort
```

**필수 변수 (11개):**
- [ ] `NEXT_PUBLIC_SUPABASE_URL`
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `REPLICATE_API_TOKEN`
- [ ] `OPENAI_API_KEY`
- [ ] `STRIPE_SECRET_KEY`
- [ ] `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] `INNGEST_EVENT_KEY`
- [ ] `INNGEST_SIGNING_KEY`
- [ ] `NEXT_PUBLIC_APP_URL`

#### 프로덕션 환경
Vercel Dashboard에서 모든 환경 변수를 Production Environment에 추가:

```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
vercel env add SUPABASE_SERVICE_ROLE_KEY production
vercel env add REPLICATE_API_TOKEN production
vercel env add OPENAI_API_KEY production
vercel env add STRIPE_SECRET_KEY production
vercel env add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY production
vercel env add STRIPE_WEBHOOK_SECRET production
vercel env add INNGEST_EVENT_KEY production
vercel env add INNGEST_SIGNING_KEY production
vercel env add NEXT_PUBLIC_APP_URL production
```

### 2. Supabase 설정 확인

#### Database
```bash
# 테이블 확인
curl http://localhost:3001/api/health | python3 -m json.tool
```

**확인 항목:**
- [ ] user_profiles 테이블
- [ ] avatars 테이블
- [ ] products 테이블
- [ ] jobs 테이블
- [ ] subscriptions 테이블
- [ ] credit_transactions 테이블

#### Storage
```bash
# 버킷 확인
./scripts/check-storage.sh
```

**확인 항목:**
- [ ] `products` 버킷 (Public)
- [ ] 최대 파일 크기: 10MB
- [ ] 허용 MIME 타입: image/jpeg, image/png, image/webp, image/gif

#### RLS Policies
Supabase Dashboard > Authentication > Policies 확인:
- [ ] user_profiles: SELECT/UPDATE (own data)
- [ ] avatars: SELECT/INSERT/UPDATE (own data)
- [ ] products: SELECT/INSERT/UPDATE (own data)
- [ ] jobs: SELECT/INSERT/UPDATE (own data)
- [ ] credit_transactions: SELECT (own data)

### 3. AI 서비스 크레딧 확인

#### Replicate
- [ ] 계정 활성화
- [ ] 최소 크레딧: $20 (비디오 4-5개 생성 가능)
- [ ] 사용 모델:
  - `stability-ai/sdxl` (아바타/씬 이미지)
  - `cjwbw/rembg` (배경 제거)
  - `stability-ai/stable-video-diffusion` (비디오)

#### OpenAI
- [ ] 계정 활성화
- [ ] 최소 크레딧: $10
- [ ] 사용 모델:
  - `gpt-4` (프롬프트 생성)
  - `gpt-4o` (이미지 품질 체크)

### 4. Stripe 설정 확인

#### API 키
- [ ] Secret Key (Test/Live)
- [ ] Publishable Key (Test/Live)
- [ ] Webhook Secret

#### Webhook 엔드포인트
**로컬:**
```bash
stripe listen --forward-to localhost:3001/api/webhooks/stripe
```

**프로덕션:**
- URL: `https://your-domain.com/api/webhooks/stripe`
- Events: `checkout.session.completed`

#### 크레딧 패키지 확인
코드에 정의된 패키지:
- Starter: 25 크레딧 - $15
- Popular: 50 크레딧 - $25
- Pro: 100 크레딧 - $45

### 5. Inngest 설정 확인

#### 로컬 환경
```bash
# Inngest Dev Server 실행 중 확인
curl http://localhost:8288
```

**확인 항목:**
- [ ] Dev Server 실행 중 (포트 8288)
- [ ] `generate-avatar` 함수 등록
- [ ] `generate-video` 함수 등록

#### 프로덕션 환경
1. Inngest Cloud 계정: https://www.inngest.com
2. App 생성 및 설정:
   - [ ] Event Key 발급
   - [ ] Signing Key 발급
   - [ ] 엔드포인트 등록: `https://your-domain.com/api/inngest`
   - [ ] 함수 자동 발견 확인

---

## 🧪 최종 테스트

### 자동 테스트 실행
```bash
# 1. 시스템 헬스 체크
./scripts/test-e2e-flow.sh

# 2. API 엔드포인트 검증
./scripts/verify-api-endpoints.sh

# 3. Storage 버킷 확인
./scripts/check-storage.sh
```

**예상 결과:**
- [ ] 모든 테스트 통과
- [ ] API 응답 시간 < 2초
- [ ] Database 연결 정상

### 수동 테스트 (TESTING_GUIDE.md 참조)

**시나리오 1: 회원가입**
- [ ] 회원가입 완료
- [ ] 초기 크레딧 10 지급
- [ ] 대시보드 접속

**시나리오 2: 아바타 생성**
- [ ] 스타일 선택 및 생성
- [ ] 10 크레딧 차감
- [ ] 4개 이미지 생성 (약 1-2분)
- [ ] 이미지 선택

**시나리오 3: 크레딧 구매**
- [ ] Stripe Checkout 생성
- [ ] 테스트 결제 완료
- [ ] 크레딧 자동 충전

**시나리오 4: 제품 업로드**
- [ ] 이미지 업로드
- [ ] 배경 제거 (약 10-20초)
- [ ] 처리된 이미지 확인

**시나리오 5: 비디오 생성**
- [ ] 아바타/제품/옵션 선택
- [ ] 20 크레딧 차감
- [ ] 비디오 생성 (약 5-10분)
- [ ] 5단계 워크플로우 완료
- [ ] 비디오 재생/다운로드

---

## 📊 성능 및 비용

### API 응답 시간 목표
- [ ] `/api/health`: < 500ms
- [ ] `/api/test/*`: < 2s
- [ ] Page Load: < 3s

### 예상 비용 (1000명 사용자 기준)

#### Vercel (호스팅)
- Free Tier: 100GB 대역폭, 100 Function 실행
- Pro: $20/월 (1TB 대역폭)

#### Supabase (Database + Storage)
- Free Tier: 500MB Database, 1GB Storage
- Pro: $25/월 (8GB Database, 100GB Storage)

#### Replicate (AI 생성)
사용자당 월 평균:
- 아바타 1개: $0.10
- 비디오 3개: $13.40
- **총 $13.50/사용자**
- **1000명: $13,500/월**

#### OpenAI (프롬프트/품질)
사용자당 월 평균:
- 비디오 3개: $0.05
- **1000명: $50/월**

#### Stripe (결제 수수료)
- 2.9% + $0.30/거래
- 평균 거래 $25 기준: $1.03/거래

#### Inngest (백그라운드 작업)
- Free Tier: 25,000 스텝/월
- Standard: $20/월 (100,000 스텝)

**총 예상 비용:**
- 고정비: $65-95/월 (인프라)
- 변동비: $13,550/월 (1000명, AI 생성)
- **총합: ~$13,645/월**

---

## 🔒 보안 체크리스트

### 인증 및 권한
- [ ] Supabase RLS 모든 테이블 활성화
- [ ] API 엔드포인트 인증 확인
- [ ] Service Role Key는 서버에서만 사용
- [ ] Anon Key만 클라이언트 노출

### API 키 관리
- [ ] `.env.local`은 .gitignore에 포함
- [ ] 프로덕션 키는 Vercel Secrets 사용
- [ ] Webhook Secret 검증 구현

### 데이터 보호
- [ ] 사용자 데이터 RLS로 격리
- [ ] 업로드 파일 크기 제한 (10MB)
- [ ] 허용 MIME 타입 제한

---

## 📈 모니터링 설정

### Vercel Analytics
```bash
# package.json에 추가
npm install @vercel/analytics
```

### Sentry (선택사항)
에러 추적 및 성능 모니터링:
```bash
npm install @sentry/nextjs
```

### 모니터링 대상
- [ ] API 응답 시간
- [ ] 에러 발생률
- [ ] Database 성능
- [ ] Replicate/OpenAI 사용량
- [ ] Stripe 결제 성공률
- [ ] Inngest 작업 성공률

---

## 🚢 배포 프로세스

### 1. Vercel 배포
```bash
# 프로젝트 루트에서
vercel --prod
```

**확인:**
- [ ] 빌드 성공
- [ ] 환경 변수 설정
- [ ] 도메인 연결

### 2. Inngest Cloud 설정
1. https://www.inngest.com 접속
2. App 생성
3. Vercel URL 등록: `https://your-domain.com/api/inngest`
4. 함수 발견 확인:
   - [ ] `generate-avatar`
   - [ ] `generate-video`

### 3. Stripe Webhook 업데이트
1. Stripe Dashboard > Webhooks
2. 프로덕션 엔드포인트 추가
3. Webhook Secret 업데이트

### 4. 프로덕션 테스트
```bash
# 배포된 URL로 테스트
curl https://your-domain.com/api/health
```

---

## ✅ 최종 체크리스트

### 배포 전
- [ ] 모든 자동 테스트 통과
- [ ] 수동 테스트 완료 (전체 플로우)
- [ ] 환경 변수 모두 설정
- [ ] Supabase 설정 완료
- [ ] AI 서비스 크레딧 충분
- [ ] Stripe 설정 완료
- [ ] Inngest 설정 완료
- [ ] Storage 버킷 생성

### 배포 후
- [ ] 프로덕션 헬스 체크 통과
- [ ] 회원가입 테스트
- [ ] 아바타 생성 테스트
- [ ] 크레딧 구매 테스트 (실제 결제 X)
- [ ] 비디오 생성 테스트 (1-2개)
- [ ] 모니터링 대시보드 확인

### 운영
- [ ] Vercel Analytics 활성화
- [ ] Sentry 에러 추적 (선택)
- [ ] 일일 사용량 모니터링
- [ ] 주간 비용 리뷰
- [ ] 사용자 피드백 수집

---

## 📞 문제 해결

### 배포 실패
1. Vercel 빌드 로그 확인
2. 환경 변수 누락 확인
3. Package.json dependencies 확인

### API 응답 느림
1. Database 쿼리 최적화
2. API Response 캐싱
3. CDN 설정 (이미지)

### Inngest 작업 실패
1. Inngest Dashboard 로그 확인
2. API 키 유효성 확인
3. 재시도 로직 확인 (최대 3회)

### Stripe Webhook 실패
1. Stripe Dashboard 로그 확인
2. Webhook Secret 재확인
3. 엔드포인트 접근성 확인

---

## 🎯 다음 단계 (Phase 1.5)

MVP 배포 완료 후 고려사항:

1. **커스텀 아바타**
   - 사용자 사진 업로드
   - LoRA 학습 파이프라인

2. **다중 제품 착용**
   - 1개 비디오에 3개 제품
   - IP-Adapter++ 멀티 컨트롤

3. **성능 최적화**
   - Image CDN (Cloudflare R2)
   - Database Connection Pooling
   - Redis Caching

4. **사용자 경험**
   - 이메일 알림 (완료/실패)
   - SNS 공유 기능
   - 비디오 편집 기능 (Phase 2)

5. **비즈니스 기능**
   - 구독 모델 (월정액)
   - 팀 협업 기능
   - API 제공 (B2B)

---

## 📚 참고 문서

- [README.md](README.md) - 프로젝트 개요
- [DEPLOYMENT.md](DEPLOYMENT.md) - 배포 가이드
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - 테스트 가이드
- [프로젝트_기획서.md](프로젝트_기획서.md) - 상세 기획
- [.clauderules](.clauderules) - 개발 규칙

**외부 문서:**
- Supabase: https://supabase.com/docs
- Replicate: https://replicate.com/docs
- OpenAI: https://platform.openai.com/docs
- Stripe: https://stripe.com/docs
- Inngest: https://www.inngest.com/docs
- Vercel: https://vercel.com/docs
