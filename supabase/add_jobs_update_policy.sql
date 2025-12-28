-- jobs 테이블에 UPDATE 정책 추가 (재시도 기능에 필요)
CREATE POLICY IF NOT EXISTS "사용자는 자신의 작업을 업데이트할 수 있음"
  ON jobs FOR UPDATE
  USING (auth.uid() = user_id);

-- avatars 테이블에 UPDATE 정책 추가 (이미지 선택 기능에 필요)
CREATE POLICY IF NOT EXISTS "사용자는 자신의 아바타를 업데이트할 수 있음"
  ON avatars FOR UPDATE
  USING (auth.uid() = user_id);

-- products 테이블에 UPDATE 정책 추가 (향후 제품 수정 기능에 필요)
CREATE POLICY IF NOT EXISTS "사용자는 자신의 제품을 업데이트할 수 있음"
  ON products FOR UPDATE
  USING (auth.uid() = user_id);
