-- avatars 테이블에 image_urls와 completed_at 컬럼 추가
ALTER TABLE avatars
ADD COLUMN IF NOT EXISTS image_urls JSONB,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS metadata JSONB;

-- avatars 테이블의 midjourney_ref 컬럼 삭제 (사용하지 않음)
ALTER TABLE avatars
DROP COLUMN IF EXISTS midjourney_ref;

-- avatars 테이블의 lora_weights_url 컬럼 삭제 (MVP에서 사용하지 않음)
ALTER TABLE avatars
DROP COLUMN IF EXISTS lora_weights_url;

COMMENT ON COLUMN avatars.image_urls IS 'Selected image URLs from preview_images array';
COMMENT ON COLUMN avatars.completed_at IS 'Timestamp when avatar generation was completed';
COMMENT ON COLUMN avatars.metadata IS 'Additional metadata including error messages';
