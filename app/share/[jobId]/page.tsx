import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { Metadata } from "next";
import Link from "next/link";

interface Props {
  params: Promise<{ jobId: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { jobId } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("thumbnail_url, output_video_url, created_at")
    .eq("id", jobId)
    .eq("status", "completed")
    .single();

  if (!job) {
    return {
      title: "Video Not Found | AI Fashion Studio",
    };
  }

  const title = "AI Fashion Video | AI Fashion Studio";
  const description = "Check out this AI-generated fashion marketing video!";

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: "video.other",
      images: job.thumbnail_url ? [{ url: job.thumbnail_url }] : [],
      videos: job.output_video_url
        ? [
            {
              url: job.output_video_url,
              type: "video/mp4",
            },
          ]
        : [],
    },
    twitter: {
      card: "player",
      title,
      description,
      images: job.thumbnail_url ? [job.thumbnail_url] : [],
    },
  };
}

export default async function SharePage({ params }: Props) {
  const { jobId } = await params;
  const supabase = await createClient();

  const { data: job } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", jobId)
    .eq("status", "completed")
    .single();

  if (!job) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-secondary-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Video Player */}
        <div className="relative rounded-2xl overflow-hidden bg-black shadow-strong">
          <video
            src={job.output_video_url}
            poster={job.thumbnail_url}
            controls
            autoPlay
            loop
            playsInline
            className="w-full aspect-video"
          />
        </div>

        {/* Info */}
        <div className="mt-6 text-center">
          <p className="text-secondary-400 text-body-sm mb-4">
            Created with AI Fashion Studio
          </p>

          <Link
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-medium transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              />
            </svg>
            Create Your Own Video
          </Link>
        </div>

        {/* Branding */}
        <div className="mt-8 pt-8 border-t border-secondary-800 text-center">
          <h1 className="text-xl font-bold text-white mb-2">AI Fashion Studio</h1>
          <p className="text-secondary-400 text-body-sm">
            AI-powered fashion marketing video generation platform
          </p>
        </div>
      </div>
    </div>
  );
}
