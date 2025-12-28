import DashboardLayout from "@/components/DashboardLayout";
import JobStatusPolling from "@/components/JobStatusPolling";
import LibraryGrid from "@/components/LibraryGrid";
import { createClient } from "@/lib/supabase/server";
import { getLanguage } from "@/lib/getLanguage";
import { LIBRARY_TRANSLATIONS } from "@/lib/i18n";
import Link from "next/link";

export default async function LibraryPage({
  searchParams,
}: {
  searchParams?: Promise<{ filter?: string; highlight?: string }>;
}) {
  const supabase = await createClient();
  const params = await searchParams;
  const language = await getLanguage();
  const t = LIBRARY_TRANSLATIONS[language];

  const STATUS_LABELS: Record<string, string> = {
    pending: t.pending || "PENDING",
    processing: t.processing || "PROCESSING",
    completed: t.completed || "COMPLETED",
    failed: t.failed || "FAILED",
  };

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 필터 적용
  const filter = params?.filter || "all";
  let query = supabase
    .from("jobs")
    .select("*, avatars(name), products(name)")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false });

  if (filter !== "all") {
    query = query.eq("status", filter);
  }

  const { data: jobs } = await query;

  const highlightId = params?.highlight;

  // 상태별 카운트
  const statusCounts = {
    all: jobs?.length || 0,
    completed: jobs?.filter((j: any) => j.status === "completed").length || 0,
    processing: jobs?.filter((j: any) => j.status === "processing").length || 0,
    pending: jobs?.filter((j: any) => j.status === "pending").length || 0,
    failed: jobs?.filter((j: any) => j.status === "failed").length || 0,
  };

  return (
    <DashboardLayout currentPage="library">
      {/* Polling for jobs in pending or processing state */}
      {jobs && jobs.map((job: any) => (
        (job.status === "pending" || job.status === "processing") && (
          <JobStatusPolling key={job.id} jobId={job.id} currentStatus={job.status} />
        )
      ))}

      <div className="animate-fade-in">
        {/* 페이지 헤더 */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-display-sm text-secondary-900 mb-2">
              {t.title}
            </h1>
            <p className="text-body-md text-secondary-500">{t.subtitle}</p>
          </div>
          <Link href="/create" className="btn-primary inline-flex items-center gap-2">
            <PlusIcon />
            {t.createVideo}
          </Link>
        </div>

        {/* 필터 탭 */}
        <div className="flex flex-wrap gap-2 mb-8">
          {[
            { id: "all", label: t.all, count: statusCounts.all },
            { id: "completed", label: t.completed, count: statusCounts.completed, color: "success" },
            { id: "processing", label: t.processing, count: statusCounts.processing, color: "accent" },
            { id: "pending", label: t.pending, count: statusCounts.pending, color: "warning" },
            { id: "failed", label: t.failed, count: statusCounts.failed, color: "error" },
          ].map((filterOption) => (
            <a
              key={filterOption.id}
              href={`/library?filter=${filterOption.id}`}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-body-sm font-medium transition-all ${
                filter === filterOption.id
                  ? "bg-primary-600 text-white shadow-glow-primary"
                  : "bg-white border border-secondary-200 text-secondary-600 hover:border-secondary-300 hover:bg-secondary-50"
              }`}
            >
              {filterOption.label}
              {filterOption.count > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                    filter === filterOption.id
                      ? "bg-white/20 text-white"
                      : "bg-secondary-100 text-secondary-500"
                  }`}
                >
                  {filterOption.count}
                </span>
              )}
            </a>
          ))}
        </div>

        {/* 영상 목록 */}
        {!jobs || jobs.length === 0 ? (
          <div className="card p-16 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-secondary-100 flex items-center justify-center">
              <VideoIcon className="w-10 h-10 text-secondary-400" />
            </div>
            <h3 className="text-heading-md text-secondary-900 mb-2">
              {filter === "all"
                ? t.noVideos
                : typeof t.noFilteredVideos === "function"
                  ? t.noFilteredVideos(filter)
                  : t.noVideos}
            </h3>
            <p className="text-body-md text-secondary-500 mb-6 max-w-md mx-auto">
              {language === "ko"
                ? "AI 모델과 제품을 선택하여 첫 번째 마케팅 영상을 만들어보세요"
                : "Select an AI model and product to create your first marketing video"}
            </p>
            {filter === "all" && (
              <Link href="/create" className="btn-primary inline-flex items-center gap-2">
                <PlusIcon />
                {t.createVideo}
              </Link>
            )}
          </div>
        ) : (
          <LibraryGrid
            jobs={jobs}
            highlightId={highlightId}
            language={language}
            t={t}
            statusLabels={STATUS_LABELS}
          />
        )}

        {/* 안내 정보 */}
        <div className="mt-12 card p-6 border-l-4 border-l-primary-500">
          <div className="flex gap-4">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
              <InfoIcon className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h4 className="text-heading-sm text-secondary-900 mb-2">
                {t.videoGenerationInfo}
              </h4>
              <ul className="space-y-1.5 text-body-sm text-secondary-600">
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  {t.infoLine1}
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  {t.infoLine2}
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  {t.infoLine3}
                </li>
                <li className="flex items-start gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
                  {t.infoLine4}
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
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

function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
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
