# Phase 1.5 Setup Guide

Phase 1.5 기능이 모두 구현되었습니다. 아래 단계를 따라 설정하세요.

---

## 1. 데이터베이스 마이그레이션

### 1.1 새 테이블 생성

Supabase Dashboard > SQL Editor에서 다음 SQL 파일을 순서대로 실행:

```bash
# 1. Phase 1.5 테이블 생성
supabase/phase_1_5_tables.sql

# 2. Storage 버킷 생성
supabase/phase_1_5_storage.sql
```

### 1.2 생성된 테이블 확인

- `beta_invites` - 베타 초대 코드
- `beta_invite_redemptions` - 초대 사용 기록
- `feedback` - 사용자 피드백
- `custom_backgrounds` - 커스텀 배경 (이미지/영상)
- `custom_actions` - 커스텀 동작 영상
- `transfer_jobs` - Real Model Transfer 작업
- `hybrid_avatars` - 하이브리드 아바타 (부위별 조합)

### 1.3 생성된 Storage 버킷 확인

- `backgrounds` - 커스텀 배경 파일 (50MB, public)
- `avatar-training` - 커스텀 아바타 학습 이미지 (10MB, private)
- `avatar-references` - 하이브리드 아바타 레퍼런스 (10MB, private)
- `custom-actions` - 커스텀 동작 영상 (100MB, private)
- `transfer-videos` - Real Model Transfer 소스 영상 (100MB, private)

---

## 2. 환경 변수 설정

`.env.local` 파일에 다음 변수 추가:

```bash
# ===== 기존 환경 변수 =====
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # Admin 클라이언트용

INNGEST_EVENT_KEY=your_inngest_event_key
INNGEST_SIGNING_KEY=your_inngest_signing_key

STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

REPLICATE_API_TOKEN=your_replicate_token
OPENAI_API_KEY=your_openai_key

# ===== Phase 1.5 신규 환경 변수 =====

# FAL AI (LoRA 학습, 이미지/영상 생성, DWPose)
FAL_KEY=your_fal_api_key

# Resend (이메일 발송)
RESEND_API_KEY=your_resend_api_key
```

---

## 3. API 키 발급 방법

### 3.1 FAL AI

1. https://fal.ai 접속
2. 계정 생성 후 로그인
3. Dashboard > API Keys 메뉴
4. "Create API Key" 클릭
5. 생성된 키를 `FAL_KEY`에 추가

**사용 모델:**
- `fal-ai/flux-lora-fast-training` - LoRA 학습
- `fal-ai/flux-pro/v1.1` - 이미지 생성
- `fal-ai/kling-video/v1/standard/image-to-video` - 영상 생성
- `fal-ai/fast-dwpose` - DWPose 추출
- `fal-ai/birefnet/v2` - 배경 제거

### 3.2 Resend

1. https://resend.com 접속
2. 계정 생성 후 로그인
3. Dashboard > API Keys 메뉴
4. "Create API Key" 클릭
5. 생성된 키를 `RESEND_API_KEY`에 추가
6. **중요:** Sending Domain 설정 필요
   - Dashboard > Domains에서 도메인 추가
   - DNS 레코드 설정 완료
   - 검증 완료 후 이메일 발송 가능

---

## 4. 구현된 기능 목록

### 4.1 백엔드 API

| API | 경로 | 설명 |
|-----|------|------|
| 베타 초대 | `/api/beta/invite` | 초대 코드 생성/사용 |
| 피드백 | `/api/feedback` | 피드백 제출/관리 |
| 커스텀 배경 | `/api/backgrounds/upload` | 배경 업로드/삭제 |
| 커스텀 아바타 | `/api/avatars/custom` | 사진 업로드 → LoRA 학습 |
| 하이브리드 아바타 | `/api/avatars/hybrid` | 부위별 레퍼런스 조합 |
| 커스텀 동작 | `/api/actions/custom` | 동작 영상 업로드 |
| Real Model Transfer | `/api/video/transfer` | 실제 모델 영상 → AI 캐릭터 |

### 4.2 Inngest 백그라운드 함수

| 함수 | 이벤트 | 처리 내용 |
|------|--------|----------|
| `generate-custom-avatar` | `avatar/generate-custom` | LoRA 학습 + 프리뷰 생성 |
| `generate-hybrid-avatar` | `avatar/generate-hybrid` | 부위별 조합 이미지 생성 |
| `video-transfer` | `video/transfer` | DWPose 추출 + 캐릭터 교체 |

### 4.3 프론트엔드 컴포넌트

| 컴포넌트 | 파일 | 기능 |
|----------|------|------|
| `BetaInviteRedemption` | components/BetaInviteRedemption.tsx | 초대 코드 입력 |
| `ShareVideo` | components/ShareVideo.tsx | SNS 공유 / 다운로드 |
| `FeedbackWidget` | components/FeedbackWidget.tsx | 피드백 위젯 |
| `CustomBackgroundUploader` | components/CustomBackgroundUploader.tsx | 배경 업로드 |
| `MultiProductSelector` | components/MultiProductSelector.tsx | 다중 제품 선택 |
| `CustomAvatarUploader` | components/CustomAvatarUploader.tsx | 사진 10-20장 업로드 |
| `CustomActionUploader` | components/CustomActionUploader.tsx | 동작 영상 업로드 |
| `RealModelTransfer` | components/RealModelTransfer.tsx | Real Model Transfer UI |
| `HybridAvatarCreator` | components/HybridAvatarCreator.tsx | 부위별 조합 UI |

### 4.4 이메일 알림

- 영상 생성 완료
- 영상 생성 실패
- 아바타 생성 완료
- 신규 가입 환영
- 크레딧 구매 확인

모든 이메일은 한/영 자동 번역 지원

---

## 5. 크레딧 비용

| 기능 | 비용 |
|------|------|
| 기본 영상 생성 | 5 크레딧 |
| 커스텀 아바타 (LoRA 학습) | 20 크레딧 |
| 하이브리드 아바타 | 25 크레딧 |
| Real Model Transfer | 30 크레딧 |

실패 시 자동 환불 처리

---

## 6. 다음 단계

### 6.1 즉시 작업

1. Supabase SQL 실행
2. 환경 변수 설정
3. Resend 도메인 검증
4. 로컬 테스트

### 6.2 배포 전 확인사항

- [ ] Inngest Dev Server 실행 (`npx inngest-cli@latest dev`)
- [ ] 이메일 발송 테스트
- [ ] FAL AI API 키 작동 확인
- [ ] Storage 업로드 권한 확인
- [ ] 크레딧 차감/환불 로직 테스트

### 6.3 프로덕션 배포 시

1. Vercel 환경 변수에 모든 키 추가
2. Inngest Cloud 연결
3. Stripe Webhook 엔드포인트 등록
4. Resend 프로덕션 도메인 검증

---

## 7. 테스트 가이드

### 베타 초대 테스트

```bash
# 1. 초대 코드 생성 (Supabase SQL Editor)
INSERT INTO beta_invites (code, credits, max_uses)
VALUES ('WELCOME2024', 50, 100);

# 2. 프론트엔드에서 코드 입력
# BetaInviteRedemption 컴포넌트 사용

# 3. 크레딧 확인
SELECT credits FROM user_profiles WHERE id = 'user_id';
```

### 커스텀 아바타 테스트

```bash
# 1. 사진 10-20장 준비 (같은 사람, 다양한 각도)
# 2. CustomAvatarUploader 컴포넌트에서 업로드
# 3. Inngest Dashboard에서 실행 로그 확인
# 4. 완료 후 preview_images 확인
```

### Real Model Transfer 테스트

```bash
# 1. 모델 영상 촬영 (15초 이하 권장)
# 2. RealModelTransfer 컴포넌트에서 업로드
# 3. 아바타 + 제품 선택
# 4. 변환 시작
# 5. 이메일로 완료 알림 수신
```

---

## 8. 문제 해결

### FAL AI 에러

```
Error: FAL_KEY environment variable not set
```
→ `.env.local`에 `FAL_KEY` 추가 확인

### Resend 이메일 발송 안됨

```
Error: Domain not verified
```
→ Resend Dashboard > Domains에서 DNS 설정 완료

### Inngest 함수 실행 안됨

```
No functions registered
```
→ `npm run dev` 실행 후 Inngest Dev Server 확인

### Storage 업로드 실패

```
Error: new row violates row-level security policy
```
→ SQL 파일의 Storage 정책 다시 실행

---

## 9. 추가 정보

- **문서:** [프로젝트_기획서.md](./프로젝트_기획서.md)
- **SQL 파일:** `supabase/phase_1_5_*.sql`
- **Inngest 함수:** `lib/inngest/functions/`
- **FAL 클라이언트:** `lib/fal/client.ts`
- **이메일 템플릿:** `lib/email/templates.ts`

문의사항이 있으면 README.md 참고 또는 이슈 등록
