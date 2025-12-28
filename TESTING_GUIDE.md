# 사용자 플로우 테스트 가이드

## 사전 준비

### 1. 개발 서버 실행 확인
```bash
# 터미널 1: Next.js 개발 서버
npm run dev

# 터미널 2: Inngest 백그라운드 작업 서버
npx inngest-cli@latest dev
```

**확인:**
- Next.js: http://localhost:3001 접속 가능
- Inngest UI: http://localhost:8288 접속 가능

### 2. 시스템 헬스 체크
```bash
# 자동 테스트 실행
./scripts/test-e2e-flow.sh

# Storage 버킷 확인
./scripts/check-storage.sh
```

**테스트 대시보드 접속:**
- http://localhost:3001/test

**확인 항목:**
- ✅ Database: 6개 테이블 모두 존재
- ✅ AI Services: Replicate, OpenAI 연결
- ✅ Stripe: API, Webhook, Publishable Key 설정
- ✅ Inngest: Dev 서버 실행 및 함수 등록
- ✅ Storage: products 버킷 존재 (Public)

---

## 테스트 시나리오

### 시나리오 1: 신규 사용자 가입 및 크레딧 확인

#### 1.1 회원가입
1. http://localhost:3001/auth/signup 접속
2. 언어 선택 (한국어/English)
3. 이메일 입력 (예: `test-user-$(date +%s)@example.com`)
4. 비밀번호 입력 (최소 6자)
5. "계정 만들기" 클릭

**기대 결과:**
- ✅ 회원가입 성공
- ✅ 자동 로그인
- ✅ 대시보드로 리다이렉트
- ✅ 초기 크레딧 10 자동 지급

#### 1.2 크레딧 확인
1. 대시보드 상단에서 크레딧 잔액 확인
2. http://localhost:3001/credits 접속
3. "거래 내역" 탭 클릭

**기대 결과:**
- ✅ 현재 크레딧: 10
- ✅ 거래 내역에 "signup_bonus" 기록
- ✅ Amount: +10, Type: signup_bonus

---

### 시나리오 2: 아바타 생성 (10 크레딧)

#### 2.1 아바타 생성 시작
1. 대시보드에서 "아바타" 카드 클릭
2. "새 아바타" 버튼 클릭
3. 아바타 이름 입력 (예: "Sophia")
4. 스타일 선택:
   - **realistic**: 사실적인 프로페셔널 헤드샷
   - **fashion**: 하이 패션 모델, 에디토리얼
   - **beauty**: 뷰티 포토그래피
   - **editorial**: 편집 패션 사진
   - **casual**: 캐주얼 라이프스타일

5. "아바타 생성" 버튼 클릭

**기대 결과:**
- ✅ 크레딧 확인 알림 (10 크레딧 필요)
- ✅ 생성 시작 메시지
- ✅ 아바타 목록 페이지로 리다이렉트

#### 2.2 Inngest 작업 모니터링
1. http://localhost:8288 접속 (Inngest UI)
2. "Functions" 탭에서 "generate-avatar" 확인
3. 최근 실행 기록 클릭

**확인 항목:**
- ✅ Step 1: fetch-avatar (아바타 정보 조회)
- ✅ Step 2: generate-images (SDXL로 4개 이미지 생성, 약 30-60초)
- ✅ Step 3: save-images (DB 저장)
- ✅ Status: Completed

#### 2.3 생성 진행 상황 확인
1. 아바타 목록 페이지에서 대기
2. 페이지가 자동으로 폴링하여 상태 업데이트

**상태 변화:**
1. `pending` → `processing` → `completed`
2. Processing 상태일 때 스피너 표시
3. Completed 상태일 때 4개 이미지 표시

#### 2.4 아바타 선택
1. 생성된 4개 이미지 중 마음에 드는 것 선택
2. "선택" 버튼 클릭

**기대 결과:**
- ✅ 선택한 이미지가 대표 이미지로 설정
- ✅ 아바타 카드에 선택한 이미지 표시

#### 2.5 크레딧 차감 확인
1. http://localhost:3001/credits 접속
2. 현재 크레딧 확인
3. 거래 내역 확인

**기대 결과:**
- ✅ 현재 크레딧: 0 (10 - 10)
- ✅ 거래 내역에 "avatar_generation" 기록
- ✅ Amount: -10, Balance After: 0

---

### 시나리오 3: 크레딧 구매 (Stripe)

> **주의**: 실제 결제는 테스트하지 마세요. Stripe 테스트 모드 카드 사용 필요.

#### 3.1 크레딧 패키지 선택
1. http://localhost:3001/credits 접속
2. 패키지 선택:
   - **Starter**: 25 크레딧 - $15
   - **Popular**: 50 크레딧 - $25
   - **Pro**: 100 크레딧 - $45

3. "구매하기" 버튼 클릭

**기대 결과:**
- ✅ Stripe Checkout 페이지로 리다이렉트
- ✅ 선택한 패키지 정보 표시

#### 3.2 Stripe 테스트 카드 사용
테스트 모드에서만 다음 카드 번호 사용:
- **카드 번호**: 4242 4242 4242 4242
- **만료일**: 미래 날짜 (예: 12/34)
- **CVC**: 아무 3자리 (예: 123)
- **우편번호**: 아무 번호

#### 3.3 결제 완료 및 크레딧 충전
1. 결제 완료 후 리다이렉트 확인
2. 크레딧 페이지에서 잔액 확인

**기대 결과:**
- ✅ `/credits?success=true`로 리다이렉트
- ✅ 크레딧 자동 충전 (예: Starter 선택 시 25 크레딧)
- ✅ 거래 내역에 "purchase" 기록

---

### 시나리오 4: 제품 업로드 및 배경 제거

#### 4.1 제품 업로드
1. 대시보드에서 "제품" 카드 클릭
2. "새 제품" 버튼 클릭
3. 제품 정보 입력:
   - **이름**: 제품 이름 (예: "Summer Dress")
   - **타입**: 선택 (top/bottom/dress/shoes/accessories/beauty)
   - **이미지**: 파일 선택 (최대 10MB)

4. "업로드" 버튼 클릭

**기대 결과:**
- ✅ Supabase Storage에 원본 이미지 업로드
- ✅ Replicate rembg API로 배경 제거 (약 10-20초)
- ✅ 처리된 이미지 표시
- ✅ 제품 목록 페이지로 리다이렉트

#### 4.2 배경 제거 확인
1. 제품 목록에서 업로드한 제품 확인
2. 제품 카드에 처리된 이미지 표시 확인

**기대 결과:**
- ✅ 배경이 투명한 제품 이미지
- ✅ 원본 이미지와 처리된 이미지 모두 저장

---

### 시나리오 5: 비디오 생성 (20 크레딧)

> **중요**: 비디오 생성은 약 5-10분 소요되며, API 비용이 발생합니다.
> Replicate 크레딧을 확인하세요.

#### 5.1 비디오 생성 시작
1. 대시보드에서 "비디오 생성" 버튼 클릭
2. 옵션 선택:
   - **아바타**: 생성한 아바타 선택
   - **제품**: 업로드한 제품 선택
   - **배경**: urban street / beach / studio / cafe / park
   - **동작**: walk / stand pose / turn / casual movement
   - **비디오 사이즈**: 9:16 (세로) / 1:1 (정사각형) / 16:9 (가로)

3. "비디오 생성" 버튼 클릭

**기대 결과:**
- ✅ 크레딧 확인 알림 (20 크레딧 필요)
- ✅ 생성 시작 메시지
- ✅ 라이브러리 페이지로 리다이렉트

#### 5.2 Inngest 작업 모니터링
1. http://localhost:8288 접속 (Inngest UI)
2. "Functions" 탭에서 "generate-video" 확인
3. 최근 실행 기록 클릭

**5단계 워크플로우 확인:**

**Step 1: generate-prompt** (약 5-10초)
- GPT-4로 패션 씬 프롬프트 생성
- 아바타, 제품, 배경, 동작 정보 기반

**Step 2: generate-scene-image** (약 30-60초)
- SDXL로 씬 이미지 생성
- 선택한 비디오 사이즈에 맞게 해상도 설정
  - 9:16 → 1024×1344
  - 1:1 → 1024×1024
  - 16:9 → 1344×768

**Step 3: quality-check** (약 10-20초)
- GPT-4o Vision으로 이미지 품질 분석
- 90점 이상 통과
- 90점 미만 시 재시도 (최대 3회)

**Step 4: generate-video** (약 3-5분)
- Stable Video Diffusion으로 이미지→비디오 변환
- 14프레임, 6fps
- 약 2-3초 비디오 생성

**Step 5: finalize** (약 5초)
- DB에 비디오 URL 저장
- 썸네일 설정 (씬 이미지 사용)
- 상태를 `completed`로 변경

**전체 소요 시간**: 약 5-10분

#### 5.3 생성 진행 상황 확인
1. 라이브러리 페이지에서 대기
2. 페이지가 자동으로 폴링하여 상태 업데이트

**진행 상황 표시:**
- Progress: 10% → 30% → 50% → 70% → 90% → 100%
- Current Step:
  - "Generating prompt"
  - "Generating scene image"
  - "Quality check"
  - "Generating video"
  - "Finalizing"

#### 5.4 비디오 재생 및 다운로드
1. 생성 완료 후 라이브러리에서 비디오 카드 클릭
2. 모달에서 비디오 재생
3. "다운로드" 버튼 클릭

**기대 결과:**
- ✅ 비디오 정상 재생
- ✅ 썸네일 표시
- ✅ 다운로드 가능

#### 5.5 크레딧 차감 확인
1. http://localhost:3001/credits 접속
2. 거래 내역 확인

**기대 결과:**
- ✅ 거래 내역에 "video_generation" 기록
- ✅ Amount: -20
- ✅ 메타데이터에 job_id 포함

---

### 시나리오 6: 실패 처리 및 재시도

#### 6.1 품질 체크 실패 시나리오
품질 체크가 90점 미만일 경우:
- Inngest가 자동으로 재시도 (최대 3회)
- 3회 재시도 후에도 실패 시 `failed` 상태

#### 6.2 실패한 작업 재시도
1. 라이브러리에서 "Failed" 필터 선택
2. 실패한 작업 카드에서 "재시도" 버튼 클릭

**기대 결과:**
- ✅ 새로운 비디오 생성 작업 시작
- ✅ 크레딧 추가 차감 없음 (이미 차감됨)
- ✅ Inngest 작업 재실행

---

## 트러블슈팅

### 아바타 생성 실패
**증상**: 아바타 상태가 `failed`

**원인 및 해결:**
1. Replicate API 키 확인
   ```bash
   echo $REPLICATE_API_TOKEN
   ```
2. Replicate 크레딧 잔액 확인
   - https://replicate.com/account/billing
3. Inngest UI에서 에러 로그 확인
   - http://localhost:8288

### 배경 제거 실패
**증상**: 제품 이미지에 배경이 그대로 남아있음

**원인 및 해결:**
1. Replicate rembg 모델 호출 실패
2. 원본 이미지를 사용하도록 fallback 처리됨
3. `/api/products/remove-bg` API 로그 확인

### 비디오 생성 품질 체크 실패
**증상**: 비디오 생성이 계속 재시도됨

**원인 및 해결:**
1. GPT-4o가 90점 미만으로 평가
2. Inngest UI에서 품질 점수 확인
3. 프롬프트 조정 필요 시 수동으로 재생성

### Stripe Webhook 미작동
**증상**: 결제 완료 후 크레딧이 충전되지 않음

**원인 및 해결:**
1. Webhook Secret 확인
   ```bash
   echo $STRIPE_WEBHOOK_SECRET
   ```
2. Stripe Dashboard에서 Webhook 로그 확인
3. 로컬 환경에서는 Stripe CLI 사용 권장
   ```bash
   stripe listen --forward-to localhost:3001/api/webhooks/stripe
   ```

---

## API 비용 예상

### 아바타 생성 (10 크레딧)
- SDXL (4개 이미지): ~$0.10
- **총 비용**: ~$0.10

### 제품 배경 제거
- Replicate rembg: ~$0.01
- **총 비용**: ~$0.01

### 비디오 생성 (20 크레딧)
- GPT-4 프롬프트: ~$0.01
- SDXL 씬 이미지: ~$0.10
- GPT-4o 품질 체크: ~$0.005
- Stable Video Diffusion: ~$4.35
- **총 비용**: ~$4.47

### 테스트 권장 사항
1. Replicate 크레딧 최소 $10 충전
2. OpenAI API 크레딧 최소 $5 충전
3. 비디오 생성은 최대 2-3회로 제한하여 비용 절감

---

## 체크리스트

### 시스템 준비
- [ ] Next.js 개발 서버 실행 중 (포트 3001)
- [ ] Inngest Dev 서버 실행 중 (포트 8288)
- [ ] 테스트 대시보드 정상 작동
- [ ] Supabase Storage `products` 버킷 존재
- [ ] Replicate API 크레딧 충분
- [ ] OpenAI API 크레딧 충분

### 사용자 플로우
- [ ] 회원가입 및 초기 크레딧 10 지급
- [ ] 아바타 생성 (10 크레딧)
  - [ ] 4개 이미지 생성
  - [ ] 이미지 선택
  - [ ] 크레딧 차감
- [ ] 크레딧 구매 (Stripe)
  - [ ] Checkout 세션 생성
  - [ ] Webhook 크레딧 충전
- [ ] 제품 업로드
  - [ ] Storage 업로드
  - [ ] 배경 제거
- [ ] 비디오 생성 (20 크레딧)
  - [ ] 5단계 워크플로우
  - [ ] 품질 체크 통과
  - [ ] 비디오 재생
  - [ ] 크레딧 차감
- [ ] 실패 처리
  - [ ] 재시도 기능

### 문제 해결
- [ ] Inngest UI에서 작업 로그 확인 가능
- [ ] Supabase Dashboard에서 데이터 확인 가능
- [ ] Stripe Dashboard에서 결제 확인 가능
- [ ] 브라우저 콘솔에 에러 없음

---

## 다음 단계

모든 테스트가 완료되면:

1. **프로덕션 배포**
   - [DEPLOYMENT.md](DEPLOYMENT.md) 참조
   - Vercel 배포
   - Inngest Cloud 설정
   - Stripe Webhook 프로덕션 설정

2. **모니터링 설정**
   - Vercel Analytics
   - Sentry 에러 추적
   - Replicate/OpenAI 사용량 모니터링

3. **성능 최적화**
   - 이미지 CDN 설정
   - Database 인덱스 최적화
   - API Response 캐싱
