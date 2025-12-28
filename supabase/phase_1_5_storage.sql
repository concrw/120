-- Phase 1.5 Storage Buckets Setup
-- Run this in Supabase Dashboard > SQL Editor

-- 1. backgrounds 버킷 (커스텀 배경 이미지/영상)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'backgrounds',
  'backgrounds',
  true,
  52428800, -- 50MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- 2. avatar-training 버킷 (커스텀 아바타 학습용 사진)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatar-training',
  'avatar-training',
  false, -- 학습 이미지는 비공개
  10485760, -- 10MB per file
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 3. avatar-references 버킷 (하이브리드 아바타 레퍼런스)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatar-references',
  'avatar-references',
  false,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 4. custom-actions 버킷 (커스텀 동작 영상)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'custom-actions',
  'custom-actions',
  false,
  104857600, -- 100MB
  ARRAY['video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- 5. transfer-videos 버킷 (Real Model Transfer 소스 영상)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'transfer-videos',
  'transfer-videos',
  false,
  104857600, -- 100MB
  ARRAY['video/mp4', 'video/webm']
)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS 정책 추가
DO $$
BEGIN
  -- backgrounds 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Anyone can view backgrounds'
  ) THEN
    CREATE POLICY "Anyone can view backgrounds"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'backgrounds');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Authenticated users can upload backgrounds'
  ) THEN
    CREATE POLICY "Authenticated users can upload backgrounds"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'backgrounds'
      AND auth.role() = 'authenticated'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can delete their own backgrounds'
  ) THEN
    CREATE POLICY "Users can delete their own backgrounds"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'backgrounds'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- avatar-training 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can view their training images'
  ) THEN
    CREATE POLICY "Users can view their training images"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'avatar-training'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can upload training images'
  ) THEN
    CREATE POLICY "Users can upload training images"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'avatar-training'
      AND auth.role() = 'authenticated'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can delete their training images'
  ) THEN
    CREATE POLICY "Users can delete their training images"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'avatar-training'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- avatar-references 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can view their reference images'
  ) THEN
    CREATE POLICY "Users can view their reference images"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'avatar-references'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can upload reference images'
  ) THEN
    CREATE POLICY "Users can upload reference images"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'avatar-references'
      AND auth.role() = 'authenticated'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can delete their reference images'
  ) THEN
    CREATE POLICY "Users can delete their reference images"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'avatar-references'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- custom-actions 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can view their action videos'
  ) THEN
    CREATE POLICY "Users can view their action videos"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'custom-actions'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can upload action videos'
  ) THEN
    CREATE POLICY "Users can upload action videos"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'custom-actions'
      AND auth.role() = 'authenticated'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can delete their action videos'
  ) THEN
    CREATE POLICY "Users can delete their action videos"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'custom-actions'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- transfer-videos 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can view their transfer videos'
  ) THEN
    CREATE POLICY "Users can view their transfer videos"
    ON storage.objects FOR SELECT
    USING (
      bucket_id = 'transfer-videos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can upload transfer videos'
  ) THEN
    CREATE POLICY "Users can upload transfer videos"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'transfer-videos'
      AND auth.role() = 'authenticated'
    );
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
    AND policyname = 'Users can delete their transfer videos'
  ) THEN
    CREATE POLICY "Users can delete their transfer videos"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'transfer-videos'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END
$$;

-- 확인 쿼리
SELECT
  'Storage Buckets' as check_type,
  id,
  name,
  public,
  file_size_limit / 1048576 as size_limit_mb
FROM storage.buckets
WHERE id IN ('backgrounds', 'avatar-training', 'avatar-references', 'custom-actions', 'transfer-videos')
ORDER BY id;

SELECT
  'Storage Policies' as check_type,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND (
    policyname LIKE '%background%'
    OR policyname LIKE '%training%'
    OR policyname LIKE '%reference%'
    OR policyname LIKE '%action%'
    OR policyname LIKE '%transfer%'
  )
ORDER BY policyname;
