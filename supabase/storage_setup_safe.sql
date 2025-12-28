-- 안전한 Storage 설정: 기존 버킷/정책이 있어도 실행 가능
-- Supabase Dashboard > SQL Editor에서 실행

-- 1. products 버킷 생성 (이미 있으면 무시)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  10485760, -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS 정책 추가 (이미 존재하면 무시)
DO $$
BEGIN
  -- SELECT 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Anyone can view product images'
  ) THEN
    CREATE POLICY "Anyone can view product images"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'products');
  END IF;

  -- INSERT 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Authenticated users can upload product images'
  ) THEN
    CREATE POLICY "Authenticated users can upload product images"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'products'
      AND auth.role() = 'authenticated'
    );
  END IF;

  -- UPDATE 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can update their own product images'
  ) THEN
    CREATE POLICY "Users can update their own product images"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'products'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;

  -- DELETE 정책
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage'
    AND tablename = 'objects'
    AND policyname = 'Users can delete their own product images'
  ) THEN
    CREATE POLICY "Users can delete their own product images"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'products'
      AND auth.uid()::text = (storage.foldername(name))[1]
    );
  END IF;
END
$$;

-- 3. 확인 쿼리
SELECT
  'Storage 버킷 확인' as check_type,
  id,
  name,
  public,
  file_size_limit
FROM storage.buckets
WHERE id = 'products';

SELECT
  'Storage 정책 확인' as check_type,
  policyname,
  cmd
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%product%'
ORDER BY policyname;
