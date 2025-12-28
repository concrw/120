-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 사용자 프로필 테이블
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  credits INTEGER DEFAULT 0,
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 사용자 프로필 자동 생성 트리거
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, credits)
  VALUES (NEW.id, 10); -- 신규 가입 시 10 크레딧 제공
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- AI 모델 (아바타) 테이블
CREATE TABLE avatars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('preset', 'custom')),
  style TEXT, -- realistic, fashion, beauty, editorial, casual
  midjourney_ref TEXT, -- --cref 파라미터
  preview_images JSONB, -- [url1, url2, url3, url4]
  lora_weights_url TEXT, -- custom 타입일 경우 LoRA 파일 URL
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 아바타 인덱스
CREATE INDEX idx_avatars_user_id ON avatars(user_id);
CREATE INDEX idx_avatars_status ON avatars(status);

-- Hybrid 아바타 테이블 (Phase 1.5)
CREATE TABLE hybrid_avatars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  references JSONB NOT NULL, -- [{part: 'face', imageUrl: '...', weight: 0.8}]
  preview_images JSONB, -- [url1, url2, url3, url4]
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_hybrid_avatars_user_id ON hybrid_avatars(user_id);
CREATE INDEX idx_hybrid_avatars_status ON hybrid_avatars(status);

-- Transfer 작업 테이블 (Phase 1.5 - Real Model Video Transfer)
CREATE TABLE transfer_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_video_url TEXT NOT NULL,
  avatar_id UUID REFERENCES avatars(id) ON DELETE SET NULL,
  product_ids UUID[], -- 여러 제품 지원
  keep_background BOOLEAN DEFAULT true,

  -- 처리 상태
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'extracting_pose', 'generating', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),

  -- 결과
  output_video_url TEXT,
  thumbnail_url TEXT,

  -- 에러 처리
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_transfer_jobs_user_id ON transfer_jobs(user_id);
CREATE INDEX idx_transfer_jobs_status ON transfer_jobs(status);
CREATE INDEX idx_transfer_jobs_created_at ON transfer_jobs(created_at DESC);

-- 제품 테이블
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('top', 'bottom', 'dress', 'shoes', 'accessories', 'beauty')),
  original_image_url TEXT NOT NULL,
  processed_image_url TEXT, -- 배경 제거된 이미지
  metadata JSONB, -- 색상, 스타일, 디테일 등
  ip_adapter_embedding TEXT, -- IP-Adapter++ 임베딩 저장 경로
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 제품 인덱스
CREATE INDEX idx_products_user_id ON products(user_id);
CREATE INDEX idx_products_type ON products(type);

-- 영상 생성 작업 테이블
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  avatar_ids UUID[] NOT NULL, -- Phase 1: 1개, Phase 1.5: 1-3개
  product_id UUID REFERENCES products(id) ON DELETE SET NULL,
  background_type TEXT NOT NULL CHECK (background_type IN ('preset', 'custom_image', 'custom_video')),
  background_id TEXT, -- 프리셋 ID 또는 커스텀 파일 URL
  action_type TEXT NOT NULL CHECK (action_type IN ('walk', 'stand_pose', 'turn', 'casual_movement', 'custom')),
  action_reference_url TEXT, -- 커스텀 동작 샘플 영상 URL
  style_references JSONB, -- 커스텀 스타일 레퍼런스 이미지 URLs

  -- 처리 상태
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  current_step TEXT, -- prompt_generation, scene_generation, video_generation, etc.

  -- 결과
  output_video_url TEXT,
  thumbnail_url TEXT,
  metadata JSONB, -- 생성 시간, 사용 크레딧, 품질 점수 등

  -- 에러 처리
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- 작업 인덱스
CREATE INDEX idx_jobs_user_id ON jobs(user_id);
CREATE INDEX idx_jobs_status ON jobs(status);
CREATE INDEX idx_jobs_created_at ON jobs(created_at DESC);

-- 구독 테이블
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_subscription_id TEXT UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('free', 'pro', 'enterprise')),
  status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due')),
  current_period_end TIMESTAMP WITH TIME ZONE,
  credits_per_month INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 구독 인덱스
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- 크레딧 거래 내역 테이블
CREATE TABLE credit_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  amount INTEGER NOT NULL, -- 음수: 사용, 양수: 충전
  type TEXT NOT NULL CHECK (type IN ('usage', 'purchase', 'refund', 'subscription')),
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 크레딧 거래 내역 인덱스
CREATE INDEX idx_credit_transactions_user_id ON credit_transactions(user_id);
CREATE INDEX idx_credit_transactions_created_at ON credit_transactions(created_at DESC);

-- Row Level Security (RLS) 활성화
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE hybrid_avatars ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- 사용자 프로필 정책
CREATE POLICY "사용자는 자신의 프로필을 볼 수 있음"
  ON user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "사용자는 자신의 프로필을 업데이트할 수 있음"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- 아바타 정책
CREATE POLICY "사용자는 자신의 아바타를 볼 수 있음"
  ON avatars FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 아바타를 생성할 수 있음"
  ON avatars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 아바타를 삭제할 수 있음"
  ON avatars FOR DELETE
  USING (auth.uid() = user_id);

-- Hybrid 아바타 정책
CREATE POLICY "사용자는 자신의 Hybrid 아바타를 볼 수 있음"
  ON hybrid_avatars FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 Hybrid 아바타를 생성할 수 있음"
  ON hybrid_avatars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 Hybrid 아바타를 삭제할 수 있음"
  ON hybrid_avatars FOR DELETE
  USING (auth.uid() = user_id);

-- Transfer 작업 정책
CREATE POLICY "사용자는 자신의 Transfer 작업을 볼 수 있음"
  ON transfer_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 Transfer 작업을 생성할 수 있음"
  ON transfer_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 제품 정책
CREATE POLICY "사용자는 자신의 제품을 볼 수 있음"
  ON products FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 제품을 생성할 수 있음"
  ON products FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 제품을 삭제할 수 있음"
  ON products FOR DELETE
  USING (auth.uid() = user_id);

-- 작업 정책
CREATE POLICY "사용자는 자신의 작업을 볼 수 있음"
  ON jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "사용자는 자신의 작업을 생성할 수 있음"
  ON jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 구독 정책
CREATE POLICY "사용자는 자신의 구독을 볼 수 있음"
  ON subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- 크레딧 거래 내역 정책
CREATE POLICY "사용자는 자신의 거래 내역을 볼 수 있음"
  ON credit_transactions FOR SELECT
  USING (auth.uid() = user_id);

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
