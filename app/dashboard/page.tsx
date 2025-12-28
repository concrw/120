import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getLanguage } from "@/lib/getLanguage";
import { DASHBOARD_TRANSLATIONS } from "@/lib/i18n";
import DashboardLayout from "@/components/DashboardLayout";

export default async function DashboardPage() {
  const supabase = await createClient();
  const language = await getLanguage();
  const t = DASHBOARD_TRANSLATIONS[language];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth/login");
  }

  // 사용자 프로필 정보 가져오기
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // 최근 작업 가져오기
  const { data: recentJobs } = await supabase
    .from("jobs")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(6);

  // 통계 가져오기
  const { count: totalVideos } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed");

  const { count: totalAvatars } = await supabase
    .from("avatars")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "completed");

  const { count: totalProducts } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const { count: processingJobs } = await supabase
    .from("jobs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("status", "processing");

  const credits = profile?.credits || 0;
  const displayName = profile?.display_name || user.email?.split("@")[0];

  return (
    <DashboardLayout currentPage="dashboard">
      <div className="animate-fade-in">
        {/* 환영 섹션 */}
        <div className="mb-10">
          <h2 className="text-display-sm text-secondary-900 mb-2">
            {t.welcome}, {displayName}
          </h2>
          <p className="text-body-lg text-secondary-500">
            {t.subtitle}
          </p>
        </div>

        {/* 퀵 액션 카드 */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10">
          <Link
            href="/create"
            className="card p-6 bg-gradient-to-br from-primary-500 to-primary-700 text-white hover:shadow-glow-primary transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-primary-100 text-body-sm mb-1">
                  {language === "ko" ? "새 영상 만들기" : "Create New Video"}
                </p>
                <h3 className="text-heading-lg font-bold">{t.createVideo}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <VideoIcon className="w-6 h-6" />
              </div>
            </div>
          </Link>

          <Link
            href="/avatars/create"
            className="card p-6 bg-gradient-to-br from-accent-500 to-accent-700 text-white hover:shadow-glow-accent transition-all group"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-accent-100 text-body-sm mb-1">
                  {language === "ko" ? "새 AI 모델 생성" : "Create AI Model"}
                </p>
                <h3 className="text-heading-lg font-bold">{t.manageModels}</h3>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <UserIcon className="w-6 h-6" />
              </div>
            </div>
          </Link>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
                <CreditIcon className="w-5 h-5 text-primary-600" />
              </div>
              <span className="text-body-sm text-secondary-500">{language === "ko" ? "크레딧" : "Credits"}</span>
            </div>
            <div className="text-display-xs font-bold text-secondary-900 font-mono">
              {credits}
            </div>
            {credits < 20 && (
              <Link href="/credits" className="text-caption text-primary-600 hover:underline mt-1 inline-block">
                {language === "ko" ? "충전하기 →" : "Buy more →"}
              </Link>
            )}
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-success-100 flex items-center justify-center">
                <VideoIcon className="w-5 h-5 text-success-600" />
              </div>
              <span className="text-body-sm text-secondary-500">{t.videos}</span>
            </div>
            <div className="text-display-xs font-bold text-secondary-900 font-mono">
              {totalVideos || 0}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
                <UserIcon className="w-5 h-5 text-accent-600" />
              </div>
              <span className="text-body-sm text-secondary-500">{t.models}</span>
            </div>
            <div className="text-display-xs font-bold text-secondary-900 font-mono">
              {totalAvatars || 0}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center">
                <ShirtIcon className="w-5 h-5 text-warning-600" />
              </div>
              <span className="text-body-sm text-secondary-500">{t.products}</span>
            </div>
            <div className="text-display-xs font-bold text-secondary-900 font-mono">
              {totalProducts || 0}
            </div>
          </div>
        </div>

        {/* 진행 중인 작업 알림 */}
        {processingJobs && processingJobs > 0 && (
          <div className="card p-4 mb-10 border-l-4 border-l-accent-500 bg-accent-50">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent-100 flex items-center justify-center">
                  <LoadingSpinner className="w-4 h-4 text-accent-600" />
                </div>
                <div>
                  <p className="text-body-sm font-medium text-secondary-900">
                    {language === "ko"
                      ? `${processingJobs}개의 영상이 생성 중입니다`
                      : `${processingJobs} video(s) being generated`}
                  </p>
                  <p className="text-caption text-secondary-500">
                    {language === "ko"
                      ? "완료되면 라이브러리에서 확인할 수 있습니다"
                      : "You'll find them in your library when ready"}
                  </p>
                </div>
              </div>
              <Link href="/library?filter=processing" className="btn-secondary btn-sm">
                {language === "ko" ? "확인하기" : "View"}
              </Link>
            </div>
          </div>
        )}

        {/* 최근 영상 */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-heading-md text-secondary-900">{t.recentVideos}</h3>
            {recentJobs && recentJobs.length > 0 && (
              <Link href="/library" className="text-body-sm text-primary-600 hover:text-primary-700 font-medium">
                {language === "ko" ? "모두 보기 →" : "View all →"}
              </Link>
            )}
          </div>

          {!recentJobs || recentJobs.length === 0 ? (
            <div className="card p-12 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-secondary-100 flex items-center justify-center">
                <VideoIcon className="w-8 h-8 text-secondary-400" />
              </div>
              <h4 className="text-heading-sm text-secondary-900 mb-2">{t.noVideos}</h4>
              <p className="text-body-sm text-secondary-500 mb-6 max-w-sm mx-auto">
                {language === "ko"
                  ? "AI 모델과 제품을 조합해 첫 번째 마케팅 영상을 만들어보세요"
                  : "Combine AI models and products to create your first marketing video"}
              </p>
              <Link href="/create" className="btn-primary inline-flex items-center gap-2">
                <PlusIcon className="w-4 h-4" />
                {t.createFirstVideo}
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recentJobs.map((job) => (
                <Link
                  key={job.id}
                  href={`/library?highlight=${job.id}`}
                  className="card-hover overflow-hidden group"
                >
                  <div className="aspect-video bg-secondary-100 relative overflow-hidden">
                    {job.thumbnail_url ? (
                      <img
                        src={job.thumbnail_url}
                        alt="Thumbnail"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary-100 to-secondary-200">
                        <VideoIcon className="w-10 h-10 text-secondary-300" />
                      </div>
                    )}

                    {/* Status Badge */}
                    <div className="absolute top-3 right-3">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full ${
                        job.status === "completed"
                          ? "bg-success-100 text-success-700"
                          : job.status === "processing"
                            ? "bg-accent-100 text-accent-700"
                            : job.status === "failed"
                              ? "bg-error-100 text-error-700"
                              : "bg-warning-100 text-warning-700"
                      }`}>
                        {job.status === "processing" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-accent-500 animate-pulse" />
                        )}
                        {job.status === "completed" ? t.completed :
                         job.status === "processing" ? t.processing :
                         job.status === "failed" ? t.failed : t.pending}
                      </span>
                    </div>

                    {/* Progress overlay for processing */}
                    {job.status === "processing" && (
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                        <div className="flex items-center justify-between text-xs text-white mb-1">
                          <span>{job.current_step || "Processing"}</span>
                          <span className="font-mono font-bold">{job.progress}%</span>
                        </div>
                        <div className="w-full bg-white/30 rounded-full h-1.5">
                          <div
                            className="bg-white h-full rounded-full transition-all"
                            style={{ width: `${job.progress}%` }}
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-body-sm text-secondary-600">
                        {job.video_size === "vertical" ? "9:16" : "16:9"}
                      </span>
                      <span className="text-caption text-secondary-400 font-mono">
                        {new Date(job.created_at).toLocaleDateString(
                          language === "ko" ? "ko-KR" : "en-US",
                          { month: "short", day: "numeric" }
                        )}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

// Icons
function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );
}

function ShirtIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6.115 5.19l.319 1.913A6 6 0 008.11 10.36L9.75 12v7.5h4.5V12l1.64-1.64a6 6 0 001.676-3.257l.319-1.913-3.375 1.125a6 6 0 01-3.02 0L6.115 5.19z" />
    </svg>
  );
}

function CreditIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
  );
}

function LoadingSpinner({ className }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
