# 프로젝트 설정 가이드

## 1. Supabase 프로젝트 생성

### 1.1 Supabase 계정 생성 및 프로젝트 생성

1. [Supabase](https://supabase.com)에 접속하여 회원가입
2. "New Project" 클릭
3. 프로젝트 정보 입력:
   - Project Name: `avatar-platform` (또는 원하는 이름)
   - Database Password: 강력한 비밀번호 설정 (저장해두세요!)
   - Region: `Northeast Asia (Seoul)` 선택
4. "Create new project" 클릭 (약 2분 소요)

### 1.2 환경 변수 가져오기

프로젝트 생성 후:

1. 좌측 메뉴에서 "Project Settings" (톱니바퀴 아이콘) 클릭
2. "API" 섹션 클릭
3. 다음 값들을 복사:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY` (⚠️ 절대 노출하지 마세요!)

4. `.env.local` 파일 생성 및 값 입력:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

### 1.3 데이터베이스 스키마 적용

1. Supabase Dashboard에서 좌측 메뉴의 "SQL Editor" 클릭
2. "New query" 버튼 클릭
3. `supabase/schema.sql` 파일의 전체 내용을 복사하여 붙여넣기
4. "Run" 버튼 클릭 (또는 Cmd/Ctrl + Enter)
5. 성공 메시지 확인: "Success. No rows returned"

### 1.4 스키마 확인

1. 좌측 메뉴에서 "Table Editor" 클릭
2. 다음 테이블들이 생성되었는지 확인:
   - `user_profiles`
   - `avatars`
   - `products`
   - `jobs`
   - `subscriptions`
   - `credit_transactions`

### 1.5 Storage 버킷 생성 (선택적)

나중에 이미지/영상 업로드를 위한 스토리지 버킷:

1. 좌측 메뉴에서 "Storage" 클릭
2. "Create a new bucket" 클릭
3. 버킷 생성:
   - Name: `avatars` (아바타 이미지용)
   - Public bucket: ✅ 체크 (공개 접근)
   - "Create bucket" 클릭

4. 같은 방식으로 추가 버킷 생성:
   - `products` (제품 이미지용, Public)
   - `videos` (생성된 영상용, Public)

---

## 2. AI 서비스 API 키 설정

### 2.1 Midjourney API

**옵션 1: 공식 API (대기자 명단)**
- 현재 Midjourney는 공식 API를 제한적으로 제공
- [midjourney.com/api](https://www.midjourney.com/api) 접속하여 대기자 명단 등록

**옵션 2: 서드파티 서비스 (즉시 사용 가능)**

추천 서비스들:
1. **GoAPI** (https://goapi.ai)
   - Midjourney V6 지원
   - --cref 파라미터 지원
   - 가격: $0.08 per 이미지
   - 설정:
     ```bash
     MIDJOURNEY_API_KEY=your_goapi_key
     MIDJOURNEY_API_ENDPOINT=https://api.goapi.ai/midjourney
     ```

2. **UseAPI** (https://useapi.net)
   - Midjourney V6 지원
   - --cref 파라미터 지원
   - 가격: $0.07 per 이미지
   - 설정:
     ```bash
     MIDJOURNEY_API_KEY=your_useapi_key
     MIDJOURNEY_API_ENDPOINT=https://api.useapi.net/v1/midjourney
     ```

### 2.2 Google Gemini API (Veo 3.1 Fast 포함)

1. [Google AI Studio](https://aistudio.google.com/apikey) 접속
2. "Get API key" 클릭
3. API 키 복사
4. `.env.local`에 추가:
   ```bash
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key
   ```

⚠️ **주의**: Veo 3.1은 Gemini 2.0에 통합되어 있습니다. API 액세스는 대기자 명단 또는 Enterprise 계정이 필요할 수 있습니다.

### 2.3 Replicate API (이미지 합성용)

1. [Replicate](https://replicate.com) 접속 및 회원가입
2. 우측 상단 프로필 → "API tokens" 클릭
3. "Create token" 클릭
4. 토큰 복사 및 `.env.local`에 추가:
   ```bash
   REPLICATE_API_TOKEN=r8_your_token_here
   ```

### 2.4 OpenAI API (프롬프트 생성용)

1. [OpenAI Platform](https://platform.openai.com/api-keys) 접속
2. "Create new secret key" 클릭
3. Name: `avatar-platform` 입력 후 생성
4. API 키 복사 (⚠️ 한 번만 표시됩니다!)
5. `.env.local`에 추가:
   ```bash
   OPENAI_API_KEY=sk-your_key_here
   ```

---

## 3. Cloudflare R2 설정 (스토리지)

### 3.1 Cloudflare 계정 생성

1. [Cloudflare](https://dash.cloudflare.com) 접속 및 회원가입
2. 좌측 메뉴에서 "R2" 클릭
3. "Purchase R2 plan" 클릭 (무료 플랜 포함)

### 3.2 R2 버킷 생성

1. "Create bucket" 클릭
2. 버킷 이름: `avatar-platform-videos`
3. Region: `Asia-Pacific (APAC)` 선택
4. "Create bucket" 클릭

### 3.3 API 토큰 생성

1. 우측 상단 "Manage R2 API Tokens" 클릭
2. "Create API token" 클릭
3. Token name: `avatar-platform`
4. Permissions: "Object Read & Write" 선택
5. "Create API Token" 클릭
6. 다음 값들을 복사:
   - Account ID → `CLOUDFLARE_ACCOUNT_ID`
   - Access Key ID → `CLOUDFLARE_R2_ACCESS_KEY`
   - Secret Access Key → `CLOUDFLARE_R2_SECRET_KEY`

7. `.env.local`에 추가:
   ```bash
   CLOUDFLARE_ACCOUNT_ID=your_account_id
   CLOUDFLARE_R2_ACCESS_KEY=your_access_key
   CLOUDFLARE_R2_SECRET_KEY=your_secret_key
   ```

---

## 4. Inngest 설정 (작업 큐)

### 4.1 Inngest 계정 생성

1. [Inngest](https://www.inngest.com) 접속 및 회원가입
2. "Create new app" 클릭
3. App name: `avatar-platform` 입력

### 4.2 API 키 가져오기

1. Dashboard에서 "Settings" 클릭
2. "Keys" 탭 선택
3. 다음 값들을 복사:
   - Event Key → `INNGEST_EVENT_KEY`
   - Signing Key → `INNGEST_SIGNING_KEY`

4. `.env.local`에 추가:
   ```bash
   INNGEST_EVENT_KEY=your_event_key
   INNGEST_SIGNING_KEY=signkey-prod-your_signing_key
   ```

---

## 5. Stripe 설정 (결제, 나중에 추가)

### 5.1 Stripe 계정 생성

1. [Stripe](https://dashboard.stripe.com/register) 접속 및 회원가입
2. 대시보드 접속

### 5.2 API 키 가져오기 (테스트 모드)

1. 좌측 메뉴에서 "Developers" → "API keys" 클릭
2. Secret key (sk_test_...) 복사
3. `.env.local`에 추가:
   ```bash
   STRIPE_SECRET_KEY=sk_test_your_key_here
   ```

### 5.3 Webhook 설정 (나중에)

로컬 개발 시:
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

---

## 6. 최종 환경 변수 확인

`.env.local` 파일이 다음과 같이 구성되었는지 확인:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Services
MIDJOURNEY_API_KEY=your_midjourney_key
MIDJOURNEY_API_ENDPOINT=https://api.goapi.ai/midjourney
GOOGLE_GEMINI_API_KEY=your_gemini_key
REPLICATE_API_TOKEN=r8_your_token
OPENAI_API_KEY=sk-your_openai_key

# Cloudflare R2
CLOUDFLARE_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY=your_access_key
CLOUDFLARE_R2_SECRET_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET_NAME=avatar-platform-videos

# Inngest
INNGEST_EVENT_KEY=your_event_key
INNGEST_SIGNING_KEY=signkey-prod-your_signing_key

# Stripe (선택적)
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 7. 프로젝트 실행

모든 설정이 완료되면:

```bash
# 의존성 설치 (아직 안 했다면)
npm install

# 개발 서버 실행
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000) 접속하여 확인!

---

## 트러블슈팅

### Supabase 연결 오류
```
Error: Invalid API key
```
→ `.env.local` 파일이 프로젝트 루트에 있는지 확인
→ 환경 변수 이름이 정확한지 확인 (대소문자 구분)
→ 개발 서버 재시작 (`npm run dev` 종료 후 재실행)

### TypeScript 오류
```
Cannot find module '@supabase/supabase-js'
```
→ `npm install` 재실행
→ `node_modules` 폴더 삭제 후 `npm install` 재실행

### Port 이미 사용 중 오류
```
Port 3000 is already in use
```
→ 다른 Next.js 프로세스 종료
→ 또는 다른 포트 사용: `npm run dev -- -p 3001`

---

## 다음 단계

1. ✅ 프로젝트 초기화 완료
2. ✅ Supabase 설정 완료
3. ⏳ 인증 플로우 구현 (다음 작업)
4. 🔲 대시보드 UI 구현
5. 🔲 모델 생성 기능 구현

자세한 개발 로드맵은 [프로젝트_기획서.md](프로젝트_기획서.md)를 참조하세요!
