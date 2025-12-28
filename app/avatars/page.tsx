import DashboardLayout from "@/components/DashboardLayout";
import AvatarStatusPolling from "@/components/AvatarStatusPolling";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { getLanguage } from "@/lib/getLanguage";
import { AVATARS_TRANSLATIONS } from "@/lib/i18n";

export default async function AvatarsPage() {
  const supabase = await createClient();
  const language = await getLanguage();
  const t = AVATARS_TRANSLATIONS[language];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 사용자의 아바타 목록 가져오기
  const { data: avatars } = await supabase
    .from("avatars")
    .select("*")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <DashboardLayout currentPage="avatars">
      {/* Polling for avatars in pending or processing state */}
      {avatars && avatars.map((avatar) => (
        (avatar.status === "pending" || avatar.status === "processing") && (
          <AvatarStatusPolling key={avatar.id} avatarId={avatar.id} currentStatus={avatar.status} />
        )
      ))}

      <div className="animate-fade-in">
        {/* 페이지 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-display-sm text-secondary-900 mb-2">
              {t.title}
            </h1>
            <p className="text-body-md text-secondary-500">
              {t.subtitle}
            </p>
          </div>
          <Link
            href="/avatars/create"
            className="btn-primary inline-flex items-center gap-2"
          >
            <PlusIcon />
            {t.createModel}
          </Link>
        </div>

        {/* 모델 목록 */}
        {!avatars || avatars.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-secondary-100 flex items-center justify-center">
              <UserIcon className="w-10 h-10 text-secondary-400" />
            </div>
            <h3 className="text-heading-md text-secondary-900 mb-2">{t.noModels}</h3>
            <p className="text-body-md text-secondary-500 mb-6 max-w-md mx-auto">
              {language === "ko"
                ? "첫 번째 AI 패션 아바타를 만들고 영상 생성을 시작하세요"
                : "Create your first AI fashion avatar to start generating videos"}
            </p>
            <Link href="/avatars/create" className="btn-primary inline-flex items-center gap-2">
              <PlusIcon />
              {t.createFirstModel}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {avatars.map((avatar) => (
              <div
                key={avatar.id}
                className="card-hover overflow-hidden group"
              >
                {/* 아바타 프리뷰 */}
                <div className="aspect-[3/4] bg-secondary-100 relative overflow-hidden">
                  {avatar.preview_images &&
                  Array.isArray(avatar.preview_images) &&
                  avatar.preview_images.length > 0 ? (
                    <img
                      src={avatar.preview_images[0]}
                      alt={avatar.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserIcon className="w-16 h-16 text-secondary-300" />
                    </div>
                  )}

                  {/* 상태 배지 */}
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={avatar.status} language={language} t={t} />
                  </div>

                  {/* 호버 오버레이 */}
                  {avatar.status === "completed" && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  )}
                </div>

                {/* 아바타 정보 */}
                <div className="p-4">
                  <h3 className="text-heading-sm text-secondary-900 mb-1 truncate">
                    {avatar.name}
                  </h3>
                  <div className="flex items-center gap-2 text-body-sm text-secondary-500 mb-4">
                    <span className="capitalize">{avatar.type}</span>
                    {avatar.style && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-secondary-300" />
                        <span className="capitalize">{avatar.style}</span>
                      </>
                    )}
                  </div>

                  {/* 액션 버튼 */}
                  <div className="flex gap-2">
                    {avatar.status === "completed" && (
                      <Link
                        href={`/create?avatar=${avatar.id}`}
                        className="flex-1 btn-primary btn-sm text-center"
                      >
                        {t.use}
                      </Link>
                    )}
                    <Link
                      href={`/avatars/${avatar.id}`}
                      className="flex-1 btn-secondary btn-sm text-center"
                    >
                      {t.details}
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MVP 안내 */}
        <div className="mt-12 card p-6 border-l-4 border-l-primary-500">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
              <InfoIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h4 className="text-heading-sm text-secondary-900 mb-1">
                {t.mvpTitle}
              </h4>
              <p className="text-body-sm text-secondary-500">
                {t.mvpDescription}
              </p>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}

// Status Badge Component
function StatusBadge({ status, language, t }: { status: string; language: string; t: any }) {
  if (status === "completed") return null;

  const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
    processing: {
      bg: "bg-accent-100",
      text: "text-accent-700",
      dot: "bg-accent-500",
      label: t.processing,
    },
    pending: {
      bg: "bg-warning-50",
      text: "text-warning-600",
      dot: "bg-warning-500",
      label: t.pending,
    },
    failed: {
      bg: "bg-error-50",
      text: "text-error-600",
      dot: "bg-error-500",
      label: t.failed,
    },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${config.bg} ${config.text} text-xs font-medium rounded-full`}>
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot} ${status === "processing" ? "animate-pulse" : ""}`} />
      {config.label}
    </span>
  );
}

// Icons
function PlusIcon() {
  return (
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function InfoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}
