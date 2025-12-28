"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import VideoPlayer from "./VideoPlayer";

interface LibraryGridProps {
  jobs: any[];
  highlightId: string | undefined;
  language: string;
  t: any;
  statusLabels: Record<string, string>;
}

export default function LibraryGrid({
  jobs,
  highlightId,
  language,
  t,
  statusLabels,
}: LibraryGridProps) {
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const router = useRouter();

  const handleRetry = async (jobId: string) => {
    if (retrying) return;

    setRetrying(jobId);

    try {
      const res = await fetch("/api/jobs/retry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to retry job");
      }

      router.refresh();
    } catch (error: any) {
      console.error("Retry error:", error);
      alert(error.message || "Failed to retry job");
    } finally {
      setRetrying(null);
    }
  };

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { bg: string; text: string; dot: string; dotAnimate?: boolean }> = {
      completed: {
        bg: "bg-success-50",
        text: "text-success-700",
        dot: "bg-success-500",
      },
      processing: {
        bg: "bg-accent-100",
        text: "text-accent-700",
        dot: "bg-accent-500",
        dotAnimate: true,
      },
      pending: {
        bg: "bg-warning-50",
        text: "text-warning-700",
        dot: "bg-warning-500",
      },
      failed: {
        bg: "bg-error-50",
        text: "text-error-700",
        dot: "bg-error-500",
      },
    };
    return configs[status] || configs.pending;
  };

  return (
    <>
      {/* Video Player Modal */}
      {playingVideo && (
        <VideoPlayer
          videoUrl={playingVideo}
          onClose={() => setPlayingVideo(null)}
        />
      )}

      {/* Video Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {jobs.map((job: any) => {
          const statusConfig = getStatusConfig(job.status);

          return (
            <div
              key={job.id}
              className={`card-hover overflow-hidden group ${
                highlightId === job.id ? "ring-2 ring-primary-500 ring-offset-2" : ""
              }`}
            >
              {/* Thumbnail */}
              <div className="aspect-video bg-secondary-100 relative overflow-hidden">
                {job.thumbnail_url ? (
                  <img
                    src={job.thumbnail_url}
                    alt="Thumbnail"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-secondary-100 to-secondary-200">
                    <VideoIcon className="w-12 h-12 text-secondary-300" />
                  </div>
                )}

                {/* Status badge */}
                {job.status !== "completed" && (
                  <div className="absolute top-3 right-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-1 ${statusConfig.bg} ${statusConfig.text} text-xs font-medium rounded-full`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${statusConfig.dot} ${
                          statusConfig.dotAnimate ? "animate-pulse" : ""
                        }`}
                      />
                      {statusLabels[job.status] || "UNKNOWN"}
                    </span>
                  </div>
                )}

                {/* Play button overlay (completed videos only) */}
                {job.status === "completed" && job.output_video_url && (
                  <button
                    onClick={() => setPlayingVideo(job.output_video_url)}
                    className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/40 transition-all group/play"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center opacity-0 group-hover/play:opacity-100 transition-all duration-300 transform scale-75 group-hover/play:scale-100 shadow-strong">
                      <PlayIcon className="w-6 h-6 text-primary-600 ml-1" />
                    </div>
                  </button>
                )}

                {/* Progress overlay (processing) */}
                {job.status === "processing" && (
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                    <div className="flex items-center justify-between text-xs text-white mb-1.5">
                      <span className="truncate max-w-[70%]">
                        {job.current_step || "Processing"}
                      </span>
                      <span className="font-mono font-bold">{job.progress}%</span>
                    </div>
                    <div className="w-full bg-white/30 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-white h-full rounded-full transition-all duration-500"
                        style={{ width: `${job.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Video info */}
              <div className="p-4">
                {/* Error message (failed) */}
                {job.status === "failed" && job.error_message && (
                  <div className="mb-3 p-3 bg-error-50 rounded-xl border border-error-100">
                    <p className="text-caption text-error-700 line-clamp-2">
                      {job.error_message}
                    </p>
                  </div>
                )}

                {/* Meta info */}
                <div className="space-y-1.5 mb-4">
                  {job.avatars && (
                    <p className="text-body-sm text-secondary-500 truncate">
                      <span className="text-secondary-400">{t.model}:</span>{" "}
                      <span className="text-secondary-700 font-medium">{job.avatars.name}</span>
                    </p>
                  )}
                  {job.products && (
                    <p className="text-body-sm text-secondary-500 truncate">
                      <span className="text-secondary-400">{t.product}:</span>{" "}
                      <span className="text-secondary-700 font-medium">{job.products.name}</span>
                    </p>
                  )}
                  <p className="text-caption text-secondary-400 font-mono">
                    {new Date(job.created_at).toLocaleDateString(language === "ko" ? "ko-KR" : "en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  {job.status === "completed" && job.output_video_url && (
                    <>
                      <a
                        href={`/api/videos/download?jobId=${job.id}`}
                        className="flex-1 btn-primary btn-sm text-center inline-flex items-center justify-center gap-1.5"
                      >
                        <DownloadIcon className="w-4 h-4" />
                        {t.download}
                      </a>
                      <button
                        type="button"
                        className="flex-1 btn-secondary btn-sm inline-flex items-center justify-center gap-1.5"
                      >
                        <ShareIcon className="w-4 h-4" />
                        {t.share}
                      </button>
                    </>
                  )}
                  {job.status === "failed" && (
                    <button
                      type="button"
                      onClick={() => handleRetry(job.id)}
                      disabled={retrying === job.id}
                      className="flex-1 btn-primary btn-sm disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-1.5"
                    >
                      {retrying === job.id ? (
                        <>
                          <LoadingSpinner />
                          {language === "ko" ? "재시도 중..." : "RETRYING..."}
                        </>
                      ) : (
                        <>
                          <RetryIcon className="w-4 h-4" />
                          {t.retry}
                        </>
                      )}
                    </button>
                  )}
                  {job.status === "pending" && (
                    <div className="flex-1 text-center py-2.5 bg-secondary-50 rounded-xl">
                      <span className="text-body-sm text-secondary-500">{t.startingSoon}</span>
                    </div>
                  )}
                  {job.status === "processing" && (
                    <div className="flex-1 text-center py-2.5 bg-accent-50 rounded-xl">
                      <span className="text-body-sm text-accent-600 font-medium">
                        {language === "ko" ? "생성 중..." : "Generating..."}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// Icons
function VideoIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}

function DownloadIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
  );
}

function ShareIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
    </svg>
  );
}

function RetryIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
  );
}

function LoadingSpinner() {
  return (
    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}
