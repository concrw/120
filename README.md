# AI 패션 아바타 영상 생성 플랫폼

AI 모델이 제품(패션/뷰티)을 착용하고 다양한 배경에서 동작하는 15초 마케팅 영상을 자동으로 생성하는 플랫폼입니다.

## 프로젝트 개요

- **목적**: AI 모델이 제품을 착용한 15초 마케팅 영상 자동 생성
- **타겟**: 패션/뷰티 브랜드, 이커머스 셀러, 인플루언서, 마케팅 담당자
- **레퍼런스**: Instagram/YouTube @nikaaipovna 스타일
- **현재 버전**: Phase 1.5 완료 (2025-12-02)

## 주요 기능

### ✅ Phase 1 (MVP) - 완료
- 프리셋 아바타 생성 (5가지 스타일)
- 제품 업로드 & 자동 배경 제거
- 15초 영상 자동 생성
- 크레딧 시스템 & Stripe 결제
- 영상 라이브러리 관리

### ✅ Phase 1.5 - 완료 (2025-12-02)
- **커스텀 아바타**: 사용자 사진으로 LoRA 학습
- **Hybrid 아바타**: 다중 레퍼런스 이미지 합성
- **Real Model Transfer**: 실제 영상의 포즈를 AI로 전환
- **이메일 알림**: 작업 완료/실패 알림 (Resend)
- **향상된 처리**: FFmpeg 영상 처리, 자동 에러 핸들링

## 기술 스택

### 프론트엔드
- **프레임워크**: Next.js 15 (App Router)
- **언어**: TypeScript
- **스타일링**: Tailwind CSS
- **상태 관리**: Zustand (예정)
- **폼**: React Hook Form + Zod (예정)

### 백엔드
- **API**: Next.js API Routes
- **데이터베이스**: Supabase (PostgreSQL)
- **인증**: Supabase Auth
- **스토리지**: Cloudflare R2 (예정)
- **작업 큐**: Inngest (예정)

### AI 서비스
- **아바타 생성**: Replicate (SDXL)
- **영상 생성**: Replicate (Stable Video Diffusion)
- **LoRA 학습**: FAL AI (Phase 1.5)
- **이미지/영상 생성**: FAL AI (Phase 1.5)
- **배경 제거**: Replicate (rembg)
- **프롬프트 생성**: OpenAI GPT-4
- **이메일 알림**: Resend (Phase 1.5)

## 시작하기

### 1. 의존성 설치

```bash
npm install
```

### 2. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 입력하세요:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# AI Services (Phase 1)
REPLICATE_API_TOKEN=your_replicate_api_token
OPENAI_API_KEY=your_openai_api_key

# AI Services (Phase 1.5 - 필수)
FAL_KEY=your_fal_api_key                    # LoRA 학습, 이미지/영상 생성
RESEND_API_KEY=your_resend_api_key          # 이메일 알림

# Inngest (선택적)
INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

# Stripe
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3001
```

**Phase 1.5 필수 키 발급**:
- **FAL_KEY**: https://fal.ai/dashboard
- **RESEND_API_KEY**: https://resend.com/api-keys

자세한 설정 방법은 [SETUP_GUIDE.md](SETUP_GUIDE.md)를 참조하세요.

### 3. Supabase 설정

#### 자동 설정 (권장)
```bash
# 설정 확인
./scripts/setup-supabase.sh

# 스토리지 버킷 자동 생성
./scripts/create-storage-buckets.sh

# 환경 변수 검증
./scripts/check-env.sh
```

#### 수동 설정
Supabase Dashboard에서:
1. SQL Editor → `supabase/schema.sql` 실행 (테이블 생성)
2. SQL Editor → `supabase/storage.sql` 실행 (버킷 생성)

### 4. 개발 서버 실행

```bash
# Next.js 개발 서버 (포트 3001)
npm run dev

# Inngest 백그라운드 작업 서버 (포트 8288)
npx inngest-cli@latest dev
```

브라우저에서 [http://localhost:3001](http://localhost:3001)을 열어 결과를 확인하세요.

### 5. 시스템 테스트

테스트 대시보드에서 모든 시스템을 한번에 확인할 수 있습니다:

```bash
# 자동 테스트 스크립트 실행
./scripts/test-e2e-flow.sh
```

또는 브라우저에서 직접 확인:
- **테스트 대시보드**: http://localhost:3001/test
- **Inngest UI**: http://localhost:8288

#### 테스트 가능한 항목
- ✅ 데이터베이스 연결 및 테이블 확인
- ✅ RLS 정책 검증 (인증 필요)
- ✅ AI 서비스 통합 (Replicate, OpenAI)
- ✅ Stripe 결제 시스템
- ✅ Inngest 백그라운드 작업

## 프로젝트 구조

```
.
├── app/                    # Next.js App Router
│   ├── page.tsx           # 홈페이지
│   ├── layout.tsx         # 루트 레이아웃
│   ├── globals.css        # 전역 스타일
│   ├── test/              # 시스템 테스트 대시보드
│   ├── auth/              # 인증 (로그인/회원가입)
│   ├── dashboard/         # 사용자 대시보드
│   ├── settings/          # 사용자 설정
│   ├── create/            # 영상 생성 페이지
│   ├── avatars/           # 모델 관리
│   ├── products/          # 제품 관리
│   ├── library/           # 영상 라이브러리
│   ├── credits/           # 크레딧 구매
│   └── api/               # API Routes
│       ├── health/        # 시스템 헬스 체크
│       ├── test/          # 테스트 엔드포인트
│       ├── webhooks/      # Stripe 웹훅
│       └── inngest/       # Inngest 함수 엔드포인트
├── components/            # 재사용 가능한 컴포넌트
│   ├── LanguageProvider.tsx  # 다국어 컨텍스트
│   └── LanguageSelector.tsx  # 언어 선택 UI
├── lib/                   # 유틸리티 함수
│   ├── supabase/         # Supabase 클라이언트
│   │   ├── client.ts     # 브라우저 클라이언트
│   │   └── server.ts     # 서버 클라이언트
│   ├── inngest/          # Inngest 백그라운드 작업
│   │   ├── client.ts     # Inngest 클라이언트
│   │   └── functions/    # 백그라운드 함수
│   │       ├── generate-avatar.ts   # 아바타 생성
│   │       └── generate-video.ts    # 비디오 생성
│   ├── i18n.ts           # 다국어 번역 텍스트
│   └── getLanguage.ts    # 서버사이드 언어 가져오기
├── types/                # TypeScript 타입 정의
│   └── database.ts       # 데이터베이스 타입
├── supabase/             # Supabase 설정
│   └── schema.sql        # 데이터베이스 스키마
├── scripts/              # 유틸리티 스크립트
│   └── test-e2e-flow.sh  # E2E 테스트 스크립트
└── 프로젝트_기획서.md     # 프로젝트 상세 기획서
```

## 다국어 지원 (i18n)

플랫폼은 7개 언어를 지원합니다: 영어(en), 한국어(ko), 일본어(ja), 중국어(zh), 프랑스어(fr), 스페인어(es), 베트남어(vi)

### 구조
- **lib/i18n.ts**: 모든 페이지의 번역 텍스트 정의
- **lib/getLanguage.ts**: 서버 컴포넌트에서 쿠키로부터 언어 가져오기
- **components/LanguageProvider.tsx**: 클라이언트 컴포넌트의 언어 컨텍스트 관리

### 사용 방법

#### 서버 컴포넌트
```typescript
import { getLanguage } from "@/lib/getLanguage";
import { HOME_TRANSLATIONS } from "@/lib/i18n";

export default async function HomePage() {
  const language = await getLanguage();
  const t = HOME_TRANSLATIONS[language];

  return <h1>{t.title}</h1>;
}
```

#### 클라이언트 컴포넌트
```typescript
import { useLanguage } from "@/components/LanguageProvider";
import { CREATE_VIDEO_TRANSLATIONS } from "@/lib/i18n";

function CreateVideoForm() {
  const { language } = useLanguage();
  const t = CREATE_VIDEO_TRANSLATIONS[language];

  return <h1>{t.title}</h1>;
}
```

### 최근 수정 사항 (2025-01-23)
- ✅ LanguageProvider에서 쿠키 자동 로드 기능 추가
- ✅ LAYOUT_TRANSLATIONS에 "settings" 키 추가 (모든 언어)
- ✅ 크레딧 시스템: 비디오 생성 비용 5 → 20 크레딧으로 변경
- ✅ Create Video 페이지 한국어 표시 버그 수정

## 개발 로드맵

### ✅ Phase 1: MVP - 완료
- ✅ 프로젝트 초기화 및 데이터베이스 스키마
- ✅ Supabase 설정 및 RLS 정책
- ✅ 인증 플로우 (회원가입/로그인)
- ✅ 다국어 지원 (7개 언어)
- ✅ 사용자 대시보드 UI
- ✅ 크레딧 시스템 (Stripe 통합)
- ✅ Inngest 백그라운드 작업
- ✅ AI 서비스 통합 (Replicate, OpenAI)
- ✅ 프리셋 아바타 생성 (SDXL)
- ✅ 제품 업로드 및 배경 제거
- ✅ 영상 생성 파이프라인 (SVD)
- ✅ 영상 라이브러리 관리

### ✅ Phase 1.5: 고급 기능 - 완료 (2025-12-02)
- ✅ 커스텀 아바타 (LoRA 학습)
- ✅ Hybrid 아바타 (다중 레퍼런스)
- ✅ Real Model Transfer (영상 포즈 전환)
- ✅ 이메일 알림 시스템
- ✅ FFmpeg 영상 처리
- ✅ 향상된 에러 핸들링

### ⏳ Phase 2: 엔터프라이즈 기능 - 계획 중
- 🔲 다중 아바타 합성 (1-3명)
- 🔲 고급 동작 제어
- 🔲 커스텀 배경 (이미지/영상)
- 🔲 영상 공유 (SNS, 임베드)
- 🔲 협업 기능 (팀 워크스페이스)
- 🔲 API 제공 (REST API, Webhook)
- 🔲 배치 생성 (10-100개 동시)

## 핵심 원칙

개발 시 다음 원칙을 **절대 변경하지 마세요**:

1. **영상 길이**: 15초 고정
2. **UI 방식**: 단순한 폼 기반 (대화형 UI 금지)
3. **편집 방식**: 자동화만 지원 (수동 편집 불가)
4. **품질 기준**: 제품 디테일 90% 이상
5. **MVP 범위**: 단일 모델만 (멀티 모델은 Phase 1.5)

자세한 내용은 [프로젝트_기획서.md](프로젝트_기획서.md)를 참조하세요.

## 라이선스

Private - 상업용 프로젝트
