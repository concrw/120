import DashboardLayout from "@/components/DashboardLayout";
import AvatarImageSelector from "@/components/AvatarImageSelector";
import AvatarStatusPolling from "@/components/AvatarStatusPolling";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLanguage } from "@/lib/getLanguage";

export default async function AvatarDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const language = await getLanguage();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  const { data: avatar } = await supabase
    .from("avatars")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!avatar) {
    redirect("/avatars");
  }

  return (
    <DashboardLayout currentPage="avatars">
      <AvatarStatusPolling avatarId={avatar.id} currentStatus={avatar.status} />
      <div className="max-w-4xl">
        {/* 헤더 */}
        <div className="mb-8">
          <Link
            href="/avatars"
            className="text-sm text-gray-600 hover:text-black mb-4 inline-block"
          >
            ← {language === "ko" ? "모델 목록으로" : "Back to Models"}
          </Link>
          <h1 className="text-2xl font-bold tracking-tight mb-2">
            {avatar.name}
          </h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <span className="uppercase tracking-wide">{avatar.type}</span>
            {avatar.style && (
              <>
                <span>·</span>
                <span className="uppercase tracking-wide">{avatar.style}</span>
              </>
            )}
          </div>
        </div>

        {/* 상태별 콘텐츠 */}
        {avatar.status === "pending" && (
          <div className="border border-gray-300 p-12 text-center">
            <div className="text-5xl mb-4">⏳</div>
            <h3 className="text-lg font-medium mb-2">
              {language === "ko" ? "생성 대기 중" : "Waiting to Start"}
            </h3>
            <p className="text-gray-600">
              {language === "ko"
                ? "곧 생성이 시작됩니다"
                : "Generation will start soon"}
            </p>
          </div>
        )}

        {avatar.status === "processing" && (
          <div className="border border-gray-300 p-12 text-center">
            <div className="text-5xl mb-4">⚙️</div>
            <h3 className="text-lg font-medium mb-2">
              {language === "ko" ? "이미지 생성 중" : "Generating Images"}
            </h3>
            <p className="text-gray-600">
              {language === "ko"
                ? "약 2-3분 소요됩니다"
                : "This will take about 2-3 minutes"}
            </p>
          </div>
        )}

        {avatar.status === "failed" && (
          <div className="border border-red-300 bg-red-50 p-12 text-center">
            <div className="text-5xl mb-4">❌</div>
            <h3 className="text-lg font-medium mb-2 text-red-600">
              {language === "ko" ? "생성 실패" : "Generation Failed"}
            </h3>
            <p className="text-gray-600 mb-6">
              {avatar.metadata?.error_message ||
                (language === "ko"
                  ? "이미지 생성에 실패했습니다"
                  : "Failed to generate images")}
            </p>
            <button className="btn-primary">
              {language === "ko" ? "다시 시도" : "Retry"}
            </button>
          </div>
        )}

        {avatar.status === "completed" && (
          <div>
            {/* 이미지 선택 */}
            {avatar.preview_images &&
              Array.isArray(avatar.preview_images) &&
              avatar.preview_images.length > 0 && (
                <AvatarImageSelector
                  avatarId={avatar.id}
                  images={avatar.preview_images}
                  selectedImage={avatar.image_urls?.[0] || avatar.preview_images[0]}
                  language={language}
                />
              )}

            {/* 액션 버튼 */}
            <div className="mt-8 flex gap-4">
              <Link
                href={`/create?avatar=${avatar.id}`}
                className="flex-1 btn-primary text-center"
              >
                {language === "ko" ? "영상 제작하기" : "Create Video"}
              </Link>
              <button className="flex-1 btn-secondary">
                {language === "ko" ? "모델 삭제" : "Delete Model"}
              </button>
            </div>

            {/* 정보 */}
            <div className="mt-8 border border-gray-300 p-6">
              <h3 className="text-xs font-bold tracking-widest mb-4">
                {language === "ko" ? "모델 정보" : "MODEL INFO"}
              </h3>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <dt className="text-gray-600">
                    {language === "ko" ? "생성일" : "Created"}
                  </dt>
                  <dd className="font-mono">
                    {new Date(avatar.created_at).toLocaleDateString()}
                  </dd>
                </div>
                {avatar.completed_at && (
                  <div className="flex justify-between">
                    <dt className="text-gray-600">
                      {language === "ko" ? "완료일" : "Completed"}
                    </dt>
                    <dd className="font-mono">
                      {new Date(avatar.completed_at).toLocaleDateString()}
                    </dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-gray-600">
                    {language === "ko" ? "생성된 이미지" : "Generated Images"}
                  </dt>
                  <dd className="font-mono">
                    {avatar.preview_images?.length || 0}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
