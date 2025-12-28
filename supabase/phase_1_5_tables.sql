-- Phase 1.5 New Tables Migration
-- Run this after the main schema.sql

-- 베타 초대 코드 테이블
CREATE TABLE IF NOT EXISTS beta_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  credits INTEGER DEFAULT 50,
  max_uses INTEGER DEFAULT 1,
  used_count INTEGER DEFAULT 0,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_beta_invites_code ON beta_invites(code);

-- 베타 초대 사용 기록
CREATE TABLE IF NOT EXISTS beta_invite_redemptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  invite_id UUID NOT NULL REFERENCES beta_invites(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  redeemed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_beta_redemptions_user ON beta_invite_redemptions(user_id);

-- 사용자 피드백 테이블
CREATE TABLE IF NOT EXISTS feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('bug', 'feature', 'improvement', 'other')),
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'closed')),
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_feedback_user ON feedback(user_id);
CREATE INDEX idx_feedback_status ON feedback(status);
CREATE INDEX idx_feedback_created_at ON feedback(created_at DESC);

-- 커스텀 배경 테이블
CREATE TABLE IF NOT EXISTS custom_backgrounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('image', 'video')),
  file_url TEXT NOT NULL,
  thumbnail_url TEXT,
  metadata JSONB, -- width, height, duration, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_custom_backgrounds_user ON custom_backgrounds(user_id);

-- 커스텀 동작 테이블
CREATE TABLE IF NOT EXISTS custom_actions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  video_url TEXT NOT NULL,
  dwpose_url TEXT, -- DWPose extraction result
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed')),
  metadata JSONB, -- duration, quality score, etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_custom_actions_user ON custom_actions(user_id);
CREATE INDEX idx_custom_actions_status ON custom_actions(status);

-- Real Model Transfer 작업 테이블
CREATE TABLE IF NOT EXISTS transfer_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_video_url TEXT NOT NULL,
  avatar_id UUID NOT NULL REFERENCES avatars(id) ON DELETE CASCADE,
  product_ids UUID[], -- 최대 3개
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

CREATE INDEX idx_transfer_jobs_user ON transfer_jobs(user_id);
CREATE INDEX idx_transfer_jobs_status ON transfer_jobs(status);

-- 하이브리드 아바타 테이블 (부위별 레퍼런스 조합)
CREATE TABLE IF NOT EXISTS hybrid_avatars (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,

  -- 부위별 레퍼런스
  references JSONB NOT NULL, -- { face: { url, weight }, body: { url, weight }, hair: { url, weight } }

  -- LoRA 처리
  lora_weights_url TEXT,
  preview_images JSONB, -- [url1, url2, url3, url4]
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_hybrid_avatars_user ON hybrid_avatars(user_id);
CREATE INDEX idx_hybrid_avatars_status ON hybrid_avatars(status);

-- RLS 활성화
ALTER TABLE beta_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE beta_invite_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_backgrounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transfer_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hybrid_avatars ENABLE ROW LEVEL SECURITY;

-- 베타 초대 정책 (관리자만 생성 가능, 모두 읽기 가능)
CREATE POLICY "Anyone can view beta invites"
  ON beta_invites FOR SELECT
  USING (true);

CREATE POLICY "Users can view their redemptions"
  ON beta_invite_redemptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can redeem invites"
  ON beta_invite_redemptions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 피드백 정책
CREATE POLICY "Users can view their own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 커스텀 배경 정책
CREATE POLICY "Users can view their backgrounds"
  ON custom_backgrounds FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create backgrounds"
  ON custom_backgrounds FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their backgrounds"
  ON custom_backgrounds FOR DELETE
  USING (auth.uid() = user_id);

-- 커스텀 동작 정책
CREATE POLICY "Users can view their actions"
  ON custom_actions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create actions"
  ON custom_actions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their actions"
  ON custom_actions FOR DELETE
  USING (auth.uid() = user_id);

-- Transfer 작업 정책
CREATE POLICY "Users can view their transfer jobs"
  ON transfer_jobs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create transfer jobs"
  ON transfer_jobs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 하이브리드 아바타 정책
CREATE POLICY "Users can view their hybrid avatars"
  ON hybrid_avatars FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create hybrid avatars"
  ON hybrid_avatars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their hybrid avatars"
  ON hybrid_avatars FOR DELETE
  USING (auth.uid() = user_id);

-- 자동 updated_at 트리거
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 베타 초대 사용 시 크레딧 자동 지급 함수
CREATE OR REPLACE FUNCTION handle_beta_redemption()
RETURNS TRIGGER AS $$
DECLARE
  invite_credits INTEGER;
BEGIN
  -- Get credits from invite
  SELECT credits INTO invite_credits
  FROM beta_invites
  WHERE id = NEW.invite_id;

  -- Add credits to user
  UPDATE user_profiles
  SET credits = credits + invite_credits
  WHERE id = NEW.user_id;

  -- Update invite used count
  UPDATE beta_invites
  SET used_count = used_count + 1
  WHERE id = NEW.invite_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_beta_invite_redeemed
  AFTER INSERT ON beta_invite_redemptions
  FOR EACH ROW
  EXECUTE FUNCTION handle_beta_redemption();
