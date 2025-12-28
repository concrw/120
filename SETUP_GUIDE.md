# 🚀 빠른 설정 가이드

## ✅ 완료된 설정

- ✅ 데이터베이스 테이블 생성 (`hybrid_avatars`, `transfer_jobs`)
- ✅ 스토리지 버킷 생성 (5개 버킷)
- ✅ 코드 빌드 성공

---

## 📝 남은 작업 (5분)

### 1️⃣ FAL AI API 키 발급 (2분)

**Phase 1.5 필수**: LoRA 학습, 이미지/영상 생성에 사용

1. https://fal.ai/dashboard 접속
2. 회원가입 또는 로그인
3. 우측 상단 프로필 → "API Keys" 클릭
4. "Create new API Key" 클릭
5. 키 이름 입력 (예: "avatar-platform")
6. 생성된 키 복사

**키를 .env.local에 추가**:
```bash
FAL_KEY=your-copied-key-here
```

### 2️⃣ Resend API 키 발급 (2분)

**Phase 1.5 필수**: 이메일 알림 발송에 사용

1. https://resend.com/signup 접속
2. 회원가입 또는 로그인
3. 좌측 메뉴 "API Keys" 클릭
4. "Create API Key" 클릭
5. 키 이름 입력 (예: "avatar-platform")
6. 생성된 키 복사

**키를 .env.local에 추가**:
```bash
RESEND_API_KEY=your-copied-key-here
```

### 3️⃣ 서버 시작 (1분)

```bash
# 개발 서버 시작
npm run dev

# 브라우저에서 접속
# http://localhost:3001
```

---

## 🎯 완성 체크리스트

### Supabase 설정
- [x] 데이터베이스 테이블 생성
- [x] 스토리지 버킷 생성 (5개)
- [x] RLS 정책 설정

### 환경 변수
- [x] Supabase 키 설정
- [x] Stripe 키 설정
- [x] Replicate 키 설정
- [x] OpenAI 키 설정
- [ ] **FAL_KEY 추가 필요**
- [ ] **RESEND_API_KEY 추가 필요**

### 선택적 설정
- [ ] Inngest 설정 (백그라운드 작업용)
- [ ] Cloudflare R2 (대용량 파일 스토리지)

---

## 🧪 테스트

환경 변수 추가 후:

```bash
# 1. 전체 시스템 검증
./scripts/setup-supabase.sh

# 2. 스토리지 버킷 확인
./scripts/check-storage.sh

# 3. API 엔드포인트 확인
./scripts/verify-api-endpoints.sh

# 4. E2E 플로우 테스트
./scripts/test-e2e-flow.sh
```

---

## 📚 참고 문서

- **[PHASE_1.5_COMPLETE.md](PHASE_1.5_COMPLETE.md)** - 완성 리포트
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - 상세 배포 가이드
- **[supabase/schema.sql](supabase/schema.sql)** - DB 스키마
- **[supabase/storage.sql](supabase/storage.sql)** - 스토리지 설정

---

## 🎉 완료 후

설정이 모두 완료되면:

1. **커스텀 아바타 생성** - `/avatars/custom` 페이지 접속
2. **Hybrid 아바타 생성** - `/avatars/hybrid` 페이지 접속
3. **Real Model Transfer** - `/transfer` 페이지 접속

---

## ❓ 트러블슈팅

### FAL AI 키가 작동하지 않을 때
- 키 앞뒤 공백 제거 확인
- 키 유효성 확인 (FAL 대시보드에서)
- .env.local 재로드: 서버 재시작

### Resend 이메일이 발송되지 않을 때
- 키 확인
- Resend 대시보드에서 도메인 인증 확인
- 개발 모드에서는 인증된 이메일만 발송 가능

### 스토리지 업로드 실패
- 버킷 public 설정 확인
- Supabase 스토리지 용량 확인
- RLS 정책 확인

---

**작성일**: 2025-12-02
**상태**: Supabase 설정 완료, API 키만 추가하면 즉시 사용 가능
