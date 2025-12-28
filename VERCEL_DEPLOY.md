# Vercel 배포 가이드

이 문서는 AI 아바타 플랫폼을 Vercel에 배포하기 위한 단계별 가이드입니다.

## 배포 준비 상태

- [x] TypeScript 빌드 성공
- [x] ESLint 검사 통과
- [x] Git 저장소 초기화 완료
- [x] 프로덕션 빌드 최적화 완료

## 빠른 배포 (CLI)

### 1. Vercel CLI 설치 및 로그인

```bash
npm i -g vercel
vercel login
```

### 2. 배포 실행

```bash
# 프로젝트 폴더에서 실행
vercel --yes

# 프로덕션 배포
vercel --prod
```

## 환경 변수 설정

Vercel Dashboard > Settings > Environment Variables에서 다음 변수를 추가하세요:

### 필수 환경 변수

| 변수명 | 설명 | 발급 위치 |
|--------|------|-----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 프로젝트 URL | [Supabase Dashboard](https://supabase.com/dashboard) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase 익명 키 | Supabase > Settings > API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase 서비스 역할 키 | Supabase > Settings > API |
| `REPLICATE_API_TOKEN` | Replicate API 토큰 | [Replicate](https://replicate.com/account/api-tokens) |
| `OPENAI_API_KEY` | OpenAI API 키 | [OpenAI](https://platform.openai.com/api-keys) |
| `FAL_KEY` | FAL AI 키 (LoRA 학습) | [FAL AI](https://fal.ai/dashboard) |
| `STRIPE_SECRET_KEY` | Stripe 시크릿 키 | [Stripe Dashboard](https://dashboard.stripe.com/apikeys) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe 공개 키 | Stripe Dashboard |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook 시크릿 | Stripe > Webhooks |
| `INNGEST_EVENT_KEY` | Inngest 이벤트 키 | [Inngest](https://app.inngest.com) |
| `INNGEST_SIGNING_KEY` | Inngest 서명 키 | Inngest Dashboard |
| `RESEND_API_KEY` | Resend 이메일 API 키 | [Resend](https://resend.com/api-keys) |
| `NEXT_PUBLIC_APP_URL` | 배포된 앱 URL | 예: `https://your-app.vercel.app` |

### CLI로 환경 변수 추가

```bash
# 예시: Supabase URL 추가
vercel env add NEXT_PUBLIC_SUPABASE_URL

# 프롬프트가 나오면 값을 입력하고 production, preview, development 선택
```

## 배포 후 설정

### 1. Supabase 데이터베이스 설정

Supabase Dashboard에서 SQL Editor를 열고 순서대로 실행:

```sql
-- 1단계: 기본 스키마
-- supabase/schema.sql 내용 실행

-- 2단계: 스토리지 버킷
-- supabase/storage.sql 내용 실행

-- 3단계: 추가 마이그레이션
-- supabase/add_video_size.sql
-- supabase/add_avatar_columns.sql
-- supabase/add_jobs_update_policy.sql
```

### 2. Stripe Webhook 설정

1. [Stripe Dashboard](https://dashboard.stripe.com/webhooks) > Webhooks
2. "Add endpoint" 클릭
3. Endpoint URL: `https://your-app.vercel.app/api/webhooks/stripe`
4. Events: `checkout.session.completed` 선택
5. Webhook signing secret을 Vercel 환경 변수에 추가

### 3. Inngest 설정

1. [Inngest Dashboard](https://app.inngest.com)에서 새 앱 생성
2. Event Key와 Signing Key 복사
3. Vercel 환경 변수에 추가
4. Inngest에서 배포 URL 등록: `https://your-app.vercel.app/api/inngest`

### 4. 도메인 설정 (선택)

```bash
# 커스텀 도메인 추가
vercel domains add your-domain.com
```

## 배포 확인

### 헬스 체크

```bash
curl https://your-app.vercel.app/api/health
```

성공 응답:
```json
{
  "status": "ok",
  "database": "connected",
  "tables": ["avatars", "products", "jobs", "credits", "credit_transactions"]
}
```

### 기능 테스트

1. 회원가입 테스트 - 10 크레딧 자동 지급 확인
2. 아바타 생성 테스트
3. 제품 업로드 테스트
4. 영상 생성 테스트
5. 크레딧 구매 테스트

## 빌드 정보

```
Route (app)                   Size     First Load JS
┌ ƒ /                         562 B    120 kB
├ ○ /auth/login              1.54 kB   176 kB
├ ƒ /create                  5.4 kB    179 kB
├ ƒ /dashboard               1.21 kB   106 kB
└ ƒ /library                 4.18 kB   164 kB
+ First Load JS shared        102 kB

○  (Static)   prerendered as static content
ƒ  (Dynamic)  server-rendered on demand
```

## 문제 해결

### 빌드 실패

```bash
# 로컬에서 빌드 테스트
npm run build

# 의존성 재설치
rm -rf node_modules package-lock.json
npm install
```

### 환경 변수 누락

```bash
# 필수 환경 변수 확인
vercel env ls
```

### Inngest 함수 등록 실패

1. Inngest Dashboard에서 함수 등록 상태 확인
2. `/api/inngest` 엔드포인트 접근 가능한지 확인
3. INNGEST_SIGNING_KEY가 올바른지 확인

### Stripe Webhook 실패

1. Webhook signing secret이 올바른지 확인
2. Stripe Dashboard에서 webhook 로그 확인
3. 엔드포인트 URL이 정확한지 확인

## 모니터링

- **Vercel**: Functions 탭에서 API 호출 로그 확인
- **Supabase**: Dashboard에서 DB 쿼리 및 스토리지 사용량 확인
- **Inngest**: Dashboard에서 백그라운드 작업 상태 확인
- **Stripe**: Dashboard에서 결제 내역 확인

## 관련 문서

- [DEPLOYMENT.md](DEPLOYMENT.md) - 상세 배포 가이드
- [README.md](README.md) - 프로젝트 개요
- [SETUP_GUIDE.md](SETUP_GUIDE.md) - 로컬 개발 환경 설정
