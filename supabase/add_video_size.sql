-- jobs 테이블에 video_size 컬럼 추가
ALTER TABLE jobs
ADD COLUMN IF NOT EXISTS video_size TEXT DEFAULT 'vertical'
CHECK (video_size IN ('vertical', 'horizontal'));

COMMENT ON COLUMN jobs.video_size IS 'vertical: 9:16 (Shorts/Reels/TikTok), horizontal: 16:9 (YouTube)';
