# 빠른 시작 가이드

## 🎯 5분 안에 시작하기

### 1단계: 개발 서버 실행 확인 (30초)

```bash
# 터미널에서 실행 중인지 확인
ps aux | grep "next dev"
ps aux | grep "inngest"
```

**확인:**
- ✅ Next.js: http://localhost:3001
- ✅ Inngest: http://localhost:8288

**실행 중이 아니면:**
```bash
# 터미널 1
npm run dev

# 터미널 2
npx inngest-cli@latest dev
```

### 2단계: 시스템 자동 테스트 (1분)

```bash
# 전체 시스템 테스트
./scripts/test-e2e-flow.sh
```

**기대 결과:**
```
✅ Health Check
✅ AI Services
✅ Stripe
```

### 3단계: 테스트 대시보드 확인 (1분)

```bash
open http://localhost:3001/test
```

**각 테스트 버튼 클릭:**
1. SYSTEM HEALTH → 새 탭에서 JSON 응답 확인
2. AI SERVICES → Replicate/OpenAI 연결 확인
3. STRIPE PAYMENT → Stripe API 연결 확인
4. OPEN INNGEST UI → 백그라운드 작업 대시보드

**모두 `"status": "passed"` 또는 `"healthy"` 확인**

### 4단계: 첫 사용자 플로우 테스트 (3분)

#### 4.1 회원가입
```bash
open http://localhost:3001/auth/signup
```

1. 언어 선택 (한국어/English)
2. 이메일: `test-$(date +%s)@example.com`
3. 비밀번호: `test1234`
4. "계정 만들기" 클릭

**확인:**
- ✅ 대시보드로 자동 이동
- ✅ 상단에 "크레딧: 10" 표시

#### 4.2 크레딧 확인
대시보드에서:
- 크레딧 표시: 10
- 크레딧 카드 클릭 → 거래 내역에서 "signup_bonus" 확인

---

## 🚀 전체 플로우 테스트 (선택사항)

### 아바타 생성 테스트 (약 2분)

**준비사항:**
- Replicate API 크레딧: 최소 $1
- 현재 크레딧: 10

**실행:**
1. 대시보드 → "아바타" 클릭
2. "새 아바타" 클릭
3. 이름 입력: "Sophia"
4. 스타일 선택: "fashion"
5. "아바타 생성" 클릭

**Inngest 모니터링:**
```bash
open http://localhost:8288
```
- Functions → generate-avatar → 최근 실행 확인
- Step 1: fetch-avatar (즉시)
- Step 2: generate-images (30-60초)
- Step 3: save-images (즉시)

**결과 확인:**
- 아바타 목록에서 4개 이미지 확인
- 크레딧: 0 (10 - 10)

### 제품 업로드 테스트 (약 20초)

**준비사항:**
- 테스트 이미지 파일 (최대 10MB)

**실행:**
1. 대시보드 → "제품" 클릭
2. "새 제품" 클릭
3. 이름: "Summer Dress"
4. 타입: "dress"
5. 이미지 선택 및 업로드

**결과 확인:**
- 배경이 제거된 이미지 표시
- 제품 목록에서 확인

### 크레딧 구매 테스트 (약 30초)

> **주의**: Stripe 테스트 모드 카드만 사용하세요!

**실행:**
1. 크레딧 페이지 접속
2. "Starter" 패키지 선택 (25 크레딧 - $15)
3. "구매하기" 클릭

**Stripe 테스트 카드:**
- 카드 번호: `4242 4242 4242 4242`
- 만료일: `12/34`
- CVC: `123`

**결과 확인:**
- 결제 완료 후 리다이렉트
- 크레딧: 25 (자동 충전)
- 거래 내역에 "purchase" 기록

---

## ⚠️ 주의사항

### API 비용

**아바타 생성 (10 크레딧):**
- Replicate SDXL: ~$0.10

**비디오 생성 (20 크레딧):**
- Replicate SDXL + SVD: ~$4.47
- OpenAI GPT-4/4o: ~$0.015
- **총 ~$4.50/비디오**

### 테스트 권장사항

1. **아바타 생성**: 자유롭게 테스트 가능 (비용 저렴)
2. **비디오 생성**: **최대 2-3회로 제한** (비용 높음)
3. Replicate 크레딧 최소 $10 충전 권장

---

## 🐛 문제 해결

### 서버가 실행되지 않음
```bash
# Next.js 포트 확인
lsof -i :3001

# 프로세스 종료 후 재시작
kill -9 <PID>
npm run dev
```

### Inngest UI 접속 불가
```bash
# Inngest 포트 확인
lsof -i :8288

# 재시작
pkill inngest
npx inngest-cli@latest dev
```

### 테스트 실패 시
```bash
# 환경 변수 확인
cat .env.local | grep -v "^#"

# Storage 버킷 확인
./scripts/check-storage.sh

# API 엔드포인트 확인
./scripts/verify-api-endpoints.sh
```

---

## 📚 다음 단계

### 상세 테스트
전체 기능 테스트를 원하시면:
- **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - 6가지 시나리오 상세 가이드

### 배포 준비
프로덕션 배포를 원하시면:
- **[PRODUCTION_READINESS.md](PRODUCTION_READINESS.md)** - 배포 체크리스트
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Vercel 배포 가이드

### 문서 참조
- **[README.md](README.md)** - 프로젝트 개요
- **[프로젝트_기획서.md](프로젝트_기획서.md)** - 상세 기획

---

## ✅ 체크리스트

### 기본 확인
- [ ] Next.js 서버 실행 중 (포트 3001)
- [ ] Inngest 서버 실행 중 (포트 8288)
- [ ] 자동 테스트 통과
- [ ] 테스트 대시보드 접근 가능

### 첫 사용자 플로우
- [ ] 회원가입 완료
- [ ] 초기 크레딧 10 지급
- [ ] 대시보드 접근 가능
- [ ] 크레딧 거래 내역 확인

### 선택적 테스트
- [ ] 아바타 생성 성공 (비용: $0.10)
- [ ] 제품 업로드 및 배경 제거 성공
- [ ] 크레딧 구매 테스트 (Stripe 테스트 모드)

---

## 🎉 완료!

기본 시스템 확인이 완료되었습니다. 이제 본격적인 기능 테스트나 프로덕션 배포를 진행할 수 있습니다!

**빠른 링크:**
- 테스트 대시보드: http://localhost:3001/test
- Inngest UI: http://localhost:8288
- 회원가입: http://localhost:3001/auth/signup
