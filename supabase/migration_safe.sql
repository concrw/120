-- 안전한 마이그레이션: 기존 테이블이 있는 경우에도 실행 가능
-- Supabase Dashboard > SQL Editor에서 실행

-- 1. UUID extension 활성화
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. avatars 테이블에 누락된 컬럼 추가
ALTER TABLE avatars
ADD COLUMN IF NOT EXISTS image_urls JSONB,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- 3. jobs 테이블에 누락된 컬럼 추가
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS video_size TEXT DEFAULT 'vertical'
CHECK (video_size IN ('vertical', 'horizontal'));

-- 4. UPDATE 정책 추가 (이미 존재하면 무시됨)
DO $$
BEGIN
  -- avatars UPDATE 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'avatars'
    AND policyname = '사용자는 자신의 아바타를 업데이트할 수 있음'
  ) THEN
    CREATE POLICY "사용자는 자신의 아바타를 업데이트할 수 있음"
      ON avatars FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  -- jobs UPDATE 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'jobs'
    AND policyname = '사용자는 자신의 작업을 업데이트할 수 있음'
  ) THEN
    CREATE POLICY "사용자는 자신의 작업을 업데이트할 수 있음"
      ON jobs FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;

  -- products UPDATE 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'products'
    AND policyname = '사용자는 자신의 제품을 업데이트할 수 있음'
  ) THEN
    CREATE POLICY "사용자는 자신의 제품을 업데이트할 수 있음"
      ON products FOR UPDATE
      USING (auth.uid() = user_id);
  END IF;
END
$$;

-- 5. 주석 추가
COMMENT ON COLUMN avatars.image_urls IS 'Selected image URLs from preview_images array';
COMMENT ON COLUMN avatars.completed_at IS 'Timestamp when avatar generation was completed';
COMMENT ON COLUMN avatars.metadata IS 'Additional metadata including error messages';
COMMENT ON COLUMN jobs.video_size IS 'vertical: 9:16 (Shorts/Reels/TikTok), horizontal: 16:9 (YouTube)';

-- 6. 확인 쿼리 (결과 확인용)
SELECT
  'avatars 테이블 확인' as check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'avatars'
  AND column_name IN ('image_urls', 'completed_at', 'metadata')
ORDER BY column_name;

SELECT
  'jobs 테이블 확인' as check_type,
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'jobs'
  AND column_name = 'video_size';

SELECT
  'UPDATE 정책 확인' as check_type,
  tablename,
  policyname
FROM pg_policies
WHERE tablename IN ('avatars', 'jobs', 'products')
  AND policyname LIKE '%업데이트%'
ORDER BY tablename, policyname;
