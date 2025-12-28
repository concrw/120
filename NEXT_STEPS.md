# 다음 단계 (Next Steps)

**현재 상태**: Phase 1.5 완료, 환경 변수 2개만 추가하면 완성

---

## 🎯 지금 바로 (5분)

### API 키 2개 발급

#### 1. FAL AI 키 발급
```bash
# 1. https://fal.ai/dashboard 접속
# 2. 회원가입 / 로그인
# 3. 우측 상단 프로필 → "API Keys"
# 4. "Create new API Key" 클릭
# 5. 이름 입력 (예: avatar-platform)
# 6. 생성된 키 복사
```

**사용처**:
- 커스텀 아바타 LoRA 학습
- Hybrid 아바타 이미지 합성
- Real Model Transfer 영상 생성

#### 2. Resend 키 발급
```bash
# 1. https://resend.com/signup 접속
# 2. 회원가입 / 로그인
# 3. 좌측 메뉴 "API Keys" 클릭
# 4. "Create API Key" 클릭
# 5. 이름 입력 (예: avatar-platform)
# 6. 생성된 키 복사
```

**사용처**:
- 아바타/영상 생성 완료 이메일
- 작업 실패 알림 이메일

### .env.local에 추가
```bash
# .env.local 파일 열기
# 아래 두 줄 추가 (발급받은 키로 교체)

FAL_KEY=fal-xxxxxxxxxxxxxxxxxxxxx
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxx
```

### 검증 및 실행
```bash
# 1. 환경 변수 확인
./scripts/check-env.sh

# 2. 서버 시작 (이미 실행 중이면 재시작)
npm run dev

# 3. 브라우저 접속
# http://localhost:3001
```

---

## ✅ 테스트 (10분)

### Phase 1.5 기능 테스트

#### 1. 커스텀 아바타
```
http://localhost:3001/avatars/custom

1. 사진 10-20장 업로드
2. 이름 입력
3. "Create Avatar" 클릭
4. 백그라운드에서 LoRA 학습 (15-20분)
5. 완료 시 이메일 알림 확인
```

#### 2. Hybrid 아바타
```
http://localhost:3001/avatars/hybrid

1. 얼굴/몸/헤어/피부톤 이미지 업로드
2. 가중치 조절
3. "Create Hybrid Avatar" 클릭
4. 4개 프리뷰 이미지 생성 (5분)
5. 완료 시 이메일 알림 확인
```

#### 3. Real Model Transfer
```
http://localhost:3001/transfer

1. 실제 모델 영상 업로드
2. 아바타 선택
3. 제품 선택 (선택사항)
4. "Start Transfer" 클릭
5. 포즈 추출 → 영상 생성 (20-25분)
6. 완료 시 이메일 알림 확인
```

---

## 📊 시스템 검증 (5분)

```bash
# 1. 전체 설정 확인
./scripts/setup-supabase.sh

# 2. 스토리지 버킷 확인
./scripts/check-storage.sh

# 3. API 엔드포인트 확인
./scripts/verify-api-endpoints.sh

# 4. E2E 플로우 테스트
./scripts/test-e2e-flow.sh
```

**예상 결과**:
- ✅ 모든 테이블 존재
- ✅ 모든 버킷 존재
- ✅ 모든 API 응답 정상
- ✅ 환경 변수 모두 설정됨

---

## 🚀 프로덕션 배포 (선택사항)

### Vercel 배포
```bash
# 1. Vercel 프로젝트 연결
vercel

# 2. 환경 변수 추가
vercel env add FAL_KEY
vercel env add RESEND_API_KEY

# 3. 프로덕션 배포
vercel --prod
```

### Inngest 설정
```bash
# 1. https://inngest.com 접속
# 2. 새 앱 생성
# 3. Vercel URL 등록: https://your-domain.com/api/inngest
# 4. Event Key, Signing Key 복사
# 5. Vercel 환경 변수에 추가
```

---

## 🐛 문제 해결

### FAL_KEY 에러
```bash
# 증상: "FAL_KEY not found" 에러
# 해결:
1. .env.local 파일에 FAL_KEY= 로 시작하는 줄이 있는지 확인
2. 키 앞뒤 공백 제거
3. 서버 재시작
```

### RESEND_API_KEY 에러
```bash
# 증상: 이메일 발송 실패
# 해결:
1. .env.local 파일에 RESEND_API_KEY= 로 시작하는 줄이 있는지 확인
2. Resend 대시보드에서 키 유효성 확인
3. 서버 재시작
```

### 버킷 없음 에러
```bash
# 증상: "Bucket not found" 에러
# 해결:
./scripts/create-storage-buckets.sh
```

### FFmpeg 에러
```bash
# 증상: "FFmpeg not found"
# 해결:
brew install ffmpeg  # macOS
# 또는
sudo apt-get install ffmpeg  # Ubuntu
```

---

## 📚 문서 참고

### 바로 보기
- **[SETUP_GUIDE.md](SETUP_GUIDE.md)** - 빠른 설정 (이 문서와 비슷)
- **[PROJECT_STATUS.md](PROJECT_STATUS.md)** - 전체 프로젝트 현황
- **[PHASE_1.5_COMPLETE.md](PHASE_1.5_COMPLETE.md)** - 완성 리포트

### 상세 가이드
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - 배포 상세 가이드
- **[프로젝트_기획서.md](프로젝트_기획서.md)** - 전체 기획 및 스펙
- **[.clauderules](.clauderules)** - 개발 규칙

---

## 💡 요약

### 지금 해야 할 일
1. **FAL_KEY 발급** (2분) → https://fal.ai/dashboard
2. **RESEND_API_KEY 발급** (2분) → https://resend.com/api-keys
3. **.env.local에 추가** (1분)
4. **서버 재시작** (1분)
5. **테스트** (10분)

### 완료되면
- ✅ Phase 1.5 모든 기능 사용 가능
- ✅ 커스텀 아바타 생성
- ✅ Hybrid 아바타 생성
- ✅ Real Model Transfer
- ✅ 이메일 알림 수신

---

**소요 시간**: 총 **20분** (발급 5분 + 테스트 15분)
**상태**: API 키 2개만 추가하면 즉시 완성 🎉
