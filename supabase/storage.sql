-- 스토리지 버킷 생성
-- Supabase Dashboard에서 생성하거나 아래 SQL을 실행

-- 1. 제품 이미지 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 배경 이미지/영상 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('backgrounds', 'backgrounds', true)
ON CONFLICT (id) DO NOTHING;

-- 3. 생성된 영상 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-videos', 'generated-videos', true)
ON CONFLICT (id) DO NOTHING;

-- 4. 아바타 학습 데이터 버킷
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatar-training', 'avatar-training', false)
ON CONFLICT (id) DO NOTHING;

-- 5. Transfer 영상 버킷 (Phase 1.5)
INSERT INTO storage.buckets (id, name, public)
VALUES ('transfer-videos', 'transfer-videos', true)
ON CONFLICT (id) DO NOTHING;

-- 스토리지 정책 설정

-- product-images 정책
CREATE POLICY "사용자는 자신의 제품 이미지를 업로드할 수 있음"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "누구나 제품 이미지를 볼 수 있음"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

CREATE POLICY "사용자는 자신의 제품 이미지를 삭제할 수 있음"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'product-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- backgrounds 정책
CREATE POLICY "사용자는 배경을 업로드할 수 있음"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "누구나 배경을 볼 수 있음"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'backgrounds');

CREATE POLICY "사용자는 자신의 배경을 삭제할 수 있음"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'backgrounds' AND auth.uid()::text = (storage.foldername(name))[1]);

-- generated-videos 정책
CREATE POLICY "서비스가 영상을 업로드할 수 있음"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'generated-videos');

CREATE POLICY "누구나 생성된 영상을 볼 수 있음"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'generated-videos');

CREATE POLICY "사용자는 자신의 영상을 삭제할 수 있음"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'generated-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- avatar-training 정책 (비공개)
CREATE POLICY "사용자는 학습 데이터를 업로드할 수 있음"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatar-training' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "사용자는 자신의 학습 데이터를 볼 수 있음"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatar-training' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "사용자는 자신의 학습 데이터를 삭제할 수 있음"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'avatar-training' AND auth.uid()::text = (storage.foldername(name))[1]);

-- transfer-videos 정책 (Phase 1.5)
CREATE POLICY "사용자는 Transfer 영상을 업로드할 수 있음"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'transfer-videos' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "누구나 Transfer 영상을 볼 수 있음"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'transfer-videos');

CREATE POLICY "사용자는 자신의 Transfer 영상을 삭제할 수 있음"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'transfer-videos' AND auth.uid()::text = (storage.foldername(name))[1]);
